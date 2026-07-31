import { expandToTriangles, parseColor } from "../core/geometry.js";
import { type Mat4, multiply } from "../core/math.js";
import type { Mesh } from "../core/mesh.js";
import {
  DEFAULT_ONE_SIDED_OPACITY,
  opacity,
  resolveTwoSidedOpacity,
  type RenderItem,
  type Renderer,
  type RenderFrame,
  type RendererOptions,
} from "../renderer.js";

const WGSL = `
struct Uniforms {
  viewProj: mat4x4<f32>,
  model: mat4x4<f32>,
  toLight: vec4<f32>,
  params: vec4<f32>,
};
@group(0) @binding(0) var<uniform> u: Uniforms;

struct VSOut {
  @builtin(position) position: vec4<f32>,
  @location(0) normal: vec3<f32>,
  @location(1) color: vec3<f32>,
  @location(2) emissive: vec3<f32>,
};

@vertex
fn vs(@location(0) pos: vec3<f32>, @location(1) normal: vec3<f32>, @location(2) color: vec3<f32>, @location(3) emissive: vec3<f32>) -> VSOut {
  var out: VSOut;
  let m = mat3x3<f32>(u.model[0].xyz, u.model[1].xyz, u.model[2].xyz);
  out.normal = m * normal;
  out.color = color;
  out.emissive = emissive;
  out.position = u.viewProj * u.model * vec4<f32>(pos, 1.0);
  return out;
}

@fragment
fn fs(in: VSOut) -> @location(0) vec4<f32> {
  let lambert = max(dot(normalize(in.normal), normalize(u.toLight.xyz)), 0.0);
  let brightness = clamp(u.params.y + u.params.x * lambert, 0.0, 1.0);
  let lit = in.color * brightness + in.emissive;
  return vec4<f32>(lit, u.params.z);
}
`;

// Maps OpenGL clip space (z in -1..1) to WebGPU clip space (z in 0..1).
const CLIP_Z_FIX: Mat4 = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0.5, 0, 0, 0, 0.5, 1];

const UNIFORM_STRIDE = 256;

interface MeshBuffers {
  position: any;
  normal: any;
  color: any;
  emissive: any;
  count: number;
}

interface Draw {
  item: RenderItem;
  opacity: number;
  pipeline: any;
}

/** Hardware renderer using WebGPU: GPU transforms with a real depth buffer. */
export class WebGPURenderer implements Renderer {
  private canvas?: HTMLCanvasElement;
  protected device: any;
  protected context: any;
  private pipeline: any;
  private transparentBackPipeline: any;
  private transparentFrontPipeline: any;
  private uniformBuffer: any;
  private uniformCapacity = 0;
  protected depthTexture: any;
  private depthSize = "";
  protected destroyed = false;
  private readonly cache = new Map<Mesh, MeshBuffers>();
  protected readonly clearValue: { r: number; g: number; b: number; a: number };
  private readonly alphaMode: string;

  constructor(options: RendererOptions = {}) {
    if (options.background) {
      const [r, g, b] = parseColor(options.background);
      this.clearValue = { r: r / 255, g: g / 255, b: b / 255, a: 1 };
      this.alphaMode = "opaque";
    } else {
      this.clearValue = { r: 0, g: 0, b: 0, a: 0 };
      this.alphaMode = "premultiplied";
    }
  }

  async init(canvas: HTMLCanvasElement): Promise<void> {
    const gpu = (navigator as any).gpu;
    if (!gpu) throw new Error("3d-spinner: WebGPU is not supported in this browser.");
    const adapter = await gpu.requestAdapter();
    if (!adapter) throw new Error("3d-spinner: no WebGPU adapter is available.");
    const device = await adapter.requestDevice();
    if (this.destroyed) {
      device.destroy?.();
      return;
    }

    const context = canvas.getContext("webgpu") as any;
    if (!context) throw new Error("3d-spinner: could not get a WebGPU canvas context.");
    const format = gpu.getPreferredCanvasFormat();
    context.configure({ device, format, alphaMode: this.alphaMode });

    const module = device.createShaderModule({ code: WGSL });
    const stage = (globalThis as any).GPUShaderStage;
    const layout = device.createBindGroupLayout({
      entries: [
        {
          binding: 0,
          visibility: stage.VERTEX | stage.FRAGMENT,
          buffer: { type: "uniform", hasDynamicOffset: true, minBindingSize: 160 },
        },
      ],
    });
    const vertexBuffer = (location: number) => ({
      arrayStride: 12,
      attributes: [{ shaderLocation: location, offset: 0, format: "float32x3" }],
    });
    const pipelineLayout = device.createPipelineLayout({ bindGroupLayouts: [layout] });
    const blend = {
      color: {
        srcFactor: "src-alpha",
        dstFactor: "one-minus-src-alpha",
        operation: "add",
      },
      alpha: { srcFactor: "one", dstFactor: "one-minus-src-alpha", operation: "add" },
    };
    const pipeline = (cullMode: string, transparent: boolean) => device.createRenderPipeline({
      layout: pipelineLayout,
      vertex: {
        module,
        entryPoint: "vs",
        buffers: [vertexBuffer(0), vertexBuffer(1), vertexBuffer(2), vertexBuffer(3)],
      },
      fragment: {
        module,
        entryPoint: "fs",
        targets: [{ format, ...(transparent ? { blend } : {}) }],
      },
      primitive: { topology: "triangle-list", cullMode, frontFace: "ccw" },
      depthStencil: {
        format: "depth24plus",
        depthWriteEnabled: !transparent,
        depthCompare: "less",
      },
    });
    this.pipeline = pipeline("back", false);
    this.transparentBackPipeline = pipeline("front", true);
    this.transparentFrontPipeline = pipeline("back", true);

    this.canvas = canvas;
    this.device = device;
    this.context = context;
  }

  resize(): void {
    this.ensureDepth();
  }

  protected ensureDepth(): void {
    const canvas = this.canvas;
    if (!this.device || !canvas) return;
    const width = Math.max(1, canvas.width);
    const height = Math.max(1, canvas.height);
    const key = `${width}x${height}`;
    if (key === this.depthSize && this.depthTexture) return;
    this.depthTexture?.destroy?.();
    this.depthTexture = this.device.createTexture({
      size: { width, height },
      format: "depth24plus",
      usage: (globalThis as any).GPUTextureUsage.RENDER_ATTACHMENT,
    });
    this.depthSize = key;
  }

  private buffers(mesh: Mesh): MeshBuffers {
    const cached = this.cache.get(mesh);
    if (cached) return cached;
    const data = expandToTriangles(mesh);
    const usage =
      (globalThis as any).GPUBufferUsage.VERTEX | (globalThis as any).GPUBufferUsage.COPY_DST;
    const upload = (array: Float32Array) => {
      const buffer = this.device.createBuffer({ size: array.byteLength, usage });
      this.device.queue.writeBuffer(buffer, 0, array);
      return buffer;
    };
    const result: MeshBuffers = {
      position: upload(data.positions),
      normal: upload(data.normals),
      color: upload(data.colors),
      emissive: upload(data.emissives),
      count: data.count,
    };
    this.cache.set(mesh, result);
    return result;
  }

  private ensureUniformCapacity(draws: number): void {
    if (draws <= this.uniformCapacity && this.uniformBuffer) return;
    this.uniformBuffer?.destroy?.();
    this.uniformBuffer = this.device.createBuffer({
      size: Math.max(1, draws) * UNIFORM_STRIDE,
      usage:
        (globalThis as any).GPUBufferUsage.UNIFORM | (globalThis as any).GPUBufferUsage.COPY_DST,
    });
    this.uniformCapacity = draws;
  }

  render(frame: RenderFrame): void {
    if (this.destroyed || !this.device || !this.context || !this.pipeline) return;
    if (frame.width === 0 || frame.height === 0 || frame.items.length === 0) return;
    this.ensureDepth();
    const draws: Draw[] = [];
    for (const item of frame.items) {
      if (!item.transparency) draws.push({ item, opacity: 1, pipeline: this.pipeline });
    }
    for (const item of frame.items) {
      const transparency = item.transparency;
      if (!transparency) continue;
      if (transparency.mode === "two-sided") {
        const resolved = resolveTwoSidedOpacity(transparency);
        draws.push({
          item,
          opacity: resolved.back,
          pipeline: this.transparentBackPipeline,
        });
        draws.push({
          item,
          opacity: resolved.front,
          pipeline: this.transparentFrontPipeline,
        });
      } else {
        draws.push({
          item,
          opacity: opacity(transparency.opacity, DEFAULT_ONE_SIDED_OPACITY),
          pipeline: this.transparentFrontPipeline,
        });
      }
    }
    this.ensureUniformCapacity(draws.length);

    const viewProj = multiply(CLIP_Z_FIX, frame.viewProjection);
    const layout = this.pipeline.getBindGroupLayout(0);
    const bindGroup = this.device.createBindGroup({
      layout,
      entries: [
        { binding: 0, resource: { buffer: this.uniformBuffer, offset: 0, size: 160 } },
      ],
    });

    draws.forEach((draw, i) => {
      const data = new Float32Array(UNIFORM_STRIDE / 4);
      data.set(viewProj, 0);
      data.set(draw.item.model, 16);
      data.set([frame.light.toLight.x, frame.light.toLight.y, frame.light.toLight.z, 0], 32);
      data.set([frame.light.intensity, frame.light.ambient, draw.opacity, 0], 36);
      this.device.queue.writeBuffer(this.uniformBuffer, i * UNIFORM_STRIDE, data);
    });

    const encoder = this.device.createCommandEncoder();
    const pass = encoder.beginRenderPass({
      colorAttachments: [
        {
          view: this.context.getCurrentTexture().createView(),
          clearValue: this.clearValue,
          loadOp: "clear",
          storeOp: "store",
        },
      ],
      depthStencilAttachment: {
        view: this.depthTexture.createView(),
        depthClearValue: 1,
        depthLoadOp: "clear",
        depthStoreOp: "store",
      },
    });
    draws.forEach((draw, i) => {
      const mesh = this.buffers(draw.item.mesh);
      pass.setPipeline(draw.pipeline);
      pass.setBindGroup(0, bindGroup, [i * UNIFORM_STRIDE]);
      pass.setVertexBuffer(0, mesh.position);
      pass.setVertexBuffer(1, mesh.normal);
      pass.setVertexBuffer(2, mesh.color);
      pass.setVertexBuffer(3, mesh.emissive);
      pass.draw(mesh.count);
    });
    pass.end();
    this.device.queue.submit([encoder.finish()]);
  }

  destroy(): void {
    this.destroyed = true;
    for (const mesh of this.cache.values()) {
      mesh.position.destroy?.();
      mesh.normal.destroy?.();
      mesh.color.destroy?.();
      mesh.emissive.destroy?.();
    }
    this.cache.clear();
    this.uniformBuffer?.destroy?.();
    this.depthTexture?.destroy?.();
    this.device?.destroy?.();
    this.device = undefined;
    this.context = undefined;
    this.pipeline = undefined;
    this.transparentBackPipeline = undefined;
    this.transparentFrontPipeline = undefined;
    this.uniformBuffer = undefined;
    this.depthTexture = undefined;
    this.canvas = undefined;
  }
}
