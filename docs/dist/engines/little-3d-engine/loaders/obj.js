const DEFAULT_COLORS = ["#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#ef4444"];
function channelToHex(value) {
    const channel = Number.parseFloat(value);
    if (!Number.isFinite(channel))
        return undefined;
    return Math.round(Math.min(1, Math.max(0, channel)) * 255)
        .toString(16)
        .padStart(2, "0");
}
function parseMtlColors(text) {
    const colors = new Map();
    let material;
    for (const line of text.split("\n")) {
        const trimmed = line.trim();
        if (trimmed === "" || trimmed.startsWith("#"))
            continue;
        const parts = trimmed.split(/\s+/);
        if (parts[0] === "newmtl") {
            material = parts.slice(1).join(" ");
        }
        else if (parts[0] === "Kd" && material) {
            const channels = parts.slice(1, 4).map(channelToHex);
            if (channels.length === 3 && channels.every((channel) => channel !== undefined)) {
                colors.set(material, `#${channels.join("")}`);
            }
        }
    }
    return colors;
}
function resolveIndex(token, vertexCount) {
    const n = parseInt(token, 10);
    return n < 0 ? vertexCount + n : n - 1;
}
/**
 * Parse Wavefront OBJ text into a {@link Mesh}.
 *
 * Reads `v` vertex positions and `f` faces (triangles, quads, or n-gons, in
 * `v`, `v/vt`, `v/vt/vn`, or `v//vn` form, with 1-based or negative indices).
 * Normals (`vn`) and texture coordinates (`vt`) are ignored - the engine
 * computes a flat normal per face. Material names can select diffuse colors
 * from supplied MTL text; groups and other statements are ignored. Face
 * winding is preserved as-is; the engine expects CCW winding as seen from
 * outside.
 *
 * @param text Contents of an `.obj` file.
 * @param options Face palette and optional MTL diffuse colors.
 */
export function parseObj(text, options = {}) {
    const colors = options.colors ?? DEFAULT_COLORS;
    const materialColors = options.useMtlColors && options.mtl
        ? parseMtlColors(options.mtl)
        : undefined;
    const vertices = [];
    const faces = [];
    let material;
    for (const line of text.split("\n")) {
        const trimmed = line.trim();
        if (trimmed === "" || trimmed.startsWith("#"))
            continue;
        const parts = trimmed.split(/\s+/);
        const keyword = parts[0];
        if (keyword === "v") {
            vertices.push({
                x: parseFloat(parts[1]),
                y: parseFloat(parts[2]),
                z: parseFloat(parts[3]),
            });
        }
        else if (keyword === "usemtl") {
            material = parts.slice(1).join(" ");
        }
        else if (keyword === "f") {
            const indices = [];
            for (let i = 1; i < parts.length; i++) {
                const vertexToken = parts[i].split("/")[0];
                indices.push(resolveIndex(vertexToken, vertices.length));
            }
            if (indices.length >= 3) {
                const mtlColor = material ? materialColors?.get(material) : undefined;
                const color = mtlColor
                    ?? (materialColors ? (colors[0] ?? "#888888") : colors[faces.length % colors.length]);
                faces.push({ indices, color });
            }
        }
    }
    return { vertices, faces };
}
