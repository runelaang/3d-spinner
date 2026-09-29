import { type Material, type Mesh } from "../../core/mesh.cjs";
/**
 * Build a low-poly plane mesh pointing along the positive X axis.
 *
 * @param colors Hex colors cycled across faces. Defaults to a built-in palette, also when empty.
 * @param material Optional surface material applied to every face.
 */
export declare function planeMesh(colors?: string[], material?: Material): Mesh;
