import type { Vec3 } from "../engines/little-3d-engine/little-3d-engine.js";
export type ObjectMotionTransitionPhase = "intro" | "outro";
export interface ObjectMotionTransitionInput {
    /** How far through the transition we are, from `0` to `1`. */
    delta: number;
    /** Intro endpoint or outro startpoint where the real motion path hands off. */
    position: Vec3;
    /** Unit direction of travel at the handoff point, when available. */
    direction?: Vec3;
    /** Velocity at the handoff point in scene units per millisecond, when available. */
    velocity?: Vec3;
    /** Full-size scale for the object, when relevant. */
    size?: number;
    /** Transition duration in milliseconds. */
    durationMs: number;
    /** Elapsed transition time in milliseconds. */
    elapsedMs: number;
    /** Whether this is running before or after the real motion path. */
    phase: ObjectMotionTransitionPhase;
}
export interface ObjectMotionTransitionOutput {
    /** Override position for this frame. */
    position?: Vec3;
    /** Override scale for this frame. */
    size?: number;
    /** Override engine Euler orientation for this frame. */
    orientation?: Vec3;
}
export type ObjectMotionTransition = (input: ObjectMotionTransitionInput) => ObjectMotionTransitionOutput;
export interface ObjectMotionTransitionWithDuration {
    transition: ObjectMotionTransition;
    durationMs?: number;
}
export type ObjectMotionTransitionConfig = ObjectMotionTransition | ObjectMotionTransitionWithDuration;
export interface DirectionTransitionOptions {
    /** Direction to travel in. Defaults to the path direction at the handoff point. */
    direction?: Vec3;
    /** Distance to travel when no useful velocity is supplied. Default `3.5`. */
    distance?: number;
}
export declare function enterFromObjectDirection(options?: DirectionTransitionOptions): ObjectMotionTransition;
export declare function leaveInObjectDirection(options?: DirectionTransitionOptions): ObjectMotionTransition;
export declare function grow(): ObjectMotionTransition;
export declare function shrink(): ObjectMotionTransition;
