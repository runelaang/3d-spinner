export interface ProgressAnimationOptions {
    /** Pop-in / pop-out duration in milliseconds. Default `500`. */
    popDurationMs?: number;
    /** Scale overshoot fraction during pop. Default `0.2` (20%). */
    overextend?: number;
    /** Share of pop duration used for the fast overshoot snap. Default `0.2`. */
    startSnapRatio?: number;
    /** Label while loading; `false` hides it. Default `"loading"`. */
    loadingText?: string | false;
    /** Label when complete. Default `"done"`. */
    doneText?: string;
    /** Fade-out duration for the done label in milliseconds. Default `2000`. */
    doneFadeDurationMs?: number;
    /** Remove all overlay content after the done fade finishes. Default `false`. */
    removeOnComplete?: boolean;
}
export interface ProgressAnimationVisual {
    /** Uniform scale multiplier (0 = invisible). */
    scale: number;
    /** Overlay label, or `null` when hidden. */
    text: string | null;
    /** Label opacity in the range 0..1. */
    textOpacity: number;
    /** When true, hide the entire animation (mesh and text). */
    hidden: boolean;
}
/**
 * Lifecycle visual for a progress spinner: an intro pop ({@link enter}), an
 * active phase whose scale tracks progress, and an outro pop ({@link exit})
 * that fades to a done label. The owner triggers `enter`/`exit`; this class
 * does not infer them from the progress value.
 *
 * Lifecycle stages:
 * - `idle`: waiting for {@link enter}; nothing is visible.
 * - `startPop`: the object pops in and settles at the current progress scale.
 * - `active`: the object scale tracks progress.
 * - `endPop`: the object pops out after {@link exit}.
 * - `done`: the object is gone while the done label fades.
 * - `finished`: all visuals are complete and {@link isFinished} returns true.
 */
export declare class ProgressAnimation {
    private readonly options;
    private phase;
    private phaseStart;
    private activeProgress;
    private popTarget;
    private doneFadeStart;
    constructor(options?: ProgressAnimationOptions);
    /** Begin the intro pop. Ignored unless idle. */
    enter(now: number): void;
    /** Begin the outro pop. Ignored unless mid-intro or active. */
    exit(now: number): void;
    isFinished(): boolean;
    update(now: number, progress: number, targetProgress?: number): ProgressAnimationVisual;
}
