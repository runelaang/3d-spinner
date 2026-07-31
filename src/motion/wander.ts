import type { Vec3 } from "../engines/little-3d-engine/little-3d-engine.js";
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

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Builds a per-axis position function as a weighted sum of sines with
 * incommensurate frequencies. The output never exceeds `bound`, so the object
 * is guaranteed to stay inside the frame while drifting and turning smoothly.
 */
function axisDrift(rnd: () => number, omega: number, bound: number): (t: number) => number {
  const components = [0, 1, 2].map(() => ({
    freq: 0.5 + rnd() * 1.4,
    phase: rnd() * Math.PI * 2,
    weight: 0.5 + rnd(),
  }));
  const total = components.reduce((sum, c) => sum + c.weight, 0);
  return (t: number) => {
    let value = 0;
    for (const c of components) value += c.weight * Math.sin(omega * c.freq * t + c.phase);
    return (value / total) * bound;
  };
}

/**
 * Drifts smoothly in random directions, changing heading organically, while
 * staying inside the frame. The path is bounded by construction (a weighted sum
 * of sines), so it never wanders off-screen. Pass a `seed` for a repeatable path.
 */
export function wanderMotion(options: WanderMotionOptions = {}): MotionController {
  const boundX = options.bounds?.x ?? 1.4;
  const boundY = options.bounds?.y ?? 1.0;
  const boundZ = options.bounds?.z ?? 0.6;
  const periodMs = options.periodMs ?? 9000;
  const seed = options.seed ?? (Math.random() * 1e9) | 0;

  const rnd = mulberry32(seed);
  const omega = (2 * Math.PI) / periodMs;
  const driftX = axisDrift(rnd, omega, boundX);
  const driftY = axisDrift(rnd, omega, boundY);
  const driftZ = axisDrift(rnd, omega, boundZ);

  return {
    positionAt(t: number): Vec3 {
      return { x: driftX(t), y: driftY(t), z: driftZ(t) };
    },
  };
}
