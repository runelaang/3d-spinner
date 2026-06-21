import type { SpinnerPlugin } from "./plugin.js";

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
  /** Renderer used for the spinner graphics and animation. */
  plugin: SpinnerPlugin;
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

  const determinateInitially = typeof options.progress === "number";
  let determinate = determinateInitially;
  let current = determinateInitially ? clamp01(options.progress as number) : 0;
  let targetProgress = current;
  const { plugin } = options;

  plugin.mount(target);

  let rafId = 0;
  let stopped = false;
  const start = performance.now();

  let deadline = Infinity;
  if (typeof options.timeout === "number") {
    deadline = Math.min(deadline, start + options.timeout);
  }
  if (options.until instanceof Date) {
    deadline = Math.min(deadline, options.until.getTime());
  }

  function render(now: number): void {
    if (determinate) {
      current = lerp(current, targetProgress, 0.12);
      if (Math.abs(targetProgress - current) < 0.0005) current = targetProgress;
    }
    plugin.render(now, { determinate, progress: current });
  }

  function frame(now: number): void {
    if (stopped) return;
    if (now >= deadline) {
      render(now);
      stop();
      return;
    }
    render(now);
    rafId = requestAnimationFrame(frame);
  }

  function stop(): void {
    if (stopped) return;
    stopped = true;
    if (rafId) cancelAnimationFrame(rafId);
    rafId = 0;
  }

  function destroy(): void {
    stop();
    plugin.destroy();
  }

  function setProgress(value: number): void {
    determinate = true;
    targetProgress = clamp01(value);
    if (stopped) {
      current = targetProgress;
      plugin.render(performance.now(), { determinate, progress: current });
    }
  }

  rafId = requestAnimationFrame(frame);

  return { setProgress, stop, destroy };
}

export type { SpinnerPlugin, SpinnerPluginState } from "./plugin.js";
