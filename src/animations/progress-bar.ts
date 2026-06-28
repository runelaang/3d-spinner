import type { AnimationFrame, SpinnerAnimation } from "../animation.js";

/** A minimal text progress-bar stub showing the current percentage. */
export class ProgressBarAnimation implements SpinnerAnimation {
  private el?: HTMLDivElement;
  private exited = false;

  mount(target: HTMLElement): void {
    const el = document.createElement("div");
    el.className = "spinner-3d-progress-bar";
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

  render(_now: number, frame: AnimationFrame): void {
    if (!this.el) return;
    this.el.textContent = `progress bar stub - ${Math.round(frame.progress * 100)}%`;
  }

  destroy(): void {
    this.el?.remove();
    this.el = undefined;
  }
}
