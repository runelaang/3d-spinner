import { type Renderer, type RenderFrame, type RendererOptions } from "../renderer.js";
/** Hardware renderer using WebGL2: GPU transforms with a real depth buffer. */
export declare class WebGLRenderer implements Renderer {
    private gl?;
    private program?;
    private locations?;
    private readonly cache;
    private readonly clearColor;
    constructor(options?: RendererOptions);
    init(canvas: HTMLCanvasElement): void;
    resize(): void;
    private buffers;
    render(frame: RenderFrame): void;
    destroy(): void;
}
