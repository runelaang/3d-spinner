import { expandToTriangles, parseColor } from "../core/geometry.js";
import { type Mat4, multiply } from "../core/math.js";
import type { Mesh } from "../core/mesh.js";
import {
  gpuFlags,
  webgpu,
  webgpuContext,
  type GpuBuffer,
  type GpuCanvasContext,
  type GpuDevice,
  type GpuRenderPipeline,
  type GpuTexture,
} from "../core/webgpu-api.js";
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
  eye: vec4<f32>,
};
@group(0) @binding(0) var<uniform> u: Uniforms;

struct VSOut {
  @builtin(position) position: vec4<f32>,
  @location(0) normal: vec3<f32>,
  @location(1) color: vec3<f32>,
  @location(2) ambient: vec3<f32>,
  @location(3) emissive: vec3<f32>,
  @location(4) specular: vec4<f32>,
  @location(5) worldPos: vec3<f32>,
};

@vertex
fn vs(@location(0) pos: vec3<f32>, @location(1) normal: vec3<f32>, @location(2) color: vec3<f32>, @location(3) ambient: vec3<f32>, @location(4) emissive: vec3<f32>, @location(5) specular: vec4<f32>) -> VSOut {
  var out: VSOut;
  let m = mat3x3<f32>(u.model[0].xyz, u.model[1].xyz, u.model[2].xyz);
  out.normal = m * normal;
  out.color = color;
  out.ambient = ambient;
  out.emissive = emissive;
  out.specular = specular;
  let world = u.model * vec4<f32>(pos, 1.0);
  out.worldPos = world.xyz;
  out.position = u.viewProj * world;
  return out;
}

@fragment
fn fs(in: VSOut) -> @location(0) vec4<f32> {
  let normal = normalize(in.normal);
  let toLight = normalize(u.toLight.xyz);
  let lambert = max(dot(normal, toLight), 0.0);
  let brightness = clamp(u.params.y * in.ambient + vec3<f32>(u.params.x * lambert), vec3<f32>(0.0), vec3<f32>(1.0));
  var lit = in.color * brightness;
  if (lambert > 0.0) {
    let viewDir = normalize(u.eye.xyz - in.worldPos);
    let halfVec = normalize(toLight + viewDir);
    let highlight = pow(max(dot(normal, halfVec), 0.0), in.specular.w) * u.params.x;
    lit = lit + highlight * in.specular.xyz;
  }
  lit = lit + in.emissive;
  return vec4<f32>(lit, u.params.z);
}
`;

// Maps OpenGL clip space (z in -1..1) to WebGPU clip space (z in 0..1).
const CLIP_Z_FIX: Mat4 = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0.5, 0, 0, 0, 0.5, 1];

const UNIFORM_STRIDE = 256;

interface MeshBuffers {
  position: GpuBuffer;
  normal: GpuBuffer;
  color: GpuBuffer;
  ambient: GpuBuffer;
  emissive: GpuBuffer;
  specular: GpuBuffer;
  count: number;
}

interface Pipelines {
  opaque: GpuRenderPipeline;
  transparentBack: GpuRenderPipeline;
  transparentFront: GpuRenderPipeline;
}

interface Draw {
  item: RenderItem;
  opacity: number;
  pipeline: GpuRenderPipeline;
}

/** Hardware renderer using WebGPU: GPU transforms with a real depth buffer. */
export class WebGPURenderer implements Renderer {
  private canvas?: HTMLCanvasElement;
  protected device?: GpuDevice;
  protected context?: GpuCanvasContext;
  protected format?: string;
  private pipelines?: Pipelines;
  private uniformBuffer?: GpuBuffer;
  private uniformCapacity = 0;
  protected depthTexture?: GpuTexture;
  private depthSize = "";
  protected destroyed = false;
  private readonly cache = new Map<Mesh, MeshBuffers>();
  private readonly uniformScratch = new Float32Array(UNIFORM_STRIDE / 4);
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
    const gpu = webgpu();
    if (!gpu) throw new Error("3d-spinner: WebGPU is not supported in this browser.");
    const adapter = await gpu.requestAdapter();
    if (!adapter) throw new Error("3d-spinner: no WebGPU adapter is available.");
    const device = await adapter.requestDevice();
    if (this.destroyed) {
      device.destroy();
      return;
    }
    // Every acquired resource gets an owner before the next step can fail, so a
    // failed init is fully released by destroy().
    this.device = device;
    this.canvas = canvas;

    const context = webgpuContext(canvas);
    if (!context) throw new Error("3d-spinner: could not get a WebGPU canvas context.");
    this.context = context;
    const format = gpu.getPreferredCanvasFormat();
    this.format = format;
    context.configure({ device, format, alphaMode: this.alphaMode });

    const module = device.createShaderModule({ code: WGSL });
    const stage = gpuFlags().shaderStage;
    const layout = device.createBindGroupLayout({
      entries: [
        {
          binding: 0,
          visibility: stage.VERTEX | stage.FRAGMENT,
          buffer: { type: "uniform", hasDynamicOffset: true, minBindingSize: 176 },
        },
      ],
    });
    const vertexBuffer = (location: number, components = 3) => ({
      arrayStride: components * 4,
      attributes: [
        { shaderLocation: location, offset: 0, format: `float32x${components}` },
      ],
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
        buffers: [
          vertexBuffer(0),
          vertexBuffer(1),
          vertexBuffer(2),
          vertexBuffer(3),
          vertexBuffer(4),
          vertexBuffer(5, 4),
        ],
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
    this.pipelines = {
      opaque: pipeline("back", false),
      transparentBack: pipeline("front", true),
      transparentFront: pipeline("back", true),
    };
  }

  resize(): void {
    this.ensureDepth();
  }

  /** The depth texture for the current canvas size, recreated when the size changes. */
  protected ensureDepth(): GpuTexture | undefined {
    const canvas = this.canvas;
    const device = this.device;
    if (!device || !canvas) return undefined;
    const width = Math.max(1, canvas.width);
    const height = Math.max(1, canvas.height);
    const key = `${width}x${height}`;
    if (key === this.depthSize && this.depthTexture) return this.depthTexture;
    this.depthTexture?.destroy();
    this.depthTexture = device.createTexture({
      size: { width, height },
      format: "depth24plus",
      usage: gpuFlags().textureUsage.RENDER_ATTACHMENT,
    });
    this.depthSize = key;
    return this.depthTexture;
  }

  private getOrCreateMeshBuffers(device: GpuDevice, mesh: Mesh): MeshBuffers {
    const cached = this.cache.get(mesh);
    if (cached) return cached;
    const data = expandToTriangles(mesh);
    const flags = gpuFlags().bufferUsage;
    const usage = flags.VERTEX | flags.COPY_DST;
    const upload = (array: Float32Array) => {
      const buffer = device.createBuffer({ size: array.byteLength, usage });
      device.queue.writeBuffer(buffer, 0, array);
      return buffer;
    };
    const result: MeshBuffers = {
      position: upload(data.positions),
      normal: upload(data.normals),
      color: upload(data.colors),
      ambient: upload(data.ambients),
      emissive: upload(data.emissives),
      specular: upload(data.speculars),
      count: data.count,
    };
    this.cache.set(mesh, result);
    return result;
  }

  /** The uniform buffer, grown to hold at least `draws` uniform blocks. */
  private ensureUniformCapacity(device: GpuDevice, draws: number): GpuBuffer {
    if (draws <= this.uniformCapacity && this.uniformBuffer) return this.uniformBuffer;
    this.uniformBuffer?.destroy();
    const flags = gpuFlags().bufferUsage;
    this.uniformBuffer = device.createBuffer({
      size: Math.max(1, draws) * UNIFORM_STRIDE,
      usage: flags.UNIFORM | flags.COPY_DST,
    });
    this.uniformCapacity = draws;
    return this.uniformBuffer;
  }

  render(frame: RenderFrame): void {
    const device = this.device;
    const context = this.context;
    const pipelines = this.pipelines;
    if (this.destroyed || !device || !context || !pipelines) return;
    if (frame.width === 0 || frame.height === 0 || frame.items.length === 0) return;
    const depth = this.ensureDepth();
    if (!depth) return;
    const draws: Draw[] = [];
    for (const item of frame.items) {
      if (!item.transparency) draws.push({ item, opacity: 1, pipeline: pipelines.opaque });
    }
    for (const item of frame.items) {
      const transparency = item.transparency;
      if (!transparency) continue;
      if (transparency.mode === "two-sided") {
        const resolved = resolveTwoSidedOpacity(transparency);
        draws.push({
          item,
          opacity: resolved.back,
          pipeline: pipelines.transparentBack,
        });
        draws.push({
          item,
          opacity: resolved.front,
          pipeline: pipelines.transparentFront,
        });
      } else {
        draws.push({
          item,
          opacity: opacity(transparency.opacity, DEFAULT_ONE_SIDED_OPACITY),
          pipeline: pipelines.transparentFront,
        });
      }
    }
    const uniforms = this.ensureUniformCapacity(device, draws.length);

    const viewProj = multiply(CLIP_Z_FIX, frame.viewProjection);
    const bindGroup = device.createBindGroup({
      layout: pipelines.opaque.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: { buffer: uniforms, offset: 0, size: 176 } },
      ],
    });

    draws.forEach((draw, i) => {
      const data = this.uniformScratch;
      data.set(viewProj, 0);
      data.set(draw.item.model, 16);
      data.set([frame.light.toLight.x, frame.light.toLight.y, frame.light.toLight.z, 0], 32);
      data.set([frame.light.intensity, frame.light.ambient, draw.opacity, 0], 36);
      data.set([frame.eye.x, frame.eye.y, frame.eye.z, 0], 40);
      device.queue.writeBuffer(uniforms, i * UNIFORM_STRIDE, data);
    });

    const encoder = device.createCommandEncoder();
    const pass = encoder.beginRenderPass({
      colorAttachments: [
        {
          view: context.getCurrentTexture().createView(),
          clearValue: this.clearValue,
          loadOp: "clear",
          storeOp: "store",
        },
      ],
      depthStencilAttachment: {
        view: depth.createView(),
        depthClearValue: 1,
        depthLoadOp: "clear",
        depthStoreOp: "store",
      },
    });
    draws.forEach((draw, i) => {
      const mesh = this.getOrCreateMeshBuffers(device, draw.item.mesh);
      pass.setPipeline(draw.pipeline);
      pass.setBindGroup(0, bindGroup, [i * UNIFORM_STRIDE]);
      pass.setVertexBuffer(0, mesh.position);
      pass.setVertexBuffer(1, mesh.normal);
      pass.setVertexBuffer(2, mesh.color);
      pass.setVertexBuffer(3, mesh.ambient);
      pass.setVertexBuffer(4, mesh.emissive);
      pass.setVertexBuffer(5, mesh.specular);
      pass.draw(mesh.count);
    });
    pass.end();
    device.queue.submit([encoder.finish()]);
  }

  /** Destroy the vertex buffers cached for `mesh`. */
  releaseMesh(mesh: Mesh): void {
    const cached = this.cache.get(mesh);
    if (!cached) return;
    this.cache.delete(mesh);
    cached.position.destroy();
    cached.normal.destroy();
    cached.color.destroy();
    cached.ambient.destroy();
    cached.emissive.destroy();
    cached.specular.destroy();
  }

  destroy(): void {
    this.destroyed = true;
    for (const mesh of [...this.cache.keys()]) this.releaseMesh(mesh);
    this.uniformBuffer?.destroy();
    this.depthTexture?.destroy();
    this.device?.destroy();
    this.device = undefined;
    this.context = undefined;
    this.pipelines = undefined;
    this.uniformBuffer = undefined;
    this.depthTexture = undefined;
    this.canvas = undefined;
  }
}
