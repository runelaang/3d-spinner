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

export type ObjectMotionTransition = (
  input: ObjectMotionTransitionInput,
) => ObjectMotionTransitionOutput;

export interface ObjectMotionTransitionWithDuration {
  transition: ObjectMotionTransition;
  durationMs?: number;
}

export type ObjectMotionTransitionConfig =
  | ObjectMotionTransition
  | ObjectMotionTransitionWithDuration;

export interface DirectionTransitionOptions {
  /** Direction to travel in. Defaults to the path direction at the handoff point. */
  direction?: Vec3;
  /** Distance to travel when no useful velocity is supplied. Default `3.5`. */
  distance?: number;
}

const DEFAULT_DISTANCE = 3.5;

function add(a: Vec3, b: Vec3): Vec3 {
  return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z };
}

function scaleVector(v: Vec3, factor: number): Vec3 {
  return { x: v.x * factor, y: v.y * factor, z: v.z * factor };
}

function vectorLength(v: Vec3): number {
  return Math.hypot(v.x, v.y, v.z);
}

function normalizeVector(v: Vec3): Vec3 {
  const length = vectorLength(v);
  if (length < 1e-6) return { x: 1, y: 0, z: 0 };
  return scaleVector(v, 1 / length);
}

function resolveDirection(input: ObjectMotionTransitionInput, fallback?: Vec3): Vec3 {
  return normalizeVector(fallback ?? input.direction ?? input.velocity ?? { x: 1, y: 0, z: 0 });
}

function easeOutBack(delta: number): number {
  const c = 1.70158;
  const u = delta - 1;
  return 1 + (c + 1) * u * u * u + c * u * u;
}

/**
 * Constant velocity the fly-in/out travels at. When the path supplies a real
 * velocity at the handoff (and the caller has not forced a custom `direction`),
 * we match it exactly so the transition joins the motion with no speed jump.
 * Only when no useful velocity is available do we fall back to covering
 * `distance` over the duration along the resolved direction.
 */
function joinVelocity(
  input: ObjectMotionTransitionInput,
  options: DirectionTransitionOptions,
  durationMs: number,
): Vec3 {
  const inputSpeed = input.velocity ? vectorLength(input.velocity) : 0;
  if (input.velocity && inputSpeed > 1e-6 && !options.direction) {
    return input.velocity;
  }
  const distance = options.distance ?? DEFAULT_DISTANCE;
  return scaleVector(resolveDirection(input, options.direction), distance / durationMs);
}

export function enterFromObjectDirection(options: DirectionTransitionOptions = {}): ObjectMotionTransition {
  return (input) => {
    const durationMs = Math.max(1, input.durationMs);
    const velocity = joinVelocity(input, options, durationMs);
    const remaining = durationMs - input.elapsedMs;
    return { position: add(input.position, scaleVector(velocity, -remaining)) };
  };
}

export function leaveInObjectDirection(options: DirectionTransitionOptions = {}): ObjectMotionTransition {
  return (input) => {
    const durationMs = Math.max(1, input.durationMs);
    const velocity = joinVelocity(input, options, durationMs);
    return { position: add(input.position, scaleVector(velocity, input.elapsedMs)) };
  };
}

export function grow(): ObjectMotionTransition {
  return (input) => ({ size: (input.size ?? 1) * easeOutBack(input.delta) });
}

export function shrink(): ObjectMotionTransition {
  return (input) => ({ size: (input.size ?? 1) * (1 - input.delta * input.delta) });
}
