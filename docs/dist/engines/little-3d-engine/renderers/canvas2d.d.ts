import { type Renderer, type RenderFrame, type RendererOptions } from "../renderer.js";
/** Software renderer: projects geometry on the CPU and fills 2D polygons. */
export declare class Canvas2DRenderer implements Renderer {
    private readonly options;
    private ctx?;
    private dpr;
    constructor(options?: RendererOptions);
    init(canvas: HTMLCanvasElement): void;
    resize(_cssWidth: number, _cssHeight: number, dpr: number): void;
    render(frame: RenderFrame): void;
    destroy(): void;
}
