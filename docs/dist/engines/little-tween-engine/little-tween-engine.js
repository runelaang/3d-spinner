import { ease } from "./core/tweens.js";
/**
 * A small zero-dependency tween engine for mapping progress values through
 * named easing curves.
 */
export class LittleTweenEngine {
    constructor(options = {}) {
        this.type = options.type ?? "linear";
        this.allowExtrapolation = options.allowExtrapolation ?? options.overextend ?? false;
    }
    /** Map `value` through the selected ease type. */
    evaluate(value, type = this.type, allowExtrapolation = this.allowExtrapolation) {
        return ease(type, value, allowExtrapolation);
    }
    /** @deprecated Renamed to {@link LittleTweenEngine.evaluate}; removed in 1.0.0. */
    value(value, type = this.type, allowExtrapolation = this.allowExtrapolation) {
        return this.evaluate(value, type, allowExtrapolation);
    }
}
export { ease, easeTypes, linear, quadratic, cubic, quartic, quintic, easeInSine, easeOutSine, easeInOutSine, easeInQuad, easeOutQuad, easeInOutQuad, easeInCubic, easeOutCubic, easeInOutCubic, easeInQuart, easeOutQuart, easeInOutQuart, easeInQuint, easeOutQuint, easeInOutQuint, easeInExpo, easeOutExpo, easeInOutExpo, easeInCirc, easeOutCirc, easeInOutCirc, easeInBack, easeOutBack, easeInOutBack, easeInElastic, easeOutElastic, easeInOutElastic, easeInBounce, easeOutBounce, easeInOutBounce, } from "./core/tweens.js";
export { damp } from "./core/damp.js";
