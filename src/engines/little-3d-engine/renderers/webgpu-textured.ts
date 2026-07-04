import { expandToTriangles } from "../core/geometry.js";
import { type Mat4, multiply } from "../core/math.js";
import type { Mesh, Transparency } from "../core/mesh.js";
import {
  DEFAULT_ONE_SIDED_OPACITY,
  opacity,
  resolveTwoSidedOpacity,
  type RenderFrame,
  type RendererOptions,
  type RenderItem,
} from "../renderer.js";
import { planarUVs, type TextureSource } from "./textured-helpers.js";
import { WebGPURenderer } from "./webgpu.js";

export type { TextureSource } from "./textured-helpers.js";

const WGSL = `
struct Uniforms {
  viewProj: mat4x4<f32>,
  model: mat4x4<f32>,
  params: vec4<f32>,
};
@group(0) @binding(0) var<uniform> u: Uniforms;
@group(0) @binding(1) var tex: texture_2d<f32>;
@group(0) @binding(2) var samp: sampler;

struct VSOut {
  @builtin(position) position: vec4<f32>,
  @location(0) uv: vec2<f32>,
  @location(1) color: vec3<f32>,
};

@vertex
fn vs(@location(0) pos: vec3<f32>, @location(1) uv: vec2<f32>, @location(2) color: vec3<f32>) -> VSOut {
  var out: VSOut;
  out.uv = uv;
  out.color = color;
  out.position = u.viewProj * u.model * vec4<f32>(pos, 1.0);
  return out;
}

@fragment
fn fs(in: VSOut) -> @location(0) vec4<f32> {
  let t = textureSample(tex, samp, in.uv);
  return vec4<f32>(t.rgb * in.color, t.a * u.params.x);
}
`;

// Maps OpenGL clip space (z in -1..1) to WebGPU clip space (z in 0..1).
const CLIP_Z_FIX: Mat4 = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0.5, 0, 0, 0, 0.5, 1];

const UNIFORM_STRIDE = 256;

interface TexturedBuffers {
  position: any;
  uv: any;
  color: any;
  count: number;
}

interface BindGroupEntry {
  group: any;
  buffer: any;
  texture: any;
}

function itemOpacity(transparency: Transparency | undefined): number {
  if (!transparency) return 1;
  if (transparency.mode === "two-sided") return resolveTwoSidedOpacity(transparency).front;
  return opacity(transparency.opacity, DEFAULT_ONE_SIDED_OPACITY);
}

/**
 * WebGPU renderer with image textures on registered meshes; unregistered
 * meshes render exactly as in the plain WebGPU backend. Made for billboard
 * quads: UVs are a planar projection of the mesh's XY extent, textured faces
 * render unlit with the texture tinted by the face color, and textured
 * instances draw after the other transparent instances. Until an image URL
 * finishes loading its mesh renders with a plain white texture.
 *
 * Pass it to the engine (or an animation) as a `backend` factory so the
 * module is only fetched when used:
 *
 * ```js
 * backend: async (options) => {
 *   const { WebGPUTexturedRenderer } =
 *     await import("3d-spinner/engines/little-3d-engine/renderers/webgpu-textured");
 *   const renderer = new WebGPUTexturedRenderer(options);
 *   renderer.setTexture(mesh, "/sprite.png");
 *   return renderer;
 * }
 * ```
 */
export class WebGPUTexturedRenderer extends WebGPURenderer {
  private texturedPipeline: any;
  private sampler: any;
  private texturedUniforms: any;
  private texturedCapacity = 0;
  private readonly sources = new Map<Mesh, TextureSource>();
  private readonly textures = new Map<Mesh, any>();
  private readonly retired: any[] = [];
  private readonly texturedBuffers = new Map<Mesh, TexturedBuffers>();
  private readonly bindGroups = new Map<Mesh, BindGroupEntry>();

  /** Texture every instance of `mesh` with `source`. Call any time, also before init. */
  setTexture(mesh: Mesh, source: TextureSource): void {
    this.sources.set(mesh, source);
  }

  async init(canvas: HTMLCanvasElement): Promise<void> {
    await super.init(canvas);
    const device = this.device;
    if (!device) return;

    const format = (navigator as any).gpu.getPreferredCanvasFormat();
    const module = device.createShaderModule({ code: WGSL });
    const stage = (globalThis as any).GPUShaderStage;
    const layout = device.createBindGroupLayout({
      entries: [
        {
          binding: 0,
          visibility: stage.VERTEX | stage.FRAGMENT,
          buffer: { type: "uniform", hasDynamicOffset: true, minBindingSize: 144 },
        },
        { binding: 1, visibility: stage.FRAGMENT, texture: {} },
        { binding: 2, visibility: stage.FRAGMENT, sampler: {} },
      ],
    });
    const vertexBuffer = (location: number, components: number) => ({
      arrayStride: components * 4,
      attributes: [{ shaderLocation: location, offset: 0, format: `float32x${components}` }],
    });
    this.texturedPipeline = device.createRenderPipeline({
      layout: device.createPipelineLayout({ bindGroupLayouts: [layout] }),
      vertex: {
        module,
        entryPoint: "vs",
        buffers: [vertexBuffer(0, 3), vertexBuffer(1, 2), vertexBuffer(2, 3)],
      },
      fragment: {
        module,
        entryPoint: "fs",
        targets: [
          {
            format,
            blend: {
              color: {
                srcFactor: "src-alpha",
                dstFactor: "one-minus-src-alpha",
                operation: "add",
              },
              alpha: { srcFactor: "one", dstFactor: "one-minus-src-alpha", operation: "add" },
            },
          },
        ],
      },
      primitive: { topology: "triangle-list", cullMode: "back", frontFace: "ccw" },
      depthStencil: {
        format: "depth24plus",
        depthWriteEnabled: false,
        depthCompare: "less",
      },
    });
    this.sampler = device.createSampler({ magFilter: "linear", minFilter: "linear" });
  }

  private textureFor(mesh: Mesh): any {
    const cached = this.textures.get(mesh);
    if (cached) return cached;
    const device = this.device;
    const usage = (globalThis as any).GPUTextureUsage;
    const white = device.createTexture({
      size: { width: 1, height: 1 },
      format: "rgba8unorm",
      usage: usage.TEXTURE_BINDING | usage.COPY_DST,
    });
    device.queue.writeTexture(
      { texture: white },
      new Uint8Array([255, 255, 255, 255]),
      {},
      { width: 1, height: 1 },
    );
    this.textures.set(mesh, white);

    const upload = async (source: TexImageSource) => {
      const image =
        source instanceof HTMLImageElement ? await createImageBitmap(source) : source;
      if (this.destroyed || !this.device || this.textures.get(mesh) !== white) return;
      const width = (image as any).width || 1;
      const height = (image as any).height || 1;
      const texture = this.device.createTexture({
        size: { width, height },
        format: "rgba8unorm",
        usage: usage.TEXTURE_BINDING | usage.COPY_DST | usage.RENDER_ATTACHMENT,
      });
      this.device.queue.copyExternalImageToTexture(
        { source: image },
        { texture },
        { width, height },
      );
      // The placeholder may still be referenced by an unsubmitted command
      // buffer, so it is retired here and destroyed with the renderer.
      this.retired.push(white);
      this.textures.set(mesh, texture);
      this.bindGroups.delete(mesh);
    };
    const source = this.sources.get(mesh)!;
    if (typeof source === "string") {
      const image = new Image();
      image.onload = () => void upload(image);
      image.src = source;
    } else {
      void upload(source);
    }
    return this.textures.get(mesh);
  }

  private buffersFor(mesh: Mesh): TexturedBuffers {
    const cached = this.texturedBuffers.get(mesh);
    if (cached) return cached;
    const data = expandToTriangles(mesh);
    const usage =
      (globalThis as any).GPUBufferUsage.VERTEX | (globalThis as any).GPUBufferUsage.COPY_DST;
    const upload = (array: Float32Array) => {
      const buffer = this.device.createBuffer({ size: array.byteLength, usage });
      this.device.queue.writeBuffer(buffer, 0, array);
      return buffer;
    };
    const result: TexturedBuffers = {
      position: upload(data.positions),
      uv: upload(planarUVs(mesh)),
      color: upload(data.colors),
      count: data.count,
    };
    this.texturedBuffers.set(mesh, result);
    return result;
  }

  private bindGroupFor(mesh: Mesh): any {
    const texture = this.textureFor(mesh);
    const cached = this.bindGroups.get(mesh);
    if (cached && cached.buffer === this.texturedUniforms && cached.texture === texture) {
      return cached.group;
    }
    const group = this.device.createBindGroup({
      layout: this.texturedPipeline.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: { buffer: this.texturedUniforms, offset: 0, size: 144 } },
        { binding: 1, resource: texture.createView() },
        { binding: 2, resource: this.sampler },
      ],
    });
    this.bindGroups.set(mesh, { group, buffer: this.texturedUniforms, texture });
    return group;
  }

  render(frame: RenderFrame): void {
    const plain: RenderItem[] = [];
    const textured: RenderItem[] = [];
    for (const item of frame.items) {
      (this.sources.has(item.mesh) ? textured : plain).push(item);
    }
    super.render(textured.length ? { ...frame, items: plain } : frame);
    if (!textured.length) return;
    if (this.destroyed || !this.device || !this.context || !this.texturedPipeline) return;
    if (frame.width === 0 || frame.height === 0) return;
    this.ensureDepth();

    if (textured.length > this.texturedCapacity || !this.texturedUniforms) {
      this.texturedUniforms?.destroy?.();
      this.texturedUniforms = this.device.createBuffer({
        size: textured.length * UNIFORM_STRIDE,
        usage:
          (globalThis as any).GPUBufferUsage.UNIFORM |
          (globalThis as any).GPUBufferUsage.COPY_DST,
      });
      this.texturedCapacity = textured.length;
    }

    const viewProj = multiply(CLIP_Z_FIX, frame.viewProjection);
    textured.forEach((item, i) => {
      const data = new Float32Array(UNIFORM_STRIDE / 4);
      data.set(viewProj, 0);
      data.set(item.model, 16);
      data.set([itemOpacity(item.transparency), 0, 0, 0], 32);
      this.device.queue.writeBuffer(this.texturedUniforms, i * UNIFORM_STRIDE, data);
    });

    // The base pass skips entirely when it has no items, so this pass clears
    // the attachments in that case instead of loading them.
    const cleared = plain.length > 0;
    const encoder = this.device.createCommandEncoder();
    const pass = encoder.beginRenderPass({
      colorAttachments: [
        {
          view: this.context.getCurrentTexture().createView(),
          clearValue: this.clearValue,
          loadOp: cleared ? "load" : "clear",
          storeOp: "store",
        },
      ],
      depthStencilAttachment: {
        view: this.depthTexture.createView(),
        depthClearValue: 1,
        depthLoadOp: cleared ? "load" : "clear",
        depthStoreOp: "store",
      },
    });
    pass.setPipeline(this.texturedPipeline);
    textured.forEach((item, i) => {
      const mesh = this.buffersFor(item.mesh);
      pass.setBindGroup(0, this.bindGroupFor(item.mesh), [i * UNIFORM_STRIDE]);
      pass.setVertexBuffer(0, mesh.position);
      pass.setVertexBuffer(1, mesh.uv);
      pass.setVertexBuffer(2, mesh.color);
      pass.draw(mesh.count);
    });
    pass.end();
    this.device.queue.submit([encoder.finish()]);
  }

  destroy(): void {
    for (const texture of this.textures.values()) texture.destroy?.();
    for (const texture of this.retired.splice(0)) texture.destroy?.();
    for (const buffers of this.texturedBuffers.values()) {
      buffers.position.destroy?.();
      buffers.uv.destroy?.();
      buffers.color.destroy?.();
    }
    this.textures.clear();
    this.texturedBuffers.clear();
    this.bindGroups.clear();
    this.sources.clear();
    this.texturedUniforms?.destroy?.();
    this.texturedUniforms = undefined;
    this.texturedPipeline = undefined;
    this.sampler = undefined;
    super.destroy();
  }
}
