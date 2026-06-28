import type { AnimationFrame, SpinnerAnimation } from "../animation.js";

const PALETTE = ["#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981"];

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

/** A placeholder text spinner that cycles colors; shows the percentage when determinate. */
export class TestAnimation implements SpinnerAnimation {
  private el?: HTMLDivElement;
  private exited = false;

  mount(target: HTMLElement): void {
    const el = document.createElement("div");
    el.className = "spinner-3d";
    el.setAttribute("role", "status");
    el.style.fontFamily = "system-ui, sans-serif";
    el.style.fontWeight = "600";
    el.style.letterSpacing = "0.02em";
    target.appendChild(el);
    this.el = el;
  }

  enter(): void {}

  exit(): void {
    this.exited = true;
  }

  isFinished(): boolean {
    return this.exited;
  }

  render(now: number, frame: AnimationFrame): void {
    if (!this.el) return;

    const cycle = (now / 1500) % PALETTE.length;
    const i = Math.floor(cycle);
    this.el.style.color = mixHex(PALETTE[i], PALETTE[(i + 1) % PALETTE.length], cycle - i);

    this.el.textContent = frame.indeterminate
      ? "spinner goes here"
      : `spinner goes here - ${Math.round(frame.progress * 100)}%`;
  }

  destroy(): void {
    this.el?.remove();
    this.el = undefined;
  }
}
