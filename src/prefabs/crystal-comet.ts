import { CompositeAnimation } from "../composite-animation.js";
import { ObjectMotionAnimation } from "../animations/object-motion.js";
import { ParticlesAnimation } from "../animations/particles.js";
import { shineTexture, tetrahedron } from "../engines/little-3d-engine/little-3d-engine.js";
import { figureEightMotion } from "../motion/figure-eight.js";
import type { IndeterminateSpinnerOptions } from "../index.js";
import { spinner } from "./spinner.js";
import type { MotionPrefabOptions } from "./types.js";

/** A spinning crystal primitive with a luminous comet trail. */
export function crystalComet(options: MotionPrefabOptions = {}): IndeterminateSpinnerOptions {
  const motion = options.object?.motion ?? figureEightMotion({ size: 0.66, periodMs: 7200 });
  const particles = options.particles ?? {};
  // The object defines the primary direction; the particles trail its actual position through
  // the intro/outro fly transitions (not the bare path), so the two layers stay in sync.
  const object = new ObjectMotionAnimation({
    mesh: () => tetrahedron(1, ["#f0f9ff", "#7dd3fc", "#818cf8", "#e879f9"]),
    motion,
    size: 0.42,
    rotation: { spinX: 0.002, spinY: 0.003 },
    backend: options.backend,
    ...options.object,
    label: options.object?.label,
  });
  const animation = new CompositeAnimation([
    new ParticlesAnimation({
      rate: 44,
      lifeMs: 2300,
      size: 0.25,
      speed: 0.08,
      colors: ["#ffffff", "#bae6fd", "#818cf8"],
      texture: particles.texture ?? shineTexture(),
      emitter: object.trailEmitter(),
      outroMs: object.outroDurationMs,
      seed: 28,
      backend: options.backend,
      ...particles,
      label: options.label ?? particles.label ?? "Polishing pixels",
      fadeLabel: options.fadeLabel ?? particles.fadeLabel,
    }),
    object,
  ]);
  return spinner(animation, options);
}
