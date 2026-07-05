/** Create a {@link Vec3}. */
export function vec3(x, y, z) {
    return { x, y, z };
}
/** Subtract `b` from `a` (`a - b`). */
export function subtract(a, b) {
    return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
}
/** Cross product `a x b` (a vector perpendicular to both). */
export function cross(a, b) {
    return {
        x: a.y * b.z - a.z * b.y,
        y: a.z * b.x - a.x * b.z,
        z: a.x * b.y - a.y * b.x,
    };
}
/** Dot product `a . b`. */
export function dot(a, b) {
    return a.x * b.x + a.y * b.y + a.z * b.z;
}
/** Scale a vector by a scalar. */
export function scale(v, s) {
    return { x: v.x * s, y: v.y * s, z: v.z * s };
}
/** Return a unit-length copy of `v` (zero vector is returned unchanged). */
export function normalize(v) {
    const length = Math.hypot(v.x, v.y, v.z);
    if (length === 0)
        return { x: 0, y: 0, z: 0 };
    return { x: v.x / length, y: v.y / length, z: v.z / length };
}
/** The 4x4 identity matrix. */
export function identity() {
    return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
}
/** Multiply two matrices (`a * b`); applies `b` first, then `a`. */
export function multiply(a, b) {
    const out = new Array(16);
    for (let col = 0; col < 4; col++) {
        for (let row = 0; row < 4; row++) {
            let sum = 0;
            for (let k = 0; k < 4; k++) {
                sum += a[k * 4 + row] * b[col * 4 + k];
            }
            out[col * 4 + row] = sum;
        }
    }
    return out;
}
/** Translation matrix. */
export function translation(x, y, z) {
    return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, x, y, z, 1];
}
/** Uniform scale matrix. */
export function scaleMatrix(s) {
    return [s, 0, 0, 0, 0, s, 0, 0, 0, 0, s, 0, 0, 0, 0, 1];
}
/** Rotation matrix about the X axis (radians). */
export function rotationX(rad) {
    const c = Math.cos(rad);
    const s = Math.sin(rad);
    return [1, 0, 0, 0, 0, c, s, 0, 0, -s, c, 0, 0, 0, 0, 1];
}
/** Rotation matrix about the Y axis (radians). */
export function rotationY(rad) {
    const c = Math.cos(rad);
    const s = Math.sin(rad);
    return [c, 0, -s, 0, 0, 1, 0, 0, s, 0, c, 0, 0, 0, 0, 1];
}
/** Rotation matrix about the Z axis (radians). */
export function rotationZ(rad) {
    const c = Math.cos(rad);
    const s = Math.sin(rad);
    return [c, s, 0, 0, -s, c, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
}
/**
 * Perspective projection matrix.
 *
 * @param fovY Vertical field of view in radians.
 * @param aspect Viewport width divided by height.
 * @param near Near clip distance.
 * @param far Far clip distance.
 */
export function perspective(fovY, aspect, near, far) {
    const f = 1 / Math.tan(fovY / 2);
    const nf = 1 / (near - far);
    return [
        f / aspect, 0, 0, 0,
        0, f, 0, 0,
        0, 0, (far + near) * nf, -1,
        0, 0, 2 * far * near * nf, 0,
    ];
}
/** Transform a point by a matrix, applying the perspective divide. */
export function transformPoint(m, p) {
    const x = m[0] * p.x + m[4] * p.y + m[8] * p.z + m[12];
    const y = m[1] * p.x + m[5] * p.y + m[9] * p.z + m[13];
    const z = m[2] * p.x + m[6] * p.y + m[10] * p.z + m[14];
    const w = m[3] * p.x + m[7] * p.y + m[11] * p.z + m[15] || 1;
    return { x: x / w, y: y / w, z: z / w };
}
/** Transform a point by a matrix without the perspective divide. */
export function transformAffine(m, p) {
    return {
        x: m[0] * p.x + m[4] * p.y + m[8] * p.z + m[12],
        y: m[1] * p.x + m[5] * p.y + m[9] * p.z + m[13],
        z: m[2] * p.x + m[6] * p.y + m[10] * p.z + m[14],
    };
}
