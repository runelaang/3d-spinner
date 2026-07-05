import type { CompositeAnimation } from "../composite-animation.js";
import type { ParticlesAnimation } from "../animations/particles.js";
import type { IndeterminateSpinnerOptions } from "../index.js";
import type { PrefabOptions } from "./types.js";

export function spinner(
  animation: CompositeAnimation | ParticlesAnimation,
  options: PrefabOptions,
): IndeterminateSpinnerOptions {
  return {
    type: "indeterminate",
    animation,
    loop: options.loop,
    periodMs: options.periodMs,
  };
}
