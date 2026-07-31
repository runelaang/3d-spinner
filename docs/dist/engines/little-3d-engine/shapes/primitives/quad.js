import { attachMaterial } from "../../core/mesh.js";
const DEFAULT_COLORS = ["#3b82f6"];
/**
 * Build a flat square in the XY plane, facing +Z, as a single four-vertex
 * face. Useful as a billboard when kept facing the camera.
 *
 * @param size Edge length. Defaults to `1`.
 * @param colors CSS color for the face. Defaults to a built-in blue.
 * @param material Optional surface material applied to every face.
 */
export function quad(size = 1, colors = DEFAULT_COLORS, material) {
    const s = size / 2;
    const vertices = [
        { x: -s, y: -s, z: 0 },
        { x: s, y: -s, z: 0 },
        { x: s, y: s, z: 0 },
        { x: -s, y: s, z: 0 },
    ];
    return attachMaterial({ vertices, faces: [{ indices: [0, 1, 2, 3], color: colors[0] }] }, material);
}
