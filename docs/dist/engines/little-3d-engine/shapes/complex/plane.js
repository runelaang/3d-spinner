import { attachMaterial } from "../../core/mesh.js";
const DEFAULT_COLORS = ["#e0f2fe", "#7dd3fc", "#38bdf8", "#f8fafc"];
/**
 * Build a low-poly plane mesh pointing along the positive X axis.
 *
 * @param colors CSS colors cycled across faces. Defaults to a built-in palette.
 * @param material Optional surface material applied to every face.
 */
export function planeMesh(colors = DEFAULT_COLORS, material) {
    return attachMaterial({
        vertices: [
            { x: 0.9, y: 0, z: 0 },
            { x: -0.2, y: 0, z: 0.82 },
            { x: -0.55, y: 0, z: 0.16 },
            { x: -0.72, y: 0, z: 0 },
            { x: -0.55, y: 0, z: -0.16 },
            { x: -0.2, y: 0, z: -0.82 },
            { x: -0.08, y: 0.12, z: 0 },
            { x: -0.08, y: -0.1, z: 0 },
            { x: -0.52, y: 0.38, z: 0 },
        ],
        faces: [
            { indices: [6, 1, 0], color: colors[0] ?? DEFAULT_COLORS[0] },
            { indices: [6, 2, 1], color: colors[3] ?? DEFAULT_COLORS[3] },
            { indices: [6, 3, 2], color: colors[1] ?? DEFAULT_COLORS[1] },
            { indices: [6, 4, 3], color: colors[2] ?? DEFAULT_COLORS[2] },
            { indices: [6, 5, 4], color: colors[3] ?? DEFAULT_COLORS[3] },
            { indices: [6, 0, 5], color: colors[0] ?? DEFAULT_COLORS[0] },
            { indices: [7, 0, 1], color: colors[1] ?? DEFAULT_COLORS[1] },
            { indices: [7, 1, 2], color: colors[2] ?? DEFAULT_COLORS[2] },
            { indices: [7, 2, 3], color: colors[1] ?? DEFAULT_COLORS[1] },
            { indices: [7, 3, 4], color: colors[2] ?? DEFAULT_COLORS[2] },
            { indices: [7, 4, 5], color: colors[1] ?? DEFAULT_COLORS[1] },
            { indices: [7, 5, 0], color: colors[2] ?? DEFAULT_COLORS[2] },
            // Tail fin: the same triangle in both windings so the zero-thickness fin
            // stays visible from either side under backface culling.
            { indices: [3, 6, 8], color: colors[0] ?? DEFAULT_COLORS[0] },
            { indices: [3, 8, 6], color: colors[1] ?? DEFAULT_COLORS[1] },
        ],
    }, material);
}
