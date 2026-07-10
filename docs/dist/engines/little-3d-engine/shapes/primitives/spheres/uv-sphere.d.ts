import { type Material, type Mesh } from "../../../core/mesh.js";
/**
 * Build a UV (latitude/longitude) sphere centered on the origin.
 *
 * @param size Diameter. Defaults to `1`.
 * @param detail Tessellation level, `1` = simplest. Higher values add rings and
 *   segments. Defaults to `1`.
 * @param colors CSS colors cycled across faces. Defaults to a built-in palette.
 * @param material Optional surface material applied to every face.
 */
export declare function uvSphere(size?: number, detail?: number, colors?: string[], material?: Material): Mesh;
