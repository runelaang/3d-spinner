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
  /** Milliseconds for one 0->1 sweep. Default `2000`. */
  periodMs?: number;
}

export type SpinnerOptions = ProgressSpinnerOptions | IndeterminateSpinnerOptions;

export interface Spinner {
  /** Set the progress target (0..1). No-op for an indeterminate spinner. */
  setProgress(target: number): void;
  /** Play the outro, then stop animating (keeps the injected DOM in place). */
  stop(): void;
  /** Stop immediately and remove the injected DOM (no outro). */
  destroy(): void;
}

function clamp01(value: number): number {
  if (Number.isNaN(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

function lerp(from: number, to: number, t: number): number {
  return from + (to - from) * t;
}

export function createSpinner(target: HTMLElement, options: SpinnerOptions): Spinner {
  if (!(target instanceof HTMLElement)) {
    throw new Error("3d-spinner: createSpinner requires a target HTMLElement.");
  }

  const { animation } = options;
  const indeterminate = options.type === "indeterminate";
  animation.mount(target);

  const start = performance.now();
  let rafId = 0;
  let stopped = false;
  let entered = false;
  let exiting = false;

  // Progress source (determinate only).
  let current = 0;
  let targetProgress = 0;
  let deadline = Infinity;
  if (!indeterminate) {
    const opts = options as ProgressSpinnerOptions;
    if (typeof opts.progress === "number") {
      current = clamp01(opts.progress);
      targetProgress = current;
    }
    if (typeof opts.timeout === "number") deadline = Math.min(deadline, start + opts.timeout);
    if (opts.until instanceof Date) deadline = Math.min(deadline, opts.until.getTime());
  }

  function computeProgress(now: number): number {
    if (!indeterminate) {
      if (now >= deadline) targetProgress = 1;
      current = lerp(current, targetProgress, 0.12);
      if (Math.abs(targetProgress - current) < 0.0005) current = targetProgress;
      return current;
    }
    const opts = options as IndeterminateSpinnerOptions;
    const period = opts.periodMs ?? 2000;
    const t = (now - start) / period;
    if ((opts.loop ?? "bounce") === "restart") return t - Math.floor(t);
    const phase = t - 2 * Math.floor(t / 2); // 0..2
    return phase <= 1 ? phase : 2 - phase; // triangle 0..1..0
  }

  function frame(now: number): void {
    if (stopped) return;
    const progress = computeProgress(now);

    if (!entered && (indeterminate || progress > 0)) {
      animation.enter(now);
      entered = true;
    }
    if (!exiting && entered && !indeterminate && progress >= 1 && targetProgress >= 1) {
      animation.exit(now);
      exiting = true;
    }

    const target = indeterminate ? progress : targetProgress;
    animation.render(now, { progress, targetProgress: target, indeterminate });

    if (exiting && animation.isFinished()) {
      halt();
      return;
    }
    rafId = requestAnimationFrame(frame);
  }

  function halt(): void {
    if (stopped) return;
    stopped = true;
    if (rafId) cancelAnimationFrame(rafId);
    rafId = 0;
  }

  function setProgress(value: number): void {
    if (!indeterminate) targetProgress = clamp01(value);
  }

  function stop(): void {
    if (stopped || exiting) return;
    if (!entered) {
      halt();
      return;
    }
    animation.exit(performance.now());
    exiting = true;
  }

  function destroy(): void {
    halt();
    animation.destroy();
  }

  rafId = requestAnimationFrame(frame);
  return { setProgress, stop, destroy };
}

export type { SpinnerAnimation, AnimationFrame } from "./animation.js";
