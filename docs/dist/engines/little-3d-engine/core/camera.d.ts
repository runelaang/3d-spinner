import { type Mat4, type Vec3 } from "./math.js";
/** Camera configuration. */
export interface CameraOptions {
    /** Eye position. Default `{ x: 0, y: 0, z: 4 }` (looking toward -Z). */
    position: Vec3;
    /** Vertical field of view in radians. Default `~0.96` (55 degrees). */
    fov: number;
    /** Near clip distance. Default `0.1`. */
    near: number;
    /** Far clip distance. Default `100`. */
    far: number;
}
/** A perspective camera looking down the -Z axis from its `position`. */
export declare class Camera {
    readonly options: CameraOptions;
    constructor(options?: Partial<CameraOptions>);
    /** Transform a world-space point into view (camera) space. */
    toView(p: Vec3): Vec3;
    /** Combined view-projection matrix for the given viewport aspect ratio. */
    viewProjection(aspect: number): Mat4;
    /** Convert a normalized device coordinate (-1..1) to a pixel position. */
    toScreen(ndc: Vec3, width: number, height: number): {
        x: number;
        y: number;
    };
}
