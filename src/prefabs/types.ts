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

export interface ProgressPrefabOptions {
  /** Rendering backend used by every layer. Default `"canvas2d"`. */
  backend?: Backend;
  /** Text or custom HTML shown over the prefab (progress mode shows a percentage). */
  label?: AnimationLabel;
  /** Fade the label with the story's beginning and end. Default `true`. */
  fadeLabel?: boolean;
  /** Initial progress 0..1. Defaults just above zero so the story begins on mount. */
  progress?: number;
  /** Auto-complete (drive progress to 1) after this many milliseconds. */
  timeout?: number;
  /** Auto-complete at this absolute time. If both are set, the earlier wins. */
  until?: Date;
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

export interface MotionProgressPrefabOptions extends ProgressPrefabOptions {
  /** Overrides for the moving object layer, including `mesh` and `motion`. */
  object?: Partial<ObjectMotionOptions>;
  /** Overrides for the particle layer. */
  particles?: ParticlesOptions;
}
