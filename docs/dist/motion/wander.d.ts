import type { MotionController } from "./controller.js";
/** Half-extents of the box the wander stays within, in scene units. */
export interface WanderBounds {
    x?: number;
    y?: number;
    z?: number;
}
/** Options for {@link wanderMotion}. */
export interface WanderMotionOptions {
    /** Half-extents of the box the object stays within. Default `{ x: 1.4, y: 1.0, z: 0.6 }`. */
    bounds?: WanderBounds;
    /** Base drift period in ms; larger is slower. Default `9000`. */
    periodMs?: number;
    /** Seed for the random direction pattern. Omit for a different wander each time. */
    seed?: number;
}
/**
 * Drifts smoothly in random directions, changing heading organically, while
 * staying inside the frame. The path is bounded by construction (a weighted sum
 * of sines), so it never wanders off-screen. Pass a `seed` for a repeatable path.
 */
export declare function wanderMotion(options?: WanderMotionOptions): MotionController;
