import { type Material, type Mesh } from "../../core/mesh.js";
/**
 * Build a low-poly plane mesh pointing along the positive X axis.
 *
 * @param colors CSS colors cycled across faces. Defaults to a built-in palette.
 * @param material Optional surface material applied to every face.
 */
export declare function planeMesh(colors?: string[], material?: Material): Mesh;
