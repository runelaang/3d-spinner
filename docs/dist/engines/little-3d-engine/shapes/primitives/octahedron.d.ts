import { type Material, type Mesh } from "../../core/mesh.js";
/**
 * Build a regular octahedron mesh centered on the origin.
 *
 * @param size Distance between opposite vertices. Defaults to `1`.
 * @param colors Eight CSS colors, one per triangular face. Defaults to a built-in palette.
 * @param material Optional surface material applied to every face.
 */
export declare function octahedron(size?: number, colors?: string[], material?: Material): Mesh;
