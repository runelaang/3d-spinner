import type { Vec3 } from "../engines/little-3d-engine/little-3d-engine.js";
import type { MotionController } from "./controller.js";

/** Options for {@link circleMotion}. */
export interface CircleMotionOptions {
  /** Circle radius in scene units. Default `1.3`. */
  radius?: number;
  /** Milliseconds for one full revolution. Default `3000`. */
  periodMs?: number;
  /** Tilt of the circle's plane about the X axis, radians. `0` faces the camera. Default `0.5`. */
  tilt?: number;
  /** Travel direction: `1` counter-clockwise, `-1` clockwise. Default `1`. */
  direction?: number;
}

/**
 * Orbits a circular path, nose following the tangent. `tilt` leans the circle
 * away from the camera so it reads as a 3D orbit rather than a flat ring.
 */
export function circleMotion(options: CircleMotionOptions = {}): MotionController {
  const radius = options.radius ?? 1.3;
  const periodMs = options.periodMs ?? 3000;
  const tilt = options.tilt ?? 0.5;
  const direction = options.direction ?? 1;
  const cosTilt = Math.cos(tilt);
  const sinTilt = Math.sin(tilt);

  return {
    positionAt(t: number): Vec3 {
      const angle = ((direction * t) / periodMs) * Math.PI * 2;
      const x = radius * Math.cos(angle);
      const flatY = radius * Math.sin(angle);
      return { x, y: flatY * cosTilt, z: flatY * sinTilt };
    },
  };
}
