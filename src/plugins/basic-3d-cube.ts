import type { SpinnerPlugin, SpinnerPluginState } from "../plugin.js";

export class Basic3dCubeSpinner implements SpinnerPlugin {
  private el?: HTMLDivElement;

  mount(target: HTMLElement): void {
    const el = document.createElement("div");
    el.className = "spinner-basic-3d-cube";
    target.appendChild(el);
    this.el = el;
  }

  render(_now: number, state: SpinnerPluginState): void {
    if (!this.el) return;
    this.el.textContent = state.determinate
      ? `basic 3d cube stub - ${Math.round(state.progress * 100)}%`
      : "basic 3d cube stub";
  }

  destroy(): void {
    this.el?.remove();
    this.el = undefined;
  }
}
