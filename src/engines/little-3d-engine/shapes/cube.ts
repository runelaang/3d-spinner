import type { Mesh } from "../core/mesh.js";

const DEFAULT_COLORS = ["#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#ef4444"];

/**
 * Build a cube mesh centered on the origin.
 *
 * @param size Edge length. Defaults to `1`.
 * @param colors Six CSS colors, one per face (front, back, top, bottom, right, left).
 *   Defaults to a built-in palette.
 */
export function cube(size = 1, colors: string[] = DEFAULT_COLORS): Mesh {
  const h = size / 2;
  const vertices = [
    { x: -h, y: -h, z: h },
    { x: h, y: -h, z: h },
    { x: h, y: h, z: h },
    { x: -h, y: h, z: h },
    { x: -h, y: -h, z: -h },
    { x: h, y: -h, z: -h },
    { x: h, y: h, z: -h },
    { x: -h, y: h, z: -h },
  ];
  const faces = [
    { indices: [0, 1, 2, 3], color: colors[0 % colors.length] },
    { indices: [5, 4, 7, 6], color: colors[1 % colors.length] },
    { indices: [3, 2, 6, 7], color: colors[2 % colors.length] },
    { indices: [4, 5, 1, 0], color: colors[3 % colors.length] },
    { indices: [1, 5, 6, 2], color: colors[4 % colors.length] },
    { indices: [4, 0, 3, 7], color: colors[5 % colors.length] },
  ];
  return { vertices, faces };
}
