/** Per-frame state handed to a {@link SpinnerAnimation}. */
export interface AnimationFrame {
    /**
     * Progress in the range 0..1. Lerped from the caller's target for a
     * `progress` spinner; a synthetic looping value for an `indeterminate` one.
     */
    readonly progress: number;
    /** Lerp destination for `progress` (equals `progress` for an indeterminate spinner). */
    readonly targetProgress: number;
    /** True when the spinner is indeterminate (progress is a synthetic loop). */
    readonly indeterminate: boolean;
}
/** Text or custom HTML displayed over an animation. */
export type AnimationLabel = string | HTMLElement;
/**
 * A reusable visual: a cube spin, a flying plane, a progress bar. The animation
 * owns its intro/loop/outro visuals but does not decide *when* to play them -
 * the spinner runner triggers {@link enter} and {@link exit}.
 */
export interface SpinnerAnimation {
    mount(target: HTMLElement): void;
    /** Play the intro once. Calls after the first are ignored. */
    enter(now: number): void;
    /** Begin the outro. {@link isFinished} becomes true once it completes. */
    exit(now: number): void;
    render(now: number, frame: AnimationFrame): void;
    /** True once the outro has finished and the spinner can be torn down. */
    isFinished(): boolean;
    destroy(): void;
}
