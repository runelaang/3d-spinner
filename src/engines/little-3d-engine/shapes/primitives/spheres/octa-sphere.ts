import { sphereFromTriangles } from "../../../core/geometry.js";
import type { Mesh } from "../../../core/mesh.js";

const DEFAULT_COLORS = ["#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#ef4444"];

const SEED_VERTICES = [
  { x: 1, y: 0, z: 0 },
  { x: -1, y: 0, z: 0 },
  { x: 0, y: 1, z: 0 },
  { x: 0, y: -1, z: 0 },
  { x: 0, y: 0, z: 1 },
  { x: 0, y: 0, z: -1 },
];
const SEED_FACES = [
  [4, 0, 2],
  [4, 2, 1],
  [4, 1, 3],
  [4, 3, 0],
  [5, 2, 0],
  [5, 1, 2],
  [5, 3, 1],
  [5, 0, 3],
];

/**
 * Build an octa-sphere (subdivided octahedron) centered on the origin.
 *
 * @param size Diameter. Defaults to `1`.
 * @param detail Subdivision level, `1` = base octahedron (8 faces). Each level
 *   splits every triangle into four. Defaults to `1`.
 * @param colors CSS colors cycled across faces. Defaults to a built-in palette.
 */
export function octaSphere(size = 1, detail = 1, colors: string[] = DEFAULT_COLORS): Mesh {
  return sphereFromTriangles(SEED_VERTICES, SEED_FACES, size, detail, colors);
}
