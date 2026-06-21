import { type Vec3 } from "./math.js";
import type { Mesh } from "./mesh.js";
/** Parse a CSS hex color (`#rgb` or `#rrggbb`) into 0..255 channels. */
export declare function parseColor(color: string): [number, number, number];
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
export declare function expandToTriangles(mesh: Mesh): TriangleData;
/**
 * Build a sphere by subdividing a triangular seed polyhedron and projecting
 * every vertex onto the sphere. `detail` 1 keeps the seed; each extra level
 * splits every triangle into four. Used by the icosphere and octa-sphere.
 *
 * @param seedVertices Seed polyhedron vertices (any radius; they are normalized).
 * @param seedFaces Seed triangles, wound CCW as seen from outside.
 */
export declare function sphereFromTriangles(seedVertices: Vec3[], seedFaces: number[][], size: number, detail: number, colors: string[]): Mesh;
