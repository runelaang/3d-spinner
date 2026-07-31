import type { SpinnerPlugin, SpinnerPluginContext } from "../plugin.js";
import { hasAdjustableQuality, type AdjustableQualitySetting } from "../quality.js";

export interface AdaptiveQualityOptions {
  /** Desired frame rate. Default `60`. */
  targetFps?: number;
  /** Adjustable setting name. Default `"particles"`. */
  setting?: string;
  /** Measurement interval in milliseconds. Default `1000`. */
  intervalMs?: number;
  /** Fraction of the originally requested value changed per adjustment. Default `0.05`. */
  step?: number;
  /** FPS range below the target treated as steady. Default `2`. */
  toleranceFps?: number;
  /** Consecutive steady samples required before restoring quality. Default `2`. */
  recoverySamples?: number;
}

function positive(value: number, name: string): number {
  if (!Number.isFinite(value) || value <= 0) {
    throw new RangeError(`3d-spinner: ${name} must be a finite number greater than zero.`);
  }
  return value;
}

/**
 * Adjust a named animation quality setting from rolling FPS samples. Quality
 * falls one step per low sample and recovers after the frame rate stays near
 * the target, bounded by the animation's minimum and originally requested value.
 */
export function adaptiveQuality(options: AdaptiveQualityOptions = {}): SpinnerPlugin {
  const targetFps = positive(options.targetFps ?? 60, "targetFps");
  const intervalMs = positive(options.intervalMs ?? 1000, "intervalMs");
  const stepFraction = positive(options.step ?? 0.05, "step");
  const toleranceFps = Math.max(0, options.toleranceFps ?? 2);
  const recoverySamples = Math.max(1, Math.floor(options.recoverySamples ?? 2));
  const settingName = options.setting ?? "particles";
  let context: SpinnerPluginContext | undefined;
  let setting: AdjustableQualitySetting | undefined;
  let lastSampleAt = -Infinity;
  let steadySamples = 0;

  return {
    start(nextContext): void {
      context = nextContext;
      const animation = nextContext.animation;
      setting = hasAdjustableQuality(animation)
        ? animation.getQualitySettings().find((candidate) => candidate.name === settingName)
        : undefined;
    },

    update(now): void {
      if (!context || !setting || now - lastSampleAt < intervalMs) return;
      lastSampleAt = now;
      const fps = context.getFrameRate();
      if (fps <= 0) return;
      const amount = Math.max(1, Math.ceil(setting.requested * stepFraction));
      if (fps < targetFps - toleranceFps) {
        steadySamples = 0;
        setting.set(Math.max(setting.minimum, setting.current - amount));
        return;
      }
      if (setting.current >= setting.requested) return;
      steadySamples++;
      if (steadySamples >= recoverySamples) {
        steadySamples = 0;
        setting.set(Math.min(setting.requested, setting.current + amount));
      }
    },

    destroy(): void {
      context = undefined;
      setting = undefined;
      steadySamples = 0;
    },
  };
}
