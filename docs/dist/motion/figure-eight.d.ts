import type { MotionController } from "./controller.js";
/** Options for {@link figureEightMotion}. */
export interface FigureEightMotionOptions {
    /** Overall scale of the figure-8 in scene units. Default `1`. */
    size?: number;
    /** Milliseconds for one full lap. Default `3600`. */
    periodMs?: number;
}
/**
 * Flies a seamless 3D figure-8, the same lemniscate path the flight animation
 * loops on. Nose follows the tangent.
 */
export declare function figureEightMotion(options?: FigureEightMotionOptions): MotionController;
