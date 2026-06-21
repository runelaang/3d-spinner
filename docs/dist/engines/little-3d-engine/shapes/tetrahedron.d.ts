import type { Mesh } from "../mesh.js";
/**
 * Build a regular tetrahedron mesh centered on the origin.
 *
 * @param size Approximate diameter. Defaults to `1`.
 * @param colors Four CSS colors, one per triangular face. Defaults to a built-in palette.
 */
export declare function tetrahedron(size?: number, colors?: string[]): Mesh;
