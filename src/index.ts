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

const PALETTE = ["#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981"];

function clamp01(value: number): number {
  if (Number.isNaN(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

function lerp(from: number, to: number, t: number): number {
  return from + (to - from) * t;
}

function mixHex(a: string, b: string, t: number): string {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const ar = (pa >> 16) & 0xff;
  const ag = (pa >> 8) & 0xff;
  const ab = pa & 0xff;
  const br = (pb >> 16) & 0xff;
  const bg = (pb >> 8) & 0xff;
  const bb = pb & 0xff;
  const r = Math.round(lerp(ar, br, t));
  const g = Math.round(lerp(ag, bg, t));
  const bl = Math.round(lerp(ab, bb, t));
  return `rgb(${r}, ${g}, ${bl})`;
}

export function createSpinner(target: HTMLElement, options: SpinnerOptions = {}): Spinner {
  if (!(target instanceof HTMLElement)) {
    throw new Error("3d-spinner: createSpinner requires a target HTMLElement.");
  }

  const determinateInitially = typeof options.progress === "number";
  let determinate = determinateInitially;
  let current = determinateInitially ? clamp01(options.progress as number) : 0;
  let targetProgress = current;

  const el = document.createElement("div");
  el.className = "spinner-3d";
  el.setAttribute("role", "status");
  el.style.fontFamily = "system-ui, sans-serif";
  el.style.fontWeight = "600";
  el.style.letterSpacing = "0.02em";
  target.appendChild(el);

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
    const cycle = (now / 1500) % PALETTE.length;
    const i = Math.floor(cycle);
    const colour = mixHex(PALETTE[i], PALETTE[(i + 1) % PALETTE.length], cycle - i);
    el.style.color = colour;

    if (determinate) {
      current = lerp(current, targetProgress, 0.12);
      if (Math.abs(targetProgress - current) < 0.0005) current = targetProgress;
      el.textContent = `spinner goes here — ${Math.round(current * 100)}%`;
    } else {
      el.textContent = "spinner goes here";
    }
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
    el.remove();
  }

  function setProgress(value: number): void {
    determinate = true;
    targetProgress = clamp01(value);
    if (stopped) {
      current = targetProgress;
      el.textContent = `spinner goes here — ${Math.round(current * 100)}%`;
    }
  }

  rafId = requestAnimationFrame(frame);

  return { setProgress, stop, destroy };
}
