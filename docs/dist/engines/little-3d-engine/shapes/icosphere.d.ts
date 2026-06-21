import type { Mesh } from "../mesh.js";
/**
 * Build an icosphere (subdivided icosahedron) centered on the origin. Gives the
 * most uniform triangle distribution of the sphere types.
 *
 * @param size Diameter. Defaults to `1`.
 * @param detail Subdivision level, `1` = base icosahedron (20 faces). Each level
 *   splits every triangle into four. Defaults to `1`.
 * @param colors CSS colors cycled across faces. Defaults to a built-in palette.
 */
export declare function icosphere(size?: number, detail?: number, colors?: string[]): Mesh;
