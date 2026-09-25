import { ease, type EaseType } from "./core/tweens.js";

/** Options for {@link LittleTweenEngine}. */
export interface LittleTweenEngineOptions {
  /** Ease curve used when one is not provided to {@link LittleTweenEngine.evaluate}. */
  type?: EaseType;
  /** Allow input values outside 0..1. Default `false` clamps input to 0..1. */
  allowExtrapolation?: boolean;
  /** @deprecated Renamed to {@link LittleTweenEngineOptions.allowExtrapolation}; removed in 1.0.0. */
  overextend?: boolean;
}

/**
 * A small zero-dependency tween engine for mapping progress values through
 * named easing curves.
 */
export class LittleTweenEngine {
  private readonly type: EaseType;
  private readonly allowExtrapolation: boolean;

  constructor(options: LittleTweenEngineOptions = {}) {
    this.type = options.type ?? "linear";
    this.allowExtrapolation = options.allowExtrapolation ?? options.overextend ?? false;
  }

  /** Map `value` through the selected ease type. */
  evaluate(value: number, type = this.type, allowExtrapolation = this.allowExtrapolation): number {
    return ease(type, value, allowExtrapolation);
  }

  /** @deprecated Renamed to {@link LittleTweenEngine.evaluate}; removed in 1.0.0. */
  value(value: number, type = this.type, allowExtrapolation = this.allowExtrapolation): number {
    return this.evaluate(value, type, allowExtrapolation);
  }
}

export {
  ease,
  easeTypes,
  linear,
  quadratic,
  cubic,
  quartic,
  quintic,
  easeInSine,
  easeOutSine,
  easeInOutSine,
  easeInQuad,
  easeOutQuad,
  easeInOutQuad,
  easeInCubic,
  easeOutCubic,
  easeInOutCubic,
  easeInQuart,
  easeOutQuart,
  easeInOutQuart,
  easeInQuint,
  easeOutQuint,
  easeInOutQuint,
  easeInExpo,
  easeOutExpo,
  easeInOutExpo,
  easeInCirc,
  easeOutCirc,
  easeInOutCirc,
  easeInBack,
  easeOutBack,
  easeInOutBack,
  easeInElastic,
  easeOutElastic,
  easeInOutElastic,
  easeInBounce,
  easeOutBounce,
  easeInOutBounce,
} from "./core/tweens.js";
export type { EaseFunction, EaseType } from "./core/tweens.js";
export { damp } from "./core/damp.js";
