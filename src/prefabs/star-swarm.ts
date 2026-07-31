import { ParticlesAnimation } from "../animations/particles.js";
import { starTexture } from "../engines/little-3d-engine/little-3d-engine.js";
import { wanderMotion } from "../motion/wander.js";
import type { IndeterminateSpinnerOptions } from "../index.js";
import { spinner } from "./spinner.js";
import type { ParticlePrefabOptions } from "./types.js";

/** Bright star particles wandering around a centered loading message. */
export function starSwarm(options: ParticlePrefabOptions = {}): IndeterminateSpinnerOptions {
  const particles = options.particles ?? {};
  const emitter = particles.emitter ?? wanderMotion({
    bounds: { x: 1.1, y: 0.72, z: 0.35 },
    periodMs: 7200,
    seed: 19,
  });
  return spinner(new ParticlesAnimation({
    rate: 38,
    lifeMs: 2600,
    size: 0.15,
    speed: 0.17,
    colors: ["#fef08a", "#f9a8d4", "#a5f3fc"],
    texture: particles.texture ?? starTexture(),
    emitter,
    seed: 91,
    backend: options.backend,
    ...particles,
    label: options.label ?? particles.label ?? "Loading...",
    fadeLabel: options.fadeLabel ?? particles.fadeLabel,
  }), options);
}
