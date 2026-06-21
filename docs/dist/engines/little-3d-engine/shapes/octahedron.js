const DEFAULT_COLORS = [
    "#3b82f6",
    "#8b5cf6",
    "#ec4899",
    "#f59e0b",
    "#10b981",
    "#ef4444",
    "#06b6d4",
    "#eab308",
];
/**
 * Build a regular octahedron mesh centered on the origin.
 *
 * @param size Distance between opposite vertices. Defaults to `1`.
 * @param colors Eight CSS colors, one per triangular face. Defaults to a built-in palette.
 */
export function octahedron(size = 1, colors = DEFAULT_COLORS) {
    const r = size / 2;
    const vertices = [
        { x: r, y: 0, z: 0 },
        { x: -r, y: 0, z: 0 },
        { x: 0, y: r, z: 0 },
        { x: 0, y: -r, z: 0 },
        { x: 0, y: 0, z: r },
        { x: 0, y: 0, z: -r },
    ];
    const faces = [
        { indices: [4, 0, 2], color: colors[0 % colors.length] },
        { indices: [4, 2, 1], color: colors[1 % colors.length] },
        { indices: [4, 1, 3], color: colors[2 % colors.length] },
        { indices: [4, 3, 0], color: colors[3 % colors.length] },
        { indices: [5, 2, 0], color: colors[4 % colors.length] },
        { indices: [5, 1, 2], color: colors[5 % colors.length] },
        { indices: [5, 3, 1], color: colors[6 % colors.length] },
        { indices: [5, 0, 3], color: colors[7 % colors.length] },
    ];
    return { vertices, faces };
}
