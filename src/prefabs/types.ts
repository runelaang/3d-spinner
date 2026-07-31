import type { AnimationLabel } from "../animation.js";
import type { ObjectMotionOptions } from "../animations/object-motion.js";
import type { ParticlesOptions } from "../animations/particles.js";
import type { Backend } from "../engines/little-3d-engine/little-3d-engine.js";

export interface PrefabOptions {
  /** Rendering backend used by every layer. Default `"canvas2d"`. */
  backend?: Backend;
  /** Text or custom HTML shown over the prefab. */
  label?: AnimationLabel;
  /** Fade the label during intro and outro. Default `true`. */
  fadeLabel?: boolean;
  /** Indeterminate progress loop. Default `"bounce"`. */
  loop?: "bounce" | "restart";
  /** Milliseconds for one progress sweep. Default `2000`. */
  periodMs?: number;
}

export interface MotionPrefabOptions extends PrefabOptions {
  /** Overrides for the moving object layer, including `mesh` and `motion`. */
  object?: Partial<ObjectMotionOptions>;
  /** Overrides for the particle layer. */
  particles?: ParticlesOptions;
}

export interface ParticlePrefabOptions extends PrefabOptions {
  /** Overrides for the particle animation. */
  particles?: ParticlesOptions;
}
