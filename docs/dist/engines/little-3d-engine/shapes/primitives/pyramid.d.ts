import { type Material, type Mesh } from "../../core/mesh.js";
/**
 * Build a square pyramid mesh centered on the origin, base down.
 *
 * @param size Base edge length (also the height). Defaults to `1`.
 * @param colors Five CSS colors: the square base, then the four triangular sides.
 *   Defaults to a built-in palette.
 * @param material Optional surface material applied to every face.
 */
export declare function pyramid(size?: number, colors?: string[], material?: Material): Mesh;
