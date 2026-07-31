import { type Renderer, type RenderFrame, type RendererOptions } from "../renderer.js";
/** Hardware renderer using WebGPU: GPU transforms with a real depth buffer. */
export declare class WebGPURenderer implements Renderer {
    private canvas?;
    protected device: any;
    protected context: any;
    private pipeline;
    private transparentBackPipeline;
    private transparentFrontPipeline;
    private uniformBuffer;
    private uniformCapacity;
    protected depthTexture: any;
    private depthSize;
    protected destroyed: boolean;
    private readonly cache;
    protected readonly clearValue: {
        r: number;
        g: number;
        b: number;
        a: number;
    };
    private readonly alphaMode;
    constructor(options?: RendererOptions);
    init(canvas: HTMLCanvasElement): Promise<void>;
    resize(): void;
    protected ensureDepth(): void;
    private buffers;
    private ensureUniformCapacity;
    render(frame: RenderFrame): void;
    destroy(): void;
}
