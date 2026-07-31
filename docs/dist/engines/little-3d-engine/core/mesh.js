/**
 * Assign one {@link Material} to every face of a mesh, in place, and return it.
 * A no-op when `material` is omitted. Shape builders use this to apply a uniform
 * surface material (specular, shininess, emissive) across all their faces.
 */
export function attachMaterial(mesh, material) {
    if (material) {
        for (const face of mesh.faces)
            face.material = material;
    }
    return mesh;
}
/** Create a {@link Transform} with sensible defaults (origin, no rotation). */
export function transform(init) {
    return {
        position: init?.position ?? { x: 0, y: 0, z: 0 },
        rotation: init?.rotation ?? { x: 0, y: 0, z: 0 },
        scale: init?.scale ?? 1,
    };
}
