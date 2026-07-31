import type { SpinnerAnimation } from "./animation.js";
/** A spinner driven by real progress the caller reports via {@link Spinner.setProgress}. */
export interface ProgressSpinnerOptions {
    type?: "progress";
    /** The visual to play. */
    animation: SpinnerAnimation;
    /**
     * Initial progress 0..1. A value above 0 plays the intro immediately; omit it
     * to start idle until {@link Spinner.setProgress} is called.
     */
    progress?: number;
    /** Auto-complete (drive progress to 1, playing the outro) after this many ms. */
    timeout?: number;
    /** Auto-complete at this absolute time. If both are set, the earlier wins. */
    until?: Date;
}
/** A self-driving spinner: it loops a synthetic progress on a timer until stopped. */
export interface IndeterminateSpinnerOptions {
    type: "indeterminate";
    /** The visual to play. */
    animation: SpinnerAnimation;
    /** `"bounce"` ramps 0->1->0; `"restart"` ramps 0->1 then repeats. Default `"bounce"`. */
    loop?: "bounce" | "restart";
    /** Milliseconds for one 0->1 sweep. Must be finite and greater than zero. Default `2000`. */
    periodMs?: number;
}
export type SpinnerOptions = ProgressSpinnerOptions | IndeterminateSpinnerOptions;
export interface Spinner {
    /** Set the progress target (0..1). No-op for an indeterminate spinner. */
    setProgress(target: number): void;
    /** Play the outro, then stop animating (keeps the injected DOM in place). */
    stop(): void;
    /** Stop immediately and remove the injected DOM (no outro). Safe to call more than once. */
    destroy(): void;
}
export declare function createSpinner(target: HTMLElement, options: SpinnerOptions): Spinner;
export type { SpinnerAnimation, AnimationFrame, AnimationLabel } from "./animation.js";
export type { CompositeAnimationLayer } from "./composite-animation.js";
