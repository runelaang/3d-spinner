import { type Material, type Mesh } from "../../../core/mesh.js";
/**
 * Build a cube-sphere (spherified cube) centered on the origin: each cube face
 * is gridded and projected onto the sphere. Even, all-quad, no poles.
 *
 * @param size Diameter. Defaults to `1`.
 * @param detail Subdivisions per cube face edge, `1` = simplest (6 quads).
 *   Defaults to `1`.
 * @param colors CSS colors cycled across faces. Defaults to a built-in palette.
 * @param material Optional surface material applied to every face.
 */
export declare function cubeSphere(size?: number, detail?: number, colors?: string[], material?: Material): Mesh;
