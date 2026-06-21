import type { SpinnerPlugin, SpinnerPluginState } from "../plugin.js";
import type { Backend } from "../engines/little-3d-engine/little-3d-engine.js";
import { Basic3dSpinSpinner } from "./basic-3d-spin.js";

export interface Basic3dCubeOptions {
  /** Rendering backend. Default `"canvas2d"`. */
  backend?: Backend;
}

/** A spinning cube. Thin wrapper around {@link Basic3dSpinSpinner} with default options. */
export class Basic3dCubeSpinner implements SpinnerPlugin {
  private readonly spin: Basic3dSpinSpinner;

  constructor(options: Basic3dCubeOptions = {}) {
    this.spin = new Basic3dSpinSpinner({ backend: options.backend });
  }

  mount(target: HTMLElement): void {
    this.spin.mount(target);
  }

  render(now: number, state: SpinnerPluginState): void {
    this.spin.render(now, state);
  }

  destroy(): void {
    this.spin.destroy();
  }
}
