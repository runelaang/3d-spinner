import type { MotionController } from "./controller.js";
/** Options for {@link squareMotion}. */
export interface SquareMotionOptions {
    /** Side length of the square in scene units. Default `2.4`. */
    size?: number;
    /** Milliseconds for one full lap of the perimeter. Default `4000`. */
    periodMs?: number;
    /** Tilt of the square's plane about the X axis, radians. `0` faces the camera. Default `0.45`. */
    tilt?: number;
    /** Travel direction: `1` counter-clockwise, `-1` clockwise. Default `1`. */
    direction?: number;
}
/**
 * Travels the perimeter of a square at constant speed, turning sharply at each
 * corner. `tilt` leans the square away from the camera for a 3D read.
 */
export declare function squareMotion(options?: SquareMotionOptions): MotionController;
