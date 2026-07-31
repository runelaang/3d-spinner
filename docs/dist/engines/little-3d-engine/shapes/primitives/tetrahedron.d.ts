import { type Material, type Mesh } from "../../core/mesh.js";
/**
 * Build a regular tetrahedron mesh centered on the origin.
 *
 * @param size Approximate diameter. Defaults to `1`.
 * @param colors Four CSS colors, one per triangular face. Defaults to a built-in palette.
 * @param material Optional surface material applied to every face.
 */
export declare function tetrahedron(size?: number, colors?: string[], material?: Material): Mesh;
