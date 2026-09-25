import type { SpinnerAnimation } from "./animation.cjs";
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
    /**
     * Auto-complete (drive progress to 1, playing the outro) after this many ms.
     * `NaN` throws a `RangeError`; zero or less completes on the first frame.
     */
    timeoutMs?: number;
    /** @deprecated Renamed to {@link ProgressSpinnerOptions.timeoutMs}; removed in 1.0.0. */
    timeout?: number;
    /** Auto-complete at this absolute time. If both are set, the earlier wins. */
    until?: Date;
    /** Accessible name of the spinner's progress bar for assistive technology. Default `"Loading"`. */
    ariaLabel?: string;
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
    /** Accessible name of the spinner's progress bar for assistive technology. Default `"Loading"`. */
    ariaLabel?: string;
}
export type SpinnerOptions = ProgressSpinnerOptions | IndeterminateSpinnerOptions;
export interface Spinner {
    /**
     * Settles once the animation has set up: resolves when it can draw, rejects
     * with the error when it cannot (for example a pinned backend the browser
     * lacks). On rejection the spinner stops animating and leaves the page as it
     * is; call {@link Spinner.destroy} to remove it. Built-in animations resolve it
     * when the spinner is destroyed before setup finishes.
     */
    readonly ready: Promise<void>;
    /** Set the progress target (0..1). No-op for an indeterminate spinner. */
    setProgress(target: number): void;
    /** Play the outro, then stop animating (keeps the injected DOM in place). */
    stop(): void;
    /** Stop immediately and remove the injected DOM (no outro). Safe to call more than once. */
    destroy(): void;
}
/**
 * True when the user has asked the system to reduce motion
 * (`prefers-reduced-motion: reduce`). The spinner does not act on it by itself;
 * use it to choose a calmer animation, a slower spin, or no spinner at all.
 */
export declare function prefersReducedMotion(): boolean;
/**
 * Mount `options.animation` inside `target` and start its animation loop.
 * Throws before mounting anything on invalid options or a reused animation
 * instance; setup failures after that are reported through {@link Spinner.ready}.
 */
export declare function createSpinner(target: HTMLElement, options: SpinnerOptions): Spinner;
export type { SpinnerAnimation, AnimationFrame, AnimationLabel } from "./animation.cjs";
export type { CompositeAnimationLayer } from "./composite-animation.cjs";
