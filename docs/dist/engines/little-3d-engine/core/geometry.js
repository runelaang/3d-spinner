import { cross, normalize, scale, subtract } from "./math.js";
/** Parse a CSS hex color (`#rgb` or `#rrggbb`) into 0..255 channels. */
export function parseColor(color) {
    const hex = color.trim().replace("#", "");
    const full = hex.length === 3
        ? hex
            .split("")
            .map((c) => c + c)
            .join("")
        : hex;
    const n = parseInt(full, 16);
    return [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff];
}
/**
 * Triangulate a mesh into a non-indexed soup where every vertex carries its
 * face's normal, color, and emissive. This is what GPU backends upload to
 * render flat shading without per-primitive state.
 */
export function expandToTriangles(mesh) {
    let triangles = 0;
    for (const face of mesh.faces)
        triangles += Math.max(0, face.indices.length - 2);
    const positions = new Float32Array(triangles * 9);
    const normals = new Float32Array(triangles * 9);
    const colors = new Float32Array(triangles * 9);
    const emissives = new Float32Array(triangles * 9);
    const speculars = new Float32Array(triangles * 12);
    let o = 0;
    let so = 0;
    for (const face of mesh.faces) {
        const v0 = mesh.vertices[face.indices[0]];
        const v1 = mesh.vertices[face.indices[1]];
        const v2 = mesh.vertices[face.indices[2]];
        const normal = normalize(cross(subtract(v1, v0), subtract(v2, v0)));
        const [r, g, b] = parseColor(face.color);
        const cr = r / 255;
        const cg = g / 255;
        const cb = b / 255;
        const emissive = face.material?.emissive;
        const er = emissive ? emissive[0] : 0;
        const eg = emissive ? emissive[1] : 0;
        const eb = emissive ? emissive[2] : 0;
        const specular = face.material?.specular;
        const sr = specular ? specular[0] : 0;
        const sg = specular ? specular[1] : 0;
        const sb = specular ? specular[2] : 0;
        // Ns only matters where Ks is non-zero; default the exponent to 1 (32 is
        // the flat-shading default when a specular is present but Ns is omitted).
        const sn = specular ? face.material?.shininess ?? 32 : 1;
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
                emissives[o] = er;
                emissives[o + 1] = eg;
                emissives[o + 2] = eb;
                speculars[so] = sr;
                speculars[so + 1] = sg;
                speculars[so + 2] = sb;
                speculars[so + 3] = sn;
                o += 3;
                so += 4;
            }
        }
    }
    return { positions, normals, colors, emissives, speculars, count: positions.length / 3 };
}
function midpoint(a, b) {
    return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, z: (a.z + b.z) / 2 };
}
/**
 * Build a sphere by subdividing a triangular seed polyhedron and projecting
 * every vertex onto the sphere. `detail` 1 keeps the seed; each extra level
 * splits every triangle into four. Used by the icosphere and octa-sphere.
 *
 * @param seedVertices Seed polyhedron vertices (any radius; they are normalized).
 * @param seedFaces Seed triangles, wound CCW as seen from outside.
 */
export function sphereFromTriangles(seedVertices, seedFaces, size, detail, colors) {
    const radius = size / 2;
    let triangles = seedFaces.map((f) => f.map((i) => normalize(seedVertices[i])));
    const levels = Math.max(0, Math.floor(detail) - 1);
    for (let level = 0; level < levels; level++) {
        const next = [];
        for (const [a, b, c] of triangles) {
            const ab = normalize(midpoint(a, b));
            const bc = normalize(midpoint(b, c));
            const ca = normalize(midpoint(c, a));
            next.push([a, ab, ca], [b, bc, ab], [c, ca, bc], [ab, bc, ca]);
        }
        triangles = next;
    }
    const vertices = [];
    const faces = triangles.map((tri, i) => {
        const base = vertices.length;
        vertices.push(scale(tri[0], radius), scale(tri[1], radius), scale(tri[2], radius));
        return { indices: [base, base + 1, base + 2], color: colors[i % colors.length] };
    });
    return { vertices, faces };
}
