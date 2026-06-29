import type { Vec3 } from "../engines/little-3d-engine/little-3d-engine.js";
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
export function squareMotion(options: SquareMotionOptions = {}): MotionController {
  const half = (options.size ?? 2.4) / 2;
  const periodMs = options.periodMs ?? 4000;
  const tilt = options.tilt ?? 0.45;
  const direction = options.direction ?? 1;
  const cosTilt = Math.cos(tilt);
  const sinTilt = Math.sin(tilt);

  return {
    positionAt(t: number): Vec3 {
      const lap = (direction * t) / periodMs;
      const s = (lap - Math.floor(lap)) * 4; // 0..4 around the four edges
      const edge = Math.floor(s);
      const f = s - edge;
      let flatX: number;
      let flatY: number;
      if (edge === 0) {
        flatX = -half + 2 * half * f;
        flatY = -half;
      } else if (edge === 1) {
        flatX = half;
        flatY = -half + 2 * half * f;
      } else if (edge === 2) {
        flatX = half - 2 * half * f;
        flatY = half;
      } else {
        flatX = -half;
        flatY = half - 2 * half * f;
      }
      return { x: flatX, y: flatY * cosTilt, z: flatY * sinTilt };
    },
  };
}
