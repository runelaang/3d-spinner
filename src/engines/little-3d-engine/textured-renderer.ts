import type { Mesh } from "./core/mesh.js";
import type { Renderer, RendererOptions, ResolvedBackend } from "./renderer.js";
import type { TextureSource } from "./renderers/textured-helpers.js";

/**
 * Build the textured renderer for `backend` with each mesh's texture registered.
 * Only the chosen renderer module is fetched. Pass it as the engine's
 * `rendererFor` so `"auto"` still falls back from one backend to the next.
 */
export async function createTexturedRenderer(
  backend: ResolvedBackend,
  options: RendererOptions,
  textures: ReadonlyMap<Mesh, TextureSource>,
): Promise<Renderer> {
  const renderer =
    backend === "webgpu"
      ? new (await import("./renderers/webgpu-textured.js")).WebGPUTexturedRenderer(options)
      : backend === "webgl"
        ? new (await import("./renderers/webgl-textured.js")).WebGLTexturedRenderer(options)
        : new (await import("./renderers/canvas2d-textured.js")).Canvas2DTexturedRenderer(options);
  for (const [mesh, source] of textures) renderer.setTexture(mesh, source);
  return renderer;
}
