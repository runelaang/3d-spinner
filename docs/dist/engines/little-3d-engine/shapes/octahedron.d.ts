import type { Mesh } from "../mesh.js";
/**
 * Build a regular octahedron mesh centered on the origin.
 *
 * @param size Distance between opposite vertices. Defaults to `1`.
 * @param colors Eight CSS colors, one per triangular face. Defaults to a built-in palette.
 */
export declare function octahedron(size?: number, colors?: string[]): Mesh;
