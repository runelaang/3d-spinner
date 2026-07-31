import { cross, normalize, subtract } from "./math.js";
import type { Mesh } from "./mesh.js";

/** Parse a CSS hex color (`#rgb` or `#rrggbb`) into 0..255 channels. */
export function parseColor(color: string): [number, number, number] {
  const hex = color.trim().replace("#", "");
  const full =
    hex.length === 3
      ? hex
          .split("")
          .map((c) => c + c)
          .join("")
      : hex;
  const n = parseInt(full, 16);
  return [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff];
}

/** Flat triangle soup ready for GPU upload: 3 floats per vertex per array. */
export interface TriangleData {
  positions: Float32Array;
  normals: Float32Array;
  colors: Float32Array;
  /** Number of vertices (positions.length / 3). */
  count: number;
}

/**
 * Triangulate a mesh into a non-indexed soup where every vertex carries its
 * face's normal and color. This is what GPU backends upload to render flat
 * shading without per-primitive state.
 */
export function expandToTriangles(mesh: Mesh): TriangleData {
  let triangles = 0;
  for (const face of mesh.faces) triangles += Math.max(0, face.indices.length - 2);

  const positions = new Float32Array(triangles * 9);
  const normals = new Float32Array(triangles * 9);
  const colors = new Float32Array(triangles * 9);
  let o = 0;

  for (const face of mesh.faces) {
    const v0 = mesh.vertices[face.indices[0]];
    const v1 = mesh.vertices[face.indices[1]];
    const v2 = mesh.vertices[face.indices[2]];
    const normal = normalize(cross(subtract(v1, v0), subtract(v2, v0)));
    const [r, g, b] = parseColor(face.color);
    const cr = r / 255;
    const cg = g / 255;
    const cb = b / 255;

    for (let k = 1; k < face.indices.length - 1; k++) {
      const tri = [face.indices[0], face.indices[k], face.indices[k + 1]];
      for (const index of tri) {
        const v = mesh.vertices[index];
        positions[o] = v.x;
        positions[o + 1] = v.y;
        positions[o + 2] = v.z;
        normals[o] = normal.x;
        normals[o + 1] = normal.y;
        normals[o + 2] = normal.z;
        colors[o] = cr;
        colors[o + 1] = cg;
        colors[o + 2] = cb;
        o += 3;
      }
    }
  }

  return { positions, normals, colors, count: positions.length / 3 };
}
