/** A point or direction in 3D space. */
export interface Vec3 {
    x: number;
    y: number;
    z: number;
}
/** Create a {@link Vec3}. */
export declare function vec3(x: number, y: number, z: number): Vec3;
/** Subtract `b` from `a` (`a - b`). */
export declare function subtract(a: Vec3, b: Vec3): Vec3;
/** Cross product `a x b` (a vector perpendicular to both). */
export declare function cross(a: Vec3, b: Vec3): Vec3;
/** Dot product `a . b`. */
export declare function dot(a: Vec3, b: Vec3): number;
/** Scale a vector by a scalar. */
export declare function scale(v: Vec3, s: number): Vec3;
/** Return a unit-length copy of `v` (zero vector is returned unchanged). */
export declare function normalize(v: Vec3): Vec3;
/**
 * A 4x4 matrix in column-major order (16 numbers), suitable for chaining
 * model, view, and projection transforms.
 */
export type Mat4 = number[];
/** The 4x4 identity matrix. */
export declare function identity(): Mat4;
/** Multiply two matrices (`a * b`); applies `b` first, then `a`. */
export declare function multiply(a: Mat4, b: Mat4): Mat4;
/** Translation matrix. */
export declare function translation(x: number, y: number, z: number): Mat4;
/** Rotation matrix about the X axis (radians). */
export declare function rotationX(rad: number): Mat4;
/** Rotation matrix about the Y axis (radians). */
export declare function rotationY(rad: number): Mat4;
/** Rotation matrix about the Z axis (radians). */
export declare function rotationZ(rad: number): Mat4;
/**
 * Perspective projection matrix.
 *
 * @param fovY Vertical field of view in radians.
 * @param aspect Viewport width divided by height.
 * @param near Near clip distance.
 * @param far Far clip distance.
 */
export declare function perspective(fovY: number, aspect: number, near: number, far: number): Mat4;
/** Transform a point by a matrix, applying the perspective divide. */
export declare function transformPoint(m: Mat4, p: Vec3): Vec3;
/** Transform a point by a matrix without the perspective divide. */
export declare function transformAffine(m: Mat4, p: Vec3): Vec3;
