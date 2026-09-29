import { ease } from "./core/tweens.js";
/**
 * A small zero-dependency tween engine for mapping progress values through
 * named easing curves.
 */
export class LittleTweenEngine {
    constructor(options = {}) {
        this.type = options.type ?? "linear";
        this.allowExtrapolation = options.allowExtrapolation ?? false;
    }
    /** Map `value` through the selected ease type. */
    evaluate(value, type = this.type, allowExtrapolation = this.allowExtrapolation) {
        return ease(type, value, allowExtrapolation);
    }
}
export { ease, easeTypes, linear, easeInSine, easeOutSine, easeInOutSine, easeInQuad, easeOutQuad, easeInOutQuad, easeInCubic, easeOutCubic, easeInOutCubic, easeInQuart, easeOutQuart, easeInOutQuart, easeInQuint, easeOutQuint, easeInOutQuint, easeInExpo, easeOutExpo, easeInOutExpo, easeInCirc, easeOutCirc, easeInOutCirc, easeInBack, easeOutBack, easeInOutBack, easeInElastic, easeOutElastic, easeInOutElastic, easeInBounce, easeOutBounce, easeInOutBounce, } from "./core/tweens.js";
export { damp } from "./core/damp.js";
