import {
  easeOutCubic,
  easeOutExpo,
  easeOutQuad,
  easeInQuad,
} from "./engines/little-tween-engine/core/tweens.js";

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

type Phase = "idle" | "startPop" | "active" | "endPop" | "done";

interface ResolvedOptions {
  popDurationMs: number;
  overextend: number;
  startSnapRatio: number;
  loadingText: string | false;
  doneText: string;
  doneFadeDurationMs: number;
  removeOnComplete: boolean;
}

function resolveOptions(options: ProgressAnimationOptions = {}): ResolvedOptions {
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

function popPhaseT(now: number, phaseStart: number, durationMs: number): number {
  if (durationMs <= 0) return 1;
  return Math.min(1, Math.max(0, (now - phaseStart) / durationMs));
}

/** Maps determinate progress to scale and optional overlay text with start/end pop effects. */
export class ProgressAnimation {
  private readonly options: ResolvedOptions;
  private phase: Phase = "idle";
  private phaseStart = 0;
  private lastProgress = 0;
  private activeProgress = 0;
  private popTarget = 0;
  private doneFadeStart = 0;

  constructor(options: ProgressAnimationOptions = {}) {
    this.options = resolveOptions(options);
  }

  update(now: number, progress: number, targetProgress?: number): ProgressAnimationVisual {
    const {
      popDurationMs,
      overextend,
      startSnapRatio,
      loadingText,
      doneText,
      doneFadeDurationMs,
      removeOnComplete,
    } = this.options;
    const goal = targetProgress ?? progress;

    if (this.phase == "done" && progress <= 0) {
      this.phase = "idle";
      this.doneFadeStart = 0;
    }

    if (this.phase == "endPop" && progress < 1) {
      this.phase = progress <= 0 ? "idle" : "active";
      this.activeProgress = progress;
    }

    if (this.phase == "done" && progress > 0 && progress < 1) {
      this.phase = "active";
      this.activeProgress = progress;
    }

    if (progress <= 0 && (this.phase == "active" || this.phase == "startPop")) {
      this.phase = "idle";
    }

    if (this.phase == "idle" && this.lastProgress <= 0 && progress > 0) {
      this.phase = "startPop";
      this.phaseStart = now;
      this.activeProgress = progress;
      this.popTarget = goal;
    }

    if (
      progress >= 1 &&
      this.lastProgress < 1 &&
      (this.phase == "startPop" || this.phase == "active" || this.phase == "idle")
    ) {
      this.phase = "endPop";
      this.phaseStart = now;
      this.activeProgress = 1;
    }

    if (this.phase == "startPop" || this.phase == "active") {
      this.activeProgress = progress;
      if (this.phase == "startPop") {
        this.popTarget = Math.max(this.popTarget, goal, progress);
      }
    }

    let scale = 0;
    let text: string | null = null;
    let textOpacity = 0;
    let hidden = false;

    if (this.phase == "idle") {
      scale = 0;
    } else if (this.phase == "startPop") {
      const t = popPhaseT(now, this.phaseStart, popDurationMs);
      const peak = this.popTarget * (1 + overextend);
      if (t < startSnapRatio) {
        const snapT = startSnapRatio > 0 ? t / startSnapRatio : 1;
        scale = peak * easeOutExpo(snapT);
      } else {
        const settleT =
          startSnapRatio < 1 ? (t - startSnapRatio) / (1 - startSnapRatio) : 1;
        scale = peak + (this.activeProgress - peak) * easeOutCubic(settleT);
      }
      if (t >= 1) this.phase = "active";
    } else if (this.phase == "active") {
      scale = this.activeProgress;
    } else if (this.phase == "endPop") {
      const t = popPhaseT(now, this.phaseStart, popDurationMs);
      const peak = 1 + overextend;
      if (t < 0.5) {
        scale = 1 + (peak - 1) * easeOutQuad(t * 2);
      } else {
        scale = peak * (1 - easeInQuad((t - 0.5) * 2));
      }
      if (t >= 1) {
        this.phase = "done";
        this.doneFadeStart = now;
        scale = 0;
      }
    } else {
      scale = 0;
    }

    if (this.phase == "startPop" || this.phase == "active") {
      if (loadingText !== false) {
        text = loadingText;
        textOpacity = 0.65;
      }
    } else if (this.phase == "endPop") {
      text = doneText;
      textOpacity = 0.65;
    } else if (this.phase == "done") {
      if (removeOnComplete) {
        const fadeT = popPhaseT(now, this.doneFadeStart, doneFadeDurationMs);
        if (fadeT >= 1) {
          hidden = true;
        } else {
          text = doneText;
          textOpacity = 0.65 * (1 - fadeT);
        }
      } else {
        const fadeT = popPhaseT(now, this.doneFadeStart, doneFadeDurationMs);
        if (fadeT < 1) {
          text = doneText;
          textOpacity = 0.65 * (1 - fadeT);
        }
      }
    }

    this.lastProgress = progress;
    return { scale, text, textOpacity, hidden };
  }
}
