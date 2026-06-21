import type { Renderer, RenderFrame, RendererOptions } from "../renderer.js";
/** Hardware renderer using WebGPU: GPU transforms with a real depth buffer. */
export declare class WebGPURenderer implements Renderer {
    private canvas?;
    private device;
    private context;
    private pipeline;
    private uniformBuffer;
    private uniformCapacity;
    private depthTexture;
    private depthSize;
    private destroyed;
    private readonly cache;
    private readonly clearValue;
    private readonly alphaMode;
    constructor(options?: RendererOptions);
    init(canvas: HTMLCanvasElement): Promise<void>;
    resize(): void;
    private ensureDepth;
    private buffers;
    private ensureUniformCapacity;
    render(frame: RenderFrame): void;
    destroy(): void;
}
