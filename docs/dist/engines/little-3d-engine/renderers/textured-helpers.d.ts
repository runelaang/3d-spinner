import type { Mesh } from "../core/mesh.js";
/** An image source accepted for a mesh texture: a URL or a drawable element. */
export type TextureSource = string | TexImageSource;
/**
 * UVs as a planar projection of the mesh's XY bounds (u right, v up), emitted
 * in the same face-fan order as `expandToTriangles` so the arrays stay
 * aligned. Exact for billboard quads; flat meshes map incidentally.
 */
export declare function planarUVs(mesh: Mesh): Float32Array;
