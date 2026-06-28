import type { Vec3 } from "../engines/little-3d-engine/little-3d-engine.js";
import type { MotionController } from "./controller.js";

/** Options for {@link figureEightMotion}. */
export interface FigureEightMotionOptions {
  /** Overall scale of the figure-8 in scene units. Default `1`. */
  size?: number;
  /** Milliseconds for one full lap. Default `3600`. */
  periodMs?: number;
}

// Figure-8 (lemniscate) amplitudes. A closed, periodic curve so it repeats
// seamlessly; the z term gives it depth so it reads as 3D rather than flat.
const LOOP_X = 1.5;
const LOOP_Y = 1.0;
const LOOP_Z = 1.05;

/**
 * Flies a seamless 3D figure-8, the same lemniscate path the flight animation
 * loops on. Nose follows the tangent.
 */
export function figureEightMotion(options: FigureEightMotionOptions = {}): MotionController {
  const size = options.size ?? 1;
  const periodMs = options.periodMs ?? 3600;

  return {
    positionAt(t: number): Vec3 {
      const a = (t / periodMs) * Math.PI * 2;
      return {
        x: size * LOOP_X * Math.sin(a),
        y: size * LOOP_Y * Math.sin(a) * Math.cos(a),
        z: size * LOOP_Z * Math.cos(a),
      };
    },
  };
}
