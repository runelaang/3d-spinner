import type { CompositeAnimation } from "../composite-animation.js";
import type { ParticlesAnimation } from "../animations/particles.js";
import type { SpinnerAnimation } from "../animation.js";
import type { IndeterminateSpinnerOptions, ProgressSpinnerOptions } from "../index.js";
import type { PrefabOptions, ProgressPrefabOptions } from "./types.js";

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

export function progressSpinner(
  animation: SpinnerAnimation,
  options: ProgressPrefabOptions,
): ProgressSpinnerOptions {
  return {
    type: "progress",
    animation,
    progress: options.progress ?? 0.001,
    timeout: options.timeout,
    until: options.until,
  };
}
