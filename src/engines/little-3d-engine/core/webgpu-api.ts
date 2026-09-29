/**
 * Typed access to the slice of the WebGPU API this engine calls.
 *
 * The official `@webgpu/types` package is not a dependency: the WebGPU
 * renderers expose GPU objects through protected members, so its global types
 * would leak into the published declarations and into every consumer's
 * compile. Instead these types mirror exactly the members and descriptor fields
 * used here, with the spec's value sets and the official `__brand` markers, and
 * `tests/webgpu-types.test.mjs` checks them against `@webgpu/types` (a dev
 * dependency only).
 */

/** The marker the official types use to tell WebGPU object types apart. */
interface Branded<Brand extends string> {
  readonly __brand: Brand;
}

/** Every WebGPU object carries a debug label. */
interface GpuObject<Brand extends string> extends Branded<Brand> {
  label: string;
}

export interface GpuExtent {
  width: number;
  height: number;
}

/** The formats `getPreferredCanvasFormat()` can return, per the spec. */
export type GpuCanvasFormat = "bgra8unorm" | "rgba8unorm";
/** The texture formats this engine creates. */
export type GpuTextureFormat = GpuCanvasFormat | "depth24plus";

export interface GpuBuffer extends GpuObject<"GPUBuffer"> {
  destroy(): void;
}

export type GpuTextureView = GpuObject<"GPUTextureView">;

export interface GpuTexture extends GpuObject<"GPUTexture"> {
  createView(): GpuTextureView;
  destroy(): void;
}

export type GpuSampler = GpuObject<"GPUSampler">;
export type GpuBindGroup = GpuObject<"GPUBindGroup">;
export type GpuBindGroupLayout = GpuObject<"GPUBindGroupLayout">;
export type GpuShaderModule = GpuObject<"GPUShaderModule">;
export type GpuPipelineLayout = GpuObject<"GPUPipelineLayout">;
export type GpuCommandBuffer = GpuObject<"GPUCommandBuffer">;

export interface GpuRenderPipeline extends GpuObject<"GPURenderPipeline"> {
  getBindGroupLayout(index: number): GpuBindGroupLayout;
}

export interface GpuBindGroupLayoutEntry {
  binding: number;
  visibility: number;
  buffer?: {
    type?: "uniform" | "storage" | "read-only-storage";
    hasDynamicOffset?: boolean;
    minBindingSize?: number;
  };
  texture?: { sampleType?: "float" | "unfilterable-float" | "depth" | "sint" | "uint" };
  sampler?: { type?: "filtering" | "non-filtering" | "comparison" };
}

export interface GpuBindGroupEntry {
  binding: number;
  resource: { buffer: GpuBuffer; offset?: number; size?: number } | GpuTextureView | GpuSampler;
}

export interface GpuVertexBufferLayout {
  arrayStride: number;
  attributes: Array<{
    shaderLocation: number;
    offset: number;
    format: "float32x2" | "float32x3" | "float32x4";
  }>;
}

export type GpuBlendFactor = "zero" | "one" | "src-alpha" | "one-minus-src-alpha";

export interface GpuBlendComponent {
  srcFactor: GpuBlendFactor;
  dstFactor: GpuBlendFactor;
  operation: "add" | "subtract" | "reverse-subtract" | "min" | "max";
}

export interface GpuBlendState {
  color: GpuBlendComponent;
  alpha: GpuBlendComponent;
}

export type GpuCullMode = "none" | "front" | "back";

export interface GpuRenderPipelineDescriptor {
  layout: GpuPipelineLayout;
  vertex: { module: GpuShaderModule; entryPoint: string; buffers: GpuVertexBufferLayout[] };
  fragment: {
    module: GpuShaderModule;
    entryPoint: string;
    targets: Array<{ format: GpuCanvasFormat; blend?: GpuBlendState }>;
  };
  primitive: {
    topology: "point-list" | "line-list" | "line-strip" | "triangle-list" | "triangle-strip";
    cullMode: GpuCullMode;
    frontFace: "ccw" | "cw";
  };
  depthStencil: {
    format: "depth24plus";
    depthWriteEnabled: boolean;
    depthCompare:
      | "never"
      | "less"
      | "equal"
      | "less-equal"
      | "greater"
      | "not-equal"
      | "greater-equal"
      | "always";
  };
}

export interface GpuRenderPassDescriptor {
  colorAttachments: Array<{
    view: GpuTextureView;
    clearValue?: { r: number; g: number; b: number; a: number };
    loadOp: "load" | "clear";
    storeOp: "store" | "discard";
  }>;
  depthStencilAttachment?: {
    view: GpuTextureView;
    depthClearValue?: number;
    depthLoadOp: "load" | "clear";
    depthStoreOp: "store" | "discard";
  };
}

export interface GpuRenderPass extends GpuObject<"GPURenderPassEncoder"> {
  setPipeline(pipeline: GpuRenderPipeline): void;
  setBindGroup(index: number, group: GpuBindGroup, dynamicOffsets?: number[]): void;
  setVertexBuffer(slot: number, buffer: GpuBuffer): void;
  draw(vertexCount: number): void;
  end(): void;
}

export interface GpuCommandEncoder extends GpuObject<"GPUCommandEncoder"> {
  beginRenderPass(descriptor: GpuRenderPassDescriptor): GpuRenderPass;
  finish(): GpuCommandBuffer;
}

export interface GpuQueue extends GpuObject<"GPUQueue"> {
  writeBuffer(buffer: GpuBuffer, offset: number, data: Float32Array): void;
  writeTexture(
    destination: { texture: GpuTexture },
    data: Uint8Array,
    layout: { offset?: number; bytesPerRow?: number; rowsPerImage?: number },
    size: GpuExtent,
  ): void;
  copyExternalImageToTexture(
    source: { source: TexImageSource },
    destination: { texture: GpuTexture },
    size: GpuExtent,
  ): void;
  submit(commandBuffers: GpuCommandBuffer[]): void;
  onSubmittedWorkDone(): Promise<undefined>;
}

export interface GpuDeviceLostInfo {
  readonly reason: "unknown" | "destroyed";
  readonly message: string;
}

export interface GpuError {
  readonly message: string;
}

export interface GpuDevice extends GpuObject<"GPUDevice"> {
  readonly queue: GpuQueue;
  /** Resolves when the device stops working, including after `destroy()`. */
  readonly lost: Promise<GpuDeviceLostInfo>;
  createBuffer(descriptor: { size: number; usage: number }): GpuBuffer;
  createTexture(descriptor: {
    size: GpuExtent;
    format: GpuTextureFormat;
    usage: number;
  }): GpuTexture;
  createSampler(descriptor: {
    magFilter?: "nearest" | "linear";
    minFilter?: "nearest" | "linear";
  }): GpuSampler;
  createShaderModule(descriptor: { code: string }): GpuShaderModule;
  createBindGroupLayout(descriptor: { entries: GpuBindGroupLayoutEntry[] }): GpuBindGroupLayout;
  createPipelineLayout(descriptor: { bindGroupLayouts: GpuBindGroupLayout[] }): GpuPipelineLayout;
  createRenderPipelineAsync(descriptor: GpuRenderPipelineDescriptor): Promise<GpuRenderPipeline>;
  createBindGroup(descriptor: {
    layout: GpuBindGroupLayout;
    entries: GpuBindGroupEntry[];
  }): GpuBindGroup;
  createCommandEncoder(): GpuCommandEncoder;
  pushErrorScope(filter: "validation" | "out-of-memory" | "internal"): void;
  popErrorScope(): Promise<GpuError | null>;
  destroy(): void;
}

export interface GpuCanvasContext extends Branded<"GPUCanvasContext"> {
  configure(configuration: {
    device: GpuDevice;
    format: GpuCanvasFormat;
    alphaMode: "opaque" | "premultiplied";
  }): void;
  getCurrentTexture(): GpuTexture;
}

export interface GpuAdapter extends Branded<"GPUAdapter"> {
  requestDevice(): Promise<GpuDevice>;
}

export interface Gpu extends Branded<"GPU"> {
  requestAdapter(): Promise<GpuAdapter | null>;
  getPreferredCanvasFormat(): GpuCanvasFormat;
}

/** WebGPU's buffer-usage, texture-usage, and shader-stage flag constants. */
export interface GpuFlags {
  bufferUsage: { VERTEX: number; UNIFORM: number; COPY_DST: number };
  textureUsage: { TEXTURE_BINDING: number; COPY_DST: number; RENDER_ATTACHMENT: number };
  shaderStage: { VERTEX: number; FRAGMENT: number };
}

/** `navigator.gpu`, or `undefined` when the browser has no WebGPU. */
export function webgpu(): Gpu | undefined {
  return (globalThis as { navigator?: { gpu?: Gpu } }).navigator?.gpu;
}

/** The WebGPU flag constants from the browser globals. Call only where WebGPU exists. */
export function gpuFlags(): GpuFlags {
  const globals = globalThis as unknown as {
    GPUBufferUsage: GpuFlags["bufferUsage"];
    GPUTextureUsage: GpuFlags["textureUsage"];
    GPUShaderStage: GpuFlags["shaderStage"];
  };
  return {
    bufferUsage: globals.GPUBufferUsage,
    textureUsage: globals.GPUTextureUsage,
    shaderStage: globals.GPUShaderStage,
  };
}

/** The WebGPU context of `canvas`, or `null` when it cannot provide one. */
export function webgpuContext(canvas: HTMLCanvasElement): GpuCanvasContext | null {
  return (canvas.getContext as (type: string) => GpuCanvasContext | null).call(canvas, "webgpu");
}
