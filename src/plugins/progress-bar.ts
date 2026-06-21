import type { SpinnerPlugin, SpinnerPluginState } from "../plugin.js";

export class ProgressBarSpinner implements SpinnerPlugin {
  private el?: HTMLDivElement;

  mount(target: HTMLElement): void {
    const el = document.createElement("div");
    el.className = "spinner-3d-progress-bar";
    target.appendChild(el);
    this.el = el;
  }

  render(_now: number, state: SpinnerPluginState): void {
    if (!this.el) return;
    this.el.textContent = state.determinate
      ? `progress bar stub - ${Math.round(state.progress * 100)}%`
      : "progress bar stub";
  }

  destroy(): void {
    this.el?.remove();
    this.el = undefined;
  }
}
