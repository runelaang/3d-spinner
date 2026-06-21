import type { Mesh } from "../mesh.js";
/**
 * Build an octa-sphere (subdivided octahedron) centered on the origin.
 *
 * @param size Diameter. Defaults to `1`.
 * @param detail Subdivision level, `1` = base octahedron (8 faces). Each level
 *   splits every triangle into four. Defaults to `1`.
 * @param colors CSS colors cycled across faces. Defaults to a built-in palette.
 */
export declare function octaSphere(size?: number, detail?: number, colors?: string[]): Mesh;
