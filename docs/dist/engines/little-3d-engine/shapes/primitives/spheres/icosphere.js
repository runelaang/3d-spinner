import { sphereFromTriangles } from "../../../core/geometry.js";
import { attachMaterial } from "../../../core/mesh.js";
const DEFAULT_COLORS = ["#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#ef4444"];
const T = (1 + Math.sqrt(5)) / 2;
const SEED_VERTICES = [
    { x: -1, y: T, z: 0 },
    { x: 1, y: T, z: 0 },
    { x: -1, y: -T, z: 0 },
    { x: 1, y: -T, z: 0 },
    { x: 0, y: -1, z: T },
    { x: 0, y: 1, z: T },
    { x: 0, y: -1, z: -T },
    { x: 0, y: 1, z: -T },
    { x: T, y: 0, z: -1 },
    { x: T, y: 0, z: 1 },
    { x: -T, y: 0, z: -1 },
    { x: -T, y: 0, z: 1 },
];
const SEED_FACES = [
    [0, 11, 5],
    [0, 5, 1],
    [0, 1, 7],
    [0, 7, 10],
    [0, 10, 11],
    [1, 5, 9],
    [5, 11, 4],
    [11, 10, 2],
    [10, 7, 6],
    [7, 1, 8],
    [3, 9, 4],
    [3, 4, 2],
    [3, 2, 6],
    [3, 6, 8],
    [3, 8, 9],
    [4, 9, 5],
    [2, 4, 11],
    [6, 2, 10],
    [8, 6, 7],
    [9, 8, 1],
];
/**
 * Build an icosphere (subdivided icosahedron) centered on the origin. Gives the
 * most uniform triangle distribution of the sphere types.
 *
 * @param size Diameter. Defaults to `1`.
 * @param detail Subdivision level, `1` = base icosahedron (20 faces). Each level
 *   splits every triangle into four. Defaults to `1`.
 * @param colors CSS colors cycled across faces. Defaults to a built-in palette.
 * @param material Optional surface material applied to every face.
 */
export function icosphere(size = 1, detail = 1, colors = DEFAULT_COLORS, material) {
    return attachMaterial(sphereFromTriangles(SEED_VERTICES, SEED_FACES, size, detail, colors), material);
}
