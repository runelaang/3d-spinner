import { attachMaterial } from "../../../core/mesh.js";
const DEFAULT_COLORS = ["#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#ef4444"];
/**
 * Build a UV (latitude/longitude) sphere centered on the origin.
 *
 * @param size Diameter. Defaults to `1`.
 * @param detail Tessellation level, `1` = simplest. Higher values add rings and
 *   segments. Defaults to `1`.
 * @param colors CSS colors cycled across faces. Defaults to a built-in palette.
 * @param material Optional surface material applied to every face.
 */
export function uvSphere(size = 1, detail = 1, colors = DEFAULT_COLORS, material) {
    const r = size / 2;
    const d = Math.max(1, Math.floor(detail));
    const slices = Math.max(4, d * 4);
    const stacks = Math.max(2, d * 2);
    const vertices = [{ x: 0, y: r, z: 0 }];
    const ring = (i, j) => 1 + (i - 1) * slices + j;
    for (let i = 1; i < stacks; i++) {
        const phi = (Math.PI * i) / stacks;
        const y = r * Math.cos(phi);
        const rr = r * Math.sin(phi);
        for (let j = 0; j < slices; j++) {
            const theta = (2 * Math.PI * j) / slices;
            vertices.push({ x: rr * Math.cos(theta), y, z: rr * Math.sin(theta) });
        }
    }
    const bottom = vertices.length;
    vertices.push({ x: 0, y: -r, z: 0 });
    const faces = [];
    let ci = 0;
    const color = () => colors[ci++ % colors.length];
    for (let j = 0; j < slices; j++) {
        faces.push({ indices: [0, ring(1, (j + 1) % slices), ring(1, j)], color: color() });
    }
    for (let i = 1; i < stacks - 1; i++) {
        for (let j = 0; j < slices; j++) {
            const j1 = (j + 1) % slices;
            faces.push({
                indices: [ring(i, j), ring(i, j1), ring(i + 1, j1), ring(i + 1, j)],
                color: color(),
            });
        }
    }
    for (let j = 0; j < slices; j++) {
        faces.push({
            indices: [bottom, ring(stacks - 1, j), ring(stacks - 1, (j + 1) % slices)],
            color: color(),
        });
    }
    return attachMaterial({ vertices, faces }, material);
}
