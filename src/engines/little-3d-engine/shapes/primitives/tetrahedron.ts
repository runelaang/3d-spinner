import { attachMaterial, type Material, type Mesh } from "../../core/mesh.js";

const DEFAULT_COLORS = ["#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b"];

/**
 * Build a regular tetrahedron mesh centered on the origin.
 *
 * @param size Approximate diameter. Defaults to `1`.
 * @param colors Four CSS colors, one per triangular face. Defaults to a built-in palette.
 * @param material Optional surface material applied to every face.
 */
export function tetrahedron(size = 1, colors: string[] = DEFAULT_COLORS, material?: Material): Mesh {
  const s = size / 2;
  const vertices = [
    { x: s, y: s, z: s },
    { x: s, y: -s, z: -s },
    { x: -s, y: s, z: -s },
    { x: -s, y: -s, z: s },
  ];
  const faces = [
    { indices: [0, 1, 2], color: colors[0 % colors.length] },
    { indices: [0, 3, 1], color: colors[1 % colors.length] },
    { indices: [0, 2, 3], color: colors[2 % colors.length] },
    { indices: [1, 3, 2], color: colors[3 % colors.length] },
  ];
  return attachMaterial({ vertices, faces }, material);
}
