/**
 * Typed access to the slice of the WebGPU API this engine calls.
 *
 * The official `@webgpu/types` package is deliberately not used: the WebGPU
 * renderers expose GPU objects through protected members, so a types package
 * would leak into the published declarations and into every consumer's compile,
 * and the package stays free of dependencies. These interfaces cover exactly
 * the members used here; descriptor objects are typed loosely.
 */

/** Every WebGPU object carries a debug label. */
interface GpuObject {
  label: string;
}

export interface GpuExtent {
  width: number;
  height: number;
}

export interface GpuBuffer extends GpuObject {
  destroy(): void;
}

export type GpuTextureView = GpuObject;

export interface GpuTexture extends GpuObject {
  createView(): GpuTextureView;
  destroy(): void;
}

export type GpuSampler = GpuObject;
export type GpuBindGroup = GpuObject;
export type GpuBindGroupLayout = GpuObject;
export type GpuShaderModule = GpuObject;
export type GpuPipelineLayout = GpuObject;
export type GpuCommandBuffer = GpuObject;

export interface GpuRenderPipeline extends GpuObject {
  getBindGroupLayout(index: number): GpuBindGroupLayout;
}

export interface GpuRenderPass {
  setPipeline(pipeline: GpuRenderPipeline): void;
  setBindGroup(index: number, group: GpuBindGroup, dynamicOffsets?: number[]): void;
  setVertexBuffer(slot: number, buffer: GpuBuffer): void;
  draw(vertexCount: number): void;
  end(): void;
}

export interface GpuCommandEncoder {
  beginRenderPass(descriptor: {
    colorAttachments: Array<Record<string, unknown> & { view: GpuTextureView }>;
    depthStencilAttachment?: Record<string, unknown> & { view: GpuTextureView };
  }): GpuRenderPass;
  finish(): GpuCommandBuffer;
}

export interface GpuQueue {
  writeBuffer(buffer: GpuBuffer, offset: number, data: Float32Array): void;
  writeTexture(
    destination: { texture: GpuTexture },
    data: Uint8Array,
    layout: Record<string, unknown>,
    size: GpuExtent,
  ): void;
  copyExternalImageToTexture(
    source: { source: TexImageSource },
    destination: { texture: GpuTexture },
    size: GpuExtent,
  ): void;
  submit(commandBuffers: GpuCommandBuffer[]): void;
}

export interface GpuDevice {
  readonly queue: GpuQueue;
  createBuffer(descriptor: { size: number; usage: number }): GpuBuffer;
  createTexture(descriptor: { size: GpuExtent; format: string; usage: number }): GpuTexture;
  createSampler(descriptor: { magFilter: string; minFilter: string }): GpuSampler;
  createShaderModule(descriptor: { code: string }): GpuShaderModule;
  createBindGroupLayout(descriptor: {
    entries: Array<Record<string, unknown>>;
  }): GpuBindGroupLayout;
  createPipelineLayout(descriptor: { bindGroupLayouts: GpuBindGroupLayout[] }): GpuPipelineLayout;
  // Descriptors are loosely typed on purpose: exact types would mean the `@webgpu/types`
  // dependency or hand-copying the spec. The few fixed descriptors are covered by the browser tests.
  createRenderPipelineAsync(descriptor: Record<string, unknown>): Promise<GpuRenderPipeline>;
  createBindGroup(descriptor: {
    layout: GpuBindGroupLayout;
    entries: Array<{ binding: number; resource: unknown }>;
  }): GpuBindGroup;
  createCommandEncoder(): GpuCommandEncoder;
  destroy(): void;
}

export interface GpuCanvasContext {
  configure(configuration: { device: GpuDevice; format: string; alphaMode: string }): void;
  getCurrentTexture(): GpuTexture;
}

export interface GpuAdapter {
  requestDevice(): Promise<GpuDevice>;
}

export interface Gpu {
  requestAdapter(): Promise<GpuAdapter | null>;
  getPreferredCanvasFormat(): string;
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
