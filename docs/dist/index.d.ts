export interface SpinnerOptions {
    /** Auto-stop after this many milliseconds. */
    timeout?: number;
    /** Auto-stop at this absolute time. If both `timeout` and `until` are set, the earlier wins. */
    until?: Date;
    /**
     * Initial progress in the range 0..1. Providing it puts the spinner in
     * determinate mode; omit it for an indeterminate spinner.
     */
    progress?: number;
}
export interface Spinner {
    /**
     * Smoothly advance progress toward `target` (0..1). The spinner lerps from its
     * current value to the target over subsequent frames, so a host app can call
     * this repeatedly as work completes and the motion stays smooth.
     */
    setProgress(target: number): void;
    /** Stop the animation but keep the injected DOM in place. */
    stop(): void;
    /** Stop and remove the injected DOM. */
    destroy(): void;
}
export declare function createSpinner(target: HTMLElement, options?: SpinnerOptions): Spinner;
