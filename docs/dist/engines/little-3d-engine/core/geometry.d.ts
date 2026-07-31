import { type Vec3 } from "./math.js";
import type { Mesh } from "./mesh.js";
/** Parse a CSS hex color (`#rgb` or `#rrggbb`) into 0..255 channels. */
export declare function parseColor(color: string): [number, number, number];
/** Flat triangle soup ready for GPU upload: 3 floats per vertex per array. */
export interface TriangleData {
    positions: Float32Array;
    normals: Float32Array;
    colors: Float32Array;
    /**
     * Per-vertex emissive (`Ke`) as linear `0..1` RGB, duplicated across each
     * face's vertices. Faces with no material emit `(0,0,0)`, so a GPU shader can
     * add this term unconditionally and unlit meshes stay identical.
     */
    emissives: Float32Array;
    /**
     * Per-vertex specular packed as 4 floats: `Ks` linear RGB in `xyz` and the
     * `Ns` shininess exponent in `w`. Faces with no specular emit `(0,0,0,1)`, so
     * the highlight term multiplies to zero and unlit meshes stay identical.
     * Note the stride is 4 floats here, not 3 like the other arrays.
     */
    speculars: Float32Array;
    /** Number of vertices (positions.length / 3). */
    count: number;
}
/**
 * Triangulate a mesh into a non-indexed soup where every vertex carries its
 * face's normal, color, and emissive. This is what GPU backends upload to
 * render flat shading without per-primitive state.
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
