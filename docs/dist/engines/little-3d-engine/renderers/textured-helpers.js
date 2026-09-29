/** Start loading the image at `url` and return it; `onLoad` or `onError` follows. */
export function loadImage(url, options) {
    const image = new Image();
    if (options.cors)
        image.crossOrigin = "anonymous";
    image.onload = () => options.onLoad?.(image);
    image.onerror = () => options.onError(new Error("the image did not load"));
    image.src = url;
    return image;
}
/** Warn that a texture could not be used; its mesh keeps drawing in its plain color. */
export function warnTextureFailed(source, error) {
    const name = typeof source === "string" ? `"${source}"` : "image";
    const reason = error instanceof Error ? error.message : String(error);
    console.warn(`3d-spinner: texture ${name} could not be used (${reason}); drawing its plain color instead.`);
}
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
