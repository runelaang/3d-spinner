import { tween, type TweenType } from "./core/tweens.js";

/** Options for {@link LittleTweenEngine}. */
export interface LittleTweenEngineOptions {
  /** Tween curve used when one is not provided to {@link LittleTweenEngine.value}. */
  type?: TweenType;
  /** Allow input values outside 0..1. Default `false` clamps input to 0..1. */
  overextend?: boolean;
}

/**
 * A small zero-dependency tween engine for mapping progress values through
 * named easing curves.
 */
export class LittleTweenEngine {
  private readonly type: TweenType;
  private readonly overextend: boolean;

  constructor(options: LittleTweenEngineOptions = {}) {
    this.type = options.type ?? "linear";
    this.overextend = options.overextend ?? false;
  }

  /** Map `value` through the selected tween type. */
  value(value: number, type = this.type, overextend = this.overextend): number {
    return tween(type, value, overextend);
  }
}

export {
  tween,
  tweenTypes,
  linear,
  quadratic,
  cubic,
  quartic,
  quintic,
} from "./core/tweens.js";
export type { TweenFunction, TweenType } from "./core/tweens.js";
