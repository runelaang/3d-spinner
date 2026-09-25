import type { Mesh } from "../core/mesh.js";
/** Options for {@link parseObj}. */
export interface ObjOptions {
    /**
     * CSS colors assigned to faces in order, cycling when there are more faces
     * than colors. Defaults to a built-in palette, also when the array is empty.
     * Pass a single-entry array for a uniform color.
     */
    colors?: string[];
    /** Contents of an `.mtl` file referenced by the OBJ. */
    mtl?: string;
    /**
     * Use MTL material values for faces with matching `usemtl` statements: the
     * diffuse color (`Kd`) becomes the face color, and ambient (`Ka`), specular
     * (`Ks`/`Ns`), emissive (`Ke`), and dissolve (`d`/`Tr`) become the face
     * {@link Material}. Default `false`.
     */
    useMtlColors?: boolean;
}
/**
 * Parse Wavefront OBJ text into a {@link Mesh}.
 *
 * Reads `v` vertex positions and `f` faces (triangles, quads, or n-gons, in
 * `v`, `v/vt`, `v/vt/vn`, or `v//vn` form, with 1-based or negative indices).
 * Normals (`vn`) and texture coordinates (`vt`) are ignored - the engine
 * computes a flat normal per face. Material names can select the diffuse color
 * (`Kd`) and surface material (ambient `Ka`, specular `Ks`/`Ns`, emissive `Ke`,
 * dissolve `d`/`Tr`) from supplied MTL text; groups and other statements are
 * ignored. Face winding
 * is preserved as-is; the engine expects CCW winding as seen from outside.
 *
 * Malformed geometry throws an `Error` naming the line: a vertex without three
 * finite coordinates, a face with fewer than three vertices, or a face index
 * that is not an integer or refers to a vertex not defined before it.
 *
 * @param text Contents of an `.obj` file.
 * @param options Face palette and optional MTL materials.
 */
export declare function parseObj(text: string, options?: ObjOptions): Mesh;
