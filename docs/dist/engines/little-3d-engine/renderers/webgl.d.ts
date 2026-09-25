import type { Mesh } from "../core/mesh.js";
import { type Renderer, type RenderFrame, type RendererOptions } from "../renderer.js";
/** Hardware renderer using WebGL2: GPU transforms with a real depth buffer. */
export declare class WebGLRenderer implements Renderer {
    private gl?;
    private canvas?;
    private program?;
    private locations?;
    private destroyed;
    private readonly cache;
    private readonly modelScratch;
    private readonly clearColor;
    constructor(options?: RendererOptions);
    init(canvas: HTMLCanvasElement): void;
    resize(): void;
    private getOrCreateMeshBuffers;
    render(frame: RenderFrame): void;
    /** Delete the vertex array and buffers cached for `mesh`. */
    releaseMesh(mesh: Mesh): void;
    /** Tell `listener` when the WebGL context is lost, unless this renderer lost it on purpose. */
    onLost(listener: (reason: string) => void): void;
    destroy(): void;
}
