import { ease } from "./core/tweens.js";
/**
 * A small zero-dependency tween engine for mapping progress values through
 * named easing curves.
 */
export class LittleTweenEngine {
    constructor(options = {}) {
        this.type = options.type ?? "linear";
        this.overextend = options.overextend ?? false;
    }
    /** Map `value` through the selected ease type. */
    value(value, type = this.type, overextend = this.overextend) {
        return ease(type, value, overextend);
    }
}
export { ease, easeTypes, linear, quadratic, cubic, quartic, quintic, easeInSine, easeOutSine, easeInOutSine, easeInQuad, easeOutQuad, easeInOutQuad, easeInCubic, easeOutCubic, easeInOutCubic, easeInQuart, easeOutQuart, easeInOutQuart, easeInQuint, easeOutQuint, easeInOutQuint, easeInExpo, easeOutExpo, easeInOutExpo, easeInCirc, easeOutCirc, easeInOutCirc, easeInBack, easeOutBack, easeInOutBack, easeInElastic, easeOutElastic, easeInOutElastic, easeInBounce, easeOutBounce, easeInOutBounce, } from "./core/tweens.js";
