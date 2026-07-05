import { easeOutCubic, easeOutExpo, easeOutQuad, easeInQuad, } from "./engines/little-tween-engine/core/tweens.js";
function resolveOptions(options = {}) {
    return {
        popDurationMs: options.popDurationMs ?? 500,
        overextend: options.overextend ?? 0.2,
        startSnapRatio: options.startSnapRatio ?? 0.2,
        loadingText: options.loadingText === undefined ? "loading" : options.loadingText,
        doneText: options.doneText ?? "done",
        doneFadeDurationMs: options.doneFadeDurationMs ?? 2000,
        removeOnComplete: options.removeOnComplete ?? false,
    };
}
function popPhaseT(now, phaseStart, durationMs) {
    if (durationMs <= 0)
        return 1;
    return Math.min(1, Math.max(0, (now - phaseStart) / durationMs));
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
export class ProgressAnimation {
    constructor(options = {}) {
        this.phase = "idle";
        this.phaseStart = 0;
        this.activeProgress = 0;
        this.popTarget = 0;
        this.doneFadeStart = 0;
        this.options = resolveOptions(options);
    }
    /** Begin the intro pop. Ignored unless idle. */
    enter(now) {
        if (this.phase !== "idle")
            return;
        this.phase = "startPop";
        this.phaseStart = now;
        this.activeProgress = 0;
        this.popTarget = 0;
    }
    /** Begin the outro pop. Ignored unless mid-intro or active. */
    exit(now) {
        if (this.phase !== "startPop" && this.phase !== "active")
            return;
        this.phase = "endPop";
        this.phaseStart = now;
    }
    isFinished() {
        return this.phase === "finished";
    }
    update(now, progress, targetProgress) {
        const { popDurationMs, overextend, startSnapRatio, loadingText, doneText, doneFadeDurationMs, removeOnComplete, } = this.options;
        const goal = targetProgress ?? progress;
        if (this.phase === "startPop" || this.phase === "active") {
            this.activeProgress = progress;
            if (this.phase === "startPop")
                this.popTarget = Math.max(this.popTarget, goal, progress);
        }
        let scale = 0;
        let text = null;
        let textOpacity = 0;
        let hidden = false;
        if (this.phase === "startPop") {
            const t = popPhaseT(now, this.phaseStart, popDurationMs);
            const peak = this.popTarget * (1 + overextend);
            if (t < startSnapRatio) {
                const snapT = startSnapRatio > 0 ? t / startSnapRatio : 1;
                scale = peak * easeOutExpo(snapT);
            }
            else {
                const settleT = startSnapRatio < 1 ? (t - startSnapRatio) / (1 - startSnapRatio) : 1;
                scale = peak + (this.activeProgress - peak) * easeOutCubic(settleT);
            }
            if (t >= 1)
                this.phase = "active";
        }
        else if (this.phase === "active") {
            scale = this.activeProgress;
        }
        else if (this.phase === "endPop") {
            const t = popPhaseT(now, this.phaseStart, popDurationMs);
            const peak = 1 + overextend;
            if (t < 0.5) {
                scale = 1 + (peak - 1) * easeOutQuad(t * 2);
            }
            else {
                scale = peak * (1 - easeInQuad((t - 0.5) * 2));
            }
            if (t >= 1) {
                this.phase = "done";
                this.doneFadeStart = now;
                scale = 0;
            }
        }
        if (this.phase === "startPop" || this.phase === "active") {
            if (loadingText !== false) {
                text = loadingText;
                textOpacity = 0.65;
            }
        }
        else if (this.phase === "endPop") {
            text = doneText;
            textOpacity = 0.65;
        }
        else if (this.phase === "done") {
            const fadeT = popPhaseT(now, this.doneFadeStart, doneFadeDurationMs);
            if (fadeT >= 1) {
                if (removeOnComplete)
                    hidden = true;
                this.phase = "finished";
            }
            else {
                text = doneText;
                textOpacity = 0.65 * (1 - fadeT);
            }
        }
        return { scale, text, textOpacity, hidden };
    }
}
