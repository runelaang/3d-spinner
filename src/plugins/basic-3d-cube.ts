import type { SpinnerPlugin, SpinnerPluginState } from "../plugin.js";
import type { Backend } from "../engines/little-3d-engine/little-3d-engine.js";
import {
  ProgressAnimation,
  type ProgressAnimationOptions,
} from "../progress-animation.js";
import { Basic3dSpinSpinner } from "./basic-3d-spin.js";

export interface Basic3dCubeOptions {
  /** Rendering backend. Default `"canvas2d"`. */
  backend?: Backend;
  /** Start/end pop effects and optional overlay label. */
  progressAnimation?: ProgressAnimationOptions;
}

const LABEL_STYLE = [
  "position:absolute",
  "inset:0",
  "display:flex",
  "align-items:center",
  "justify-content:center",
  "pointer-events:none",
  "font:600 1.1rem/1.2 system-ui,sans-serif",
  "letter-spacing:0.06em",
  "text-transform:lowercase",
  "color:rgba(255,255,255,0.65)",
  "z-index:1",
].join(";");

/** A spinning cube whose size reflects determinate progress, with optional pop in/out. */
export class Basic3dCubeSpinner implements SpinnerPlugin {
  private readonly spin: Basic3dSpinSpinner;
  private readonly progressAnimation: ProgressAnimation;
  private label?: HTMLDivElement;
  private hidden = false;
  private lastState?: SpinnerPluginState;

  constructor(options: Basic3dCubeOptions = {}) {
    this.progressAnimation = new ProgressAnimation(options.progressAnimation);
    this.spin = new Basic3dSpinSpinner({
      backend: options.backend,
      resolveProgressScale: (progress, now) => {
        const visual = this.progressAnimation.update(
          now,
          progress,
          this.lastState?.targetProgress,
        );
        this.applyLabel(visual);
        return visual.hidden ? 0 : visual.scale;
      },
    });
  }

  mount(target: HTMLElement): void {
    target.style.position = "relative";
    this.spin.mount(target);
    const label = document.createElement("div");
    label.style.cssText = LABEL_STYLE;
    label.setAttribute("aria-hidden", "true");
    label.hidden = true;
    target.appendChild(label);
    this.label = label;
  }

  render(now: number, state: SpinnerPluginState): void {
    this.lastState = state;
    if (this.hidden) return;
    this.spin.render(now, state);
  }

  destroy(): void {
    this.label?.remove();
    this.label = undefined;
    this.spin.destroy();
  }

  private applyLabel(visual: ReturnType<ProgressAnimation["update"]>): void {
    if (!this.label) return;
    this.hidden = visual.hidden;
    if (visual.hidden || visual.text == null) {
      this.label.hidden = true;
      this.label.textContent = "";
      return;
    }
    this.label.hidden = false;
    this.label.textContent = visual.text;
    this.label.style.opacity = String(visual.textOpacity);
  }
}

export type { ProgressAnimationOptions } from "../progress-animation.js";
