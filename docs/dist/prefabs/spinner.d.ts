import type { CompositeAnimation } from "../composite-animation.js";
import type { ParticlesAnimation } from "../animations/particles.js";
import type { SpinnerAnimation } from "../animation.js";
import type { IndeterminateSpinnerOptions, ProgressSpinnerOptions } from "../index.js";
import type { PrefabOptions, ProgressPrefabOptions } from "./types.js";
export declare function spinner(animation: CompositeAnimation | ParticlesAnimation, options: PrefabOptions): IndeterminateSpinnerOptions;
export declare function progressSpinner(animation: SpinnerAnimation, options: ProgressPrefabOptions): ProgressSpinnerOptions;
