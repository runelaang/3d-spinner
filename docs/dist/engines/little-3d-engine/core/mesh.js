/**
 * Assign one {@link Material} to every face of a mesh, in place, and return it.
 * A no-op when `material` is omitted. Shape builders use this to apply a uniform
 * surface material (ambient, specular, shininess, emissive) across all their faces.
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
/** Centers a mesh at the origin and uniformly scales it to fit within `targetSize`. */
export function centerAndScaleMesh(mesh, targetSize) {
    let minX = Infinity;
    let minY = Infinity;
    let minZ = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    let maxZ = -Infinity;
    for (const vertex of mesh.vertices) {
        minX = Math.min(minX, vertex.x);
        minY = Math.min(minY, vertex.y);
        minZ = Math.min(minZ, vertex.z);
        maxX = Math.max(maxX, vertex.x);
        maxY = Math.max(maxY, vertex.y);
        maxZ = Math.max(maxZ, vertex.z);
    }
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    const centerZ = (minZ + maxZ) / 2;
    const extent = Math.max(maxX - minX, maxY - minY, maxZ - minZ) || 1;
    const factor = targetSize / extent;
    return {
        vertices: mesh.vertices.map((vertex) => ({
            x: (vertex.x - centerX) * factor,
            y: (vertex.y - centerY) * factor,
            z: (vertex.z - centerZ) * factor,
        })),
        faces: mesh.faces,
    };
}
