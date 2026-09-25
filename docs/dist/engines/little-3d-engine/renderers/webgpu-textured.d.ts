import type { Mesh } from "../core/mesh.js";
import { type RenderFrame } from "../renderer.js";
import { type TextureSource } from "./textured-helpers.js";
import { WebGPURenderer } from "./webgpu.js";
export type { TextureSource } from "./textured-helpers.js";
/**
 * WebGPU renderer with image textures on registered meshes; unregistered
 * meshes render exactly as in the plain WebGPU backend. Made for billboard
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
 *   const { WebGPUTexturedRenderer } =
 *     await import("3d-spinner/engines/little-3d-engine/renderers/webgpu-textured");
 *   const renderer = new WebGPUTexturedRenderer(options);
 *   renderer.setTexture(mesh, "/sprite.png");
 *   return renderer;
 * }
 * ```
 */
export declare class WebGPUTexturedRenderer extends WebGPURenderer {
    private textured?;
    private texturedUniforms?;
    private texturedCapacity;
    private readonly sources;
    private readonly textures;
    private readonly retired;
    private readonly texturedBuffers;
    private readonly bindGroups;
    private readonly texturedScratch;
    /**
     * Texture every instance of `mesh` with `source`. Call any time, also before
     * init; a new source replaces the one already uploaded.
     */
    setTexture(mesh: Mesh, source: TextureSource): void;
    init(canvas: HTMLCanvasElement): Promise<void>;
    /** Build the pipeline and sampler for textured meshes. */
    private createTexturedPipeline;
    /** The texture for `mesh`: a white placeholder until its source has been uploaded. */
    private textureFor;
    private getOrCreateTexturedBuffers;
    /** The bind group for `mesh`, rebuilt when its texture or the uniform buffer changes. */
    private bindGroupFor;
    /** The textured uniform buffer, grown to hold at least `draws` uniform blocks. */
    private ensureTexturedCapacity;
    render(frame: RenderFrame): void;
    /** Free the buffers cached for `mesh`, textured or plain. Its texture stays registered. */
    releaseMesh(mesh: Mesh): void;
    destroy(): void;
}
