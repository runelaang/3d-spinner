/**
 * UVs as a planar projection of the mesh's XY bounds (u right, v up), emitted
 * in the same face-fan order as `expandToTriangles` so the arrays stay
 * aligned. Exact for billboard quads; flat meshes map incidentally.
 */
export function planarUVs(mesh) {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const v of mesh.vertices) {
        minX = Math.min(minX, v.x);
        minY = Math.min(minY, v.y);
        maxX = Math.max(maxX, v.x);
        maxY = Math.max(maxY, v.y);
    }
    const width = maxX - minX || 1;
    const height = maxY - minY || 1;
    let triangles = 0;
    for (const face of mesh.faces)
        triangles += Math.max(0, face.indices.length - 2);
    const uvs = new Float32Array(triangles * 6);
    let o = 0;
    for (const face of mesh.faces) {
        for (let k = 1; k < face.indices.length - 1; k++) {
            for (const index of [face.indices[0], face.indices[k], face.indices[k + 1]]) {
                const v = mesh.vertices[index];
                uvs[o] = (v.x - minX) / width;
                uvs[o + 1] = 1 - (v.y - minY) / height;
                o += 2;
            }
        }
    }
    return uvs;
}
