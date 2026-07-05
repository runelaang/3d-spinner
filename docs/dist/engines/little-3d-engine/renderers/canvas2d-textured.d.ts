import type { Mesh } from "../core/mesh.js";
import { type Renderer, type RenderFrame, type RendererOptions } from "../renderer.js";
import type { TextureSource } from "./textured-helpers.js";
export type { TextureSource } from "./textured-helpers.js";
/** Canvas 2D texture renderer optimized for planar billboard meshes. */
export declare class Canvas2DTexturedRenderer implements Renderer {
    private readonly inner;
    private readonly sources;
    private readonly loaded;
    private ctx?;
    private dpr;
    constructor(options?: RendererOptions);
    /** Texture every instance of `mesh` with `source`. Call any time, also before init. */
    setTexture(mesh: Mesh, source: TextureSource): void;
    init(canvas: HTMLCanvasElement): void;
    resize(cssWidth: number, cssHeight: number, dpr: number): void;
    private drawable;
    render(frame: RenderFrame): void;
    destroy(): void;
}
