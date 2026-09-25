import type { Vec3 } from "../engines/little-3d-engine/little-3d-engine.cjs";
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
    /**
     * How far the object must travel from `position` along a unit `direction`
     * to be entirely out of view, when the animation knows its camera and
     * viewport. The built-in fly transitions use it so an object never appears or
     * vanishes while on screen.
     */
    distanceToLeaveView?: (direction: Vec3) => number;
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
/**
 * Fly in along the path direction and join the path at its own velocity. When
 * the animation reports its view, the fly-in starts fully out of view and
 * slows into the path, so the object never pops into existence on screen.
 */
export declare function enterFromObjectDirection(options?: DirectionTransitionOptions): ObjectMotionTransition;
/**
 * Fly out along the path direction, leaving at the path's own velocity. When
 * the animation reports its view, the fly-out speeds up just enough to be
 * fully out of view when it ends, so the object never vanishes on screen.
 */
export declare function leaveInObjectDirection(options?: DirectionTransitionOptions): ObjectMotionTransition;
export declare function grow(): ObjectMotionTransition;
export declare function shrink(): ObjectMotionTransition;
