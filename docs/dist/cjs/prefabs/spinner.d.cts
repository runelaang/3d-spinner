import type { CompositeAnimation } from "../composite-animation.cjs";
import type { ParticlesAnimation } from "../animations/particles.cjs";
import type { SpinnerAnimation } from "../animation.cjs";
import type { IndeterminateSpinnerOptions, ProgressSpinnerOptions } from "../index.cjs";
import type { PrefabOptions, ProgressPrefabOptions } from "./types.cjs";
/** Indeterminate spinner options for a prefab's animation, forwarding the shared prefab options. */
export declare function spinner(animation: CompositeAnimation | ParticlesAnimation, options: PrefabOptions): IndeterminateSpinnerOptions;
/** Progress spinner options for a prefab's animation; starts just above zero so the story begins on mount. */
export declare function progressSpinner(animation: SpinnerAnimation, options: ProgressPrefabOptions): ProgressSpinnerOptions;
