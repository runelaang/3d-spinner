import type { Mesh } from "../core/mesh.js";
import { type Renderer, type RenderFrame, type RendererOptions } from "../renderer.js";
import { type TextureSource } from "./textured-helpers.js";
export type { TextureSource } from "./textured-helpers.js";
/**
 * WebGL renderer with image textures on registered meshes; unregistered
 * meshes render exactly as in the plain WebGL backend. Made for billboard
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
 *   const { WebGLTexturedRenderer } =
 *     await import("3d-spinner/engines/little-3d-engine/renderers/webgl-textured");
 *   const renderer = new WebGLTexturedRenderer(options);
 *   renderer.setTexture(mesh, "/sprite.png");
 *   return renderer;
 * }
 * ```
 */
export declare class WebGLTexturedRenderer implements Renderer {
    private readonly inner;
    private gl?;
    private program?;
    private locations?;
    private readonly sources;
    private readonly textures;
    private readonly buffers;
    constructor(options?: RendererOptions);
    /** Texture every instance of `mesh` with `source`. Call any time, also before init. */
    setTexture(mesh: Mesh, source: TextureSource): void;
    init(canvas: HTMLCanvasElement): void;
    resize(): void;
    private textureFor;
    private buffersFor;
    render(frame: RenderFrame): void;
    destroy(): void;
}
