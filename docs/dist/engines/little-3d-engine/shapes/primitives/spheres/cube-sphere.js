import { attachMaterial } from "../../../core/mesh.js";
const DEFAULT_COLORS = ["#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#ef4444"];
// right x up == normal for each face, so generated quads wind CCW outward.
const CUBE_FACES = [
    { normal: [0, 0, 1], right: [1, 0, 0], up: [0, 1, 0] },
    { normal: [0, 0, -1], right: [-1, 0, 0], up: [0, 1, 0] },
    { normal: [1, 0, 0], right: [0, 0, -1], up: [0, 1, 0] },
    { normal: [-1, 0, 0], right: [0, 0, 1], up: [0, 1, 0] },
    { normal: [0, 1, 0], right: [1, 0, 0], up: [0, 0, -1] },
    { normal: [0, -1, 0], right: [1, 0, 0], up: [0, 0, 1] },
];
/**
 * Build a cube-sphere (spherified cube) centered on the origin: each cube face
 * is gridded and projected onto the sphere. Even, all-quad, no poles.
 *
 * @param size Diameter. Defaults to `1`.
 * @param detail Subdivisions per cube face edge, `1` = simplest (6 quads).
 *   Defaults to `1`.
 * @param colors CSS colors cycled across faces. Defaults to a built-in palette.
 * @param material Optional surface material applied to every face.
 */
export function cubeSphere(size = 1, detail = 1, colors = DEFAULT_COLORS, material) {
    const r = size / 2;
    const n = Math.max(1, Math.floor(detail));
    const vertices = [];
    const faces = [];
    let ci = 0;
    for (const face of CUBE_FACES) {
        const base = vertices.length;
        for (let i = 0; i <= n; i++) {
            for (let j = 0; j <= n; j++) {
                const u = -1 + (2 * i) / n;
                const v = -1 + (2 * j) / n;
                const x = face.normal[0] + u * face.right[0] + v * face.up[0];
                const y = face.normal[1] + u * face.right[1] + v * face.up[1];
                const z = face.normal[2] + u * face.right[2] + v * face.up[2];
                const len = Math.hypot(x, y, z);
                vertices.push({ x: (x / len) * r, y: (y / len) * r, z: (z / len) * r });
            }
        }
        const idx = (i, j) => base + i * (n + 1) + j;
        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
                faces.push({
                    indices: [idx(i, j), idx(i + 1, j), idx(i + 1, j + 1), idx(i, j + 1)],
                    color: colors[ci++ % colors.length],
                });
            }
        }
    }
    return attachMaterial({ vertices, faces }, material);
}
