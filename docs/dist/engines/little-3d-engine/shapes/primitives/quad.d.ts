import type { Mesh } from "../../core/mesh.js";
/**
 * Build a flat square in the XY plane, facing +Z, as a single four-vertex
 * face. Useful as a billboard when kept facing the camera.
 *
 * @param size Edge length. Defaults to `1`.
 * @param colors CSS color for the face. Defaults to a built-in blue.
 */
export declare function quad(size?: number, colors?: string[]): Mesh;
