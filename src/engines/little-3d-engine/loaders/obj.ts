import type { Mesh, Face } from "../core/mesh.js";

const DEFAULT_COLORS = ["#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#ef4444"];

/** Options for {@link parseObj}. */
export interface ObjOptions {
  /**
   * CSS colors assigned to faces in order, cycling when there are more faces
   * than colors. Defaults to a built-in palette. Pass a single-entry array for
   * a uniform color.
   */
  colors?: string[];
}

function resolveIndex(token: string, vertexCount: number): number {
  const n = parseInt(token, 10);
  return n < 0 ? vertexCount + n : n - 1;
}

/**
 * Parse Wavefront OBJ text into a {@link Mesh}.
 *
 * Reads `v` vertex positions and `f` faces (triangles, quads, or n-gons, in
 * `v`, `v/vt`, `v/vt/vn`, or `v//vn` form, with 1-based or negative indices).
 * Normals (`vn`) and texture coordinates (`vt`) are ignored - the engine
 * computes a flat normal per face - as are groups, materials, and other
 * statements. Face winding is preserved as-is; the engine expects CCW
 * winding as seen from outside.
 *
 * @param text Contents of an `.obj` file.
 * @param options Color palette to apply to the faces.
 */
export function parseObj(text: string, options: ObjOptions = {}): Mesh {
  const colors = options.colors ?? DEFAULT_COLORS;
  const vertices: Mesh["vertices"] = [];
  const faces: Face[] = [];

  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (trimmed === "" || trimmed.startsWith("#")) continue;

    const parts = trimmed.split(/\s+/);
    const keyword = parts[0];

    if (keyword === "v") {
      vertices.push({
        x: parseFloat(parts[1]),
        y: parseFloat(parts[2]),
        z: parseFloat(parts[3]),
      });
    } else if (keyword === "f") {
      const indices: number[] = [];
      for (let i = 1; i < parts.length; i++) {
        const vertexToken = parts[i].split("/")[0];
        indices.push(resolveIndex(vertexToken, vertices.length));
      }
      if (indices.length >= 3) {
        faces.push({ indices, color: colors[faces.length % colors.length] });
      }
    }
  }

  return { vertices, faces };
}
