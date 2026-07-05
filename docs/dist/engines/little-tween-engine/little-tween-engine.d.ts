import { type EaseType } from "./core/tweens.js";
/** Options for {@link LittleTweenEngine}. */
export interface LittleTweenEngineOptions {
    /** Ease curve used when one is not provided to {@link LittleTweenEngine.value}. */
    type?: EaseType;
    /** Allow input values outside 0..1. Default `false` clamps input to 0..1. */
    overextend?: boolean;
}
/**
 * A small zero-dependency tween engine for mapping progress values through
 * named easing curves.
 */
export declare class LittleTweenEngine {
    private readonly type;
    private readonly overextend;
    constructor(options?: LittleTweenEngineOptions);
    /** Map `value` through the selected ease type. */
    value(value: number, type?: EaseType, overextend?: boolean): number;
}
export { ease, easeTypes, linear, quadratic, cubic, quartic, quintic, easeInSine, easeOutSine, easeInOutSine, easeInQuad, easeOutQuad, easeInOutQuad, easeInCubic, easeOutCubic, easeInOutCubic, easeInQuart, easeOutQuart, easeInOutQuart, easeInQuint, easeOutQuint, easeInOutQuint, easeInExpo, easeOutExpo, easeInOutExpo, easeInCirc, easeOutCirc, easeInOutCirc, easeInBack, easeOutBack, easeInOutBack, easeInElastic, easeOutElastic, easeInOutElastic, easeInBounce, easeOutBounce, easeInOutBounce, } from "./core/tweens.js";
export type { EaseFunction, EaseType } from "./core/tweens.js";
