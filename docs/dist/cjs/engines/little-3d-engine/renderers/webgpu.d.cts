import type { Mesh } from "../core/mesh.cjs";
import { type GpuCanvasContext, type GpuCanvasFormat, type GpuDevice, type GpuTexture } from "../core/webgpu-api.cjs";
import { type Renderer, type RenderFrame, type RendererOptions } from "../renderer.cjs";
/** Hardware renderer using WebGPU: GPU transforms with a real depth buffer. */
export declare class WebGPURenderer implements Renderer {
    private canvas?;
    protected device?: GpuDevice;
    protected context?: GpuCanvasContext;
    protected format?: GpuCanvasFormat;
    private pipelines?;
    private uniformBuffer?;
    private uniformCapacity;
    protected depthTexture?: GpuTexture;
    private depthSize;
    protected destroyed: boolean;
    private readonly cache;
    private readonly uniformScratch;
    protected readonly clearValue: {
        r: number;
        g: number;
        b: number;
        a: number;
    };
    private readonly alphaMode;
    constructor(options?: RendererOptions);
    init(canvas: HTMLCanvasElement): Promise<void>;
    /** Configure the canvas for `device` and build the opaque and transparent pipelines. */
    private createPipelines;
    /**
     * Run `setup` inside a WebGPU validation error scope and throw if it reported
     * an error. Most WebGPU calls report mistakes that way instead of throwing, so
     * without the scope a broken setup would look like success and `"auto"` would
     * not fall back. `setup` must make its GPU calls before its first `await`.
     */
    protected validated<T>(device: GpuDevice, setup: () => Promise<T>): Promise<T>;
    resize(): void;
    /** The depth texture for the current canvas size, recreated when the size changes. */
    protected ensureDepth(): GpuTexture | undefined;
    private getOrCreateMeshBuffers;
    /** The uniform buffer, grown to hold at least `draws` uniform blocks. */
    private ensureUniformCapacity;
    render(frame: RenderFrame): void;
    /** Destroy the vertex buffers cached for `mesh`. */
    releaseMesh(mesh: Mesh): void;
    /** Tell `listener` when the GPU device is lost, unless this renderer destroyed it. */
    onLost(listener: (reason: string) => void): void;
    destroy(): void;
}
