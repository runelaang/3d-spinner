import type { Mesh } from "./core/mesh.js";
import type { Renderer, RendererOptions, ResolvedBackend } from "./renderer.js";
import type { TextureSource } from "./renderers/textured-helpers.js";
/**
 * Build the textured renderer for `backend` with each mesh's texture registered.
 * Only the chosen renderer module is fetched. Pass it as the engine's
 * `rendererFor` so `"auto"` still falls back from one backend to the next.
 */
export declare function createTexturedRenderer(backend: ResolvedBackend, options: RendererOptions, textures: ReadonlyMap<Mesh, TextureSource>): Promise<Renderer>;
