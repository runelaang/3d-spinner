import { ParticlesAnimation } from "../animations/particles.js";
import { streakTexture } from "../engines/little-3d-engine/little-3d-engine.js";
import type { IndeterminateSpinnerOptions } from "../index.js";
import { spinner } from "./spinner.js";
import type { ParticlePrefabOptions } from "./types.js";

/** A fountain of black and white streaks that turn with their travel direction. */
export function monochromeStreak(options: ParticlePrefabOptions = {}): IndeterminateSpinnerOptions {
  const particles = options.particles ?? {};
  return spinner(new ParticlesAnimation({
    rate: 70,
    lifeMs: 2800,
    size: 0.38,
    speed: 1.35,
    direction: { x: 0, y: 1, z: 0 },
    spread: 0.62,
    gravity: { x: 0, y: -1.45, z: 0 },
    colors: ["#fff", "#000"],
    texture: particles.texture ?? streakTexture(),
    spin: 0,
    alignToMotion: true,
    seed: 37,
    backend: options.backend,
    ...particles,
    label: options.label ?? particles.label ?? "Loading...",
    fadeLabel: options.fadeLabel ?? particles.fadeLabel,
  }), options);
}
