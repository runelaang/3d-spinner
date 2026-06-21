import type { Mesh } from "../mesh.js";
/**
 * Build a cube mesh centered on the origin.
 *
 * @param size Edge length. Defaults to `1`.
 * @param colors Six CSS colors, one per face (front, back, top, bottom, right, left).
 *   Defaults to a built-in palette.
 */
export declare function cube(size?: number, colors?: string[]): Mesh;
