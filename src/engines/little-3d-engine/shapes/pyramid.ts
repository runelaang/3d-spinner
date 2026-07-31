import type { Mesh } from "../core/mesh.js";

const DEFAULT_COLORS = ["#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981"];

/**
 * Build a square pyramid mesh centered on the origin, base down.
 *
 * @param size Base edge length (also the height). Defaults to `1`.
 * @param colors Five CSS colors: the square base, then the four triangular sides.
 *   Defaults to a built-in palette.
 */
export function pyramid(size = 1, colors: string[] = DEFAULT_COLORS): Mesh {
  const h = size / 2;
  const vertices = [
    { x: -h, y: -h, z: h },
    { x: h, y: -h, z: h },
    { x: h, y: -h, z: -h },
    { x: -h, y: -h, z: -h },
    { x: 0, y: h, z: 0 },
  ];
  const faces = [
    { indices: [0, 3, 2, 1], color: colors[0 % colors.length] },
    { indices: [4, 0, 1], color: colors[1 % colors.length] },
    { indices: [4, 1, 2], color: colors[2 % colors.length] },
    { indices: [4, 2, 3], color: colors[3 % colors.length] },
    { indices: [4, 3, 0], color: colors[4 % colors.length] },
  ];
  return { vertices, faces };
}
