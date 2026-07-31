import type { Vec3 } from "../engines/little-3d-engine/little-3d-engine.js";

/**
 * Describes *how* an object moves: a pure function from time to a position in
 * scene units. The animation that consumes it derives orientation from the path
 * tangent, so a controller only has to say where the object is at time `t`.
 *
 * `positionAt` must be a pure function of `t` (same input -> same output) so the
 * path is reproducible and can be sampled at offset times.
 */
export interface MotionController {
  /** Position in scene units at time `t` (milliseconds). */
  positionAt(t: number): Vec3;
}
