import { type EaseType } from "./core/tweens.cjs";
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
export declare class LittleTweenEngine {
    private readonly type;
    private readonly allowExtrapolation;
    constructor(options?: LittleTweenEngineOptions);
    /** Map `value` through the selected ease type. */
    evaluate(value: number, type?: EaseType, allowExtrapolation?: boolean): number;
    /** @deprecated Renamed to {@link LittleTweenEngine.evaluate}; removed in 1.0.0. */
    value(value: number, type?: EaseType, allowExtrapolation?: boolean): number;
}
export { ease, easeTypes, linear, quadratic, cubic, quartic, quintic, easeInSine, easeOutSine, easeInOutSine, easeInQuad, easeOutQuad, easeInOutQuad, easeInCubic, easeOutCubic, easeInOutCubic, easeInQuart, easeOutQuart, easeInOutQuart, easeInQuint, easeOutQuint, easeInOutQuint, easeInExpo, easeOutExpo, easeInOutExpo, easeInCirc, easeOutCirc, easeInOutCirc, easeInBack, easeOutBack, easeInOutBack, easeInElastic, easeOutElastic, easeInOutElastic, easeInBounce, easeOutBounce, easeInOutBounce, } from "./core/tweens.cjs";
export type { EaseFunction, EaseType } from "./core/tweens.cjs";
export { damp } from "./core/damp.cjs";
