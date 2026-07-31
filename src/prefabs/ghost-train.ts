import { CompositeAnimation } from "../composite-animation.js";
import { GhostTrainAnimation, type GhostTrainOptions } from "../animations/ghost-train.js";
import { ParticlesAnimation, type ParticlesOptions } from "../animations/particles.js";
import { starTexture } from "../engines/little-3d-engine/little-3d-engine.js";
import type { ProgressSpinnerOptions } from "../index.js";
import { progressSpinner } from "./spinner.js";
import type { ProgressPrefabOptions } from "./types.js";

export interface GhostTrainPrefabOptions extends ProgressPrefabOptions {
  /** Overrides for the train layer. */
  train?: GhostTrainOptions;
  /** Overrides for the particle layer. */
  particles?: ParticlesOptions;
}

/**
 * A progress story: a translucent train of ice cubes runs laps around a tilted
 * square track, shedding a trail of pale stars. Every 2% of progress attaches
 * one more car, popping it into existence at the tail; at 100% the whole convoy
 * peels off the track one after another and accelerates away, clearing the view
 * within four seconds as the star trail drains behind it.
 */
export function ghostTrain(options: GhostTrainPrefabOptions = {}): ProgressSpinnerOptions {
  const particles = options.particles ?? {};
  const train = new GhostTrainAnimation({
    backend: options.backend,
    ...options.train,
  });
  // The lead car defines the primary direction; the stars trail its actual position
  // through the laps and the accelerating blast-off, so the two layers stay in sync.
  const trail = new ParticlesAnimation({
    rate: 30,
    lifeMs: 1700,
    size: 0.15,
    speed: 0.11,
    colors: ["#e0f2fe", "#a5f3fc", "#c4b5fd"],
    texture: particles.texture ?? starTexture({ glow: 5 }),
    emitter: train.trailEmitter(),
    outroMs: train.outroDurationMs,
    seed: 17,
    backend: options.backend,
    ...particles,
    label: options.label ?? particles.label,
    fadeLabel: options.fadeLabel ?? particles.fadeLabel,
  });
  return progressSpinner(new CompositeAnimation([trail, train]), options);
}
