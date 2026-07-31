import type { SpinnerAnimation } from "./animation.js";

/** Services available to a spinner plugin while its spinner is running. */
export interface SpinnerPluginContext {
  readonly animation: SpinnerAnimation;
  /** Current rolling frame-rate estimate, or `0` until enough frames have been observed. */
  getFrameRate(): number;
}

/** Optional behavior attached to a spinner's frame loop. */
export interface SpinnerPlugin {
  /** Called once before the first animation frame. */
  start(context: SpinnerPluginContext): void;
  /** Called after each rendered animation frame. */
  update(now: number): void;
  /** Called once when the spinner is destroyed or finishes its outro. */
  destroy(): void;
}
