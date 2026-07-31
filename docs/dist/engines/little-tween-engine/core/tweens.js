function input(value, overextend) {
    if (Number.isNaN(value))
        return 0;
    if (overextend)
        return value;
    return Math.min(1, Math.max(0, value));
}
export function linear(value, overextend = false) {
    return input(value, overextend);
}
export function quadratic(value, overextend = false) {
    return easeInQuad(value, overextend);
}
export function cubic(value, overextend = false) {
    return easeInCubic(value, overextend);
}
export function quartic(value, overextend = false) {
    return easeInQuart(value, overextend);
}
export function quintic(value, overextend = false) {
    return easeInQuint(value, overextend);
}
export function easeInSine(value, overextend = false) {
    const x = input(value, overextend);
    return 1 - Math.cos((x * Math.PI) / 2);
}
export function easeOutSine(value, overextend = false) {
    const x = input(value, overextend);
    return Math.sin((x * Math.PI) / 2);
}
export function easeInOutSine(value, overextend = false) {
    const x = input(value, overextend);
    return -(Math.cos(Math.PI * x) - 1) / 2;
}
export function easeInQuad(value, overextend = false) {
    const x = input(value, overextend);
    return x * x;
}
export function easeOutQuad(value, overextend = false) {
    const x = input(value, overextend);
    return 1 - (1 - x) * (1 - x);
}
export function easeInOutQuad(value, overextend = false) {
    const x = input(value, overextend);
    return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
}
export function easeInCubic(value, overextend = false) {
    const x = input(value, overextend);
    return x * x * x;
}
export function easeOutCubic(value, overextend = false) {
    const x = input(value, overextend);
    return 1 - Math.pow(1 - x, 3);
}
export function easeInOutCubic(value, overextend = false) {
    const x = input(value, overextend);
    return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}
export function easeInQuart(value, overextend = false) {
    const x = input(value, overextend);
    return x * x * x * x;
}
export function easeOutQuart(value, overextend = false) {
    const x = input(value, overextend);
    return 1 - Math.pow(1 - x, 4);
}
export function easeInOutQuart(value, overextend = false) {
    const x = input(value, overextend);
    return x < 0.5 ? 8 * x * x * x * x : 1 - Math.pow(-2 * x + 2, 4) / 2;
}
export function easeInQuint(value, overextend = false) {
    const x = input(value, overextend);
    return x * x * x * x * x;
}
export function easeOutQuint(value, overextend = false) {
    const x = input(value, overextend);
    return 1 - Math.pow(1 - x, 5);
}
export function easeInOutQuint(value, overextend = false) {
    const x = input(value, overextend);
    return x < 0.5 ? 16 * x * x * x * x * x : 1 - Math.pow(-2 * x + 2, 5) / 2;
}
export function easeInExpo(value, overextend = false) {
    const x = input(value, overextend);
    return x === 0 ? 0 : Math.pow(2, 10 * x - 10);
}
export function easeOutExpo(value, overextend = false) {
    const x = input(value, overextend);
    return x === 1 ? 1 : 1 - Math.pow(2, -10 * x);
}
export function easeInOutExpo(value, overextend = false) {
    const x = input(value, overextend);
    return x === 0
        ? 0
        : x === 1
            ? 1
            : x < 0.5
                ? Math.pow(2, 20 * x - 10) / 2
                : (2 - Math.pow(2, -20 * x + 10)) / 2;
}
export function easeInCirc(value, overextend = false) {
    const x = input(value, overextend);
    return 1 - Math.sqrt(1 - Math.pow(x, 2));
}
export function easeOutCirc(value, overextend = false) {
    const x = input(value, overextend);
    return Math.sqrt(1 - Math.pow(x - 1, 2));
}
export function easeInOutCirc(value, overextend = false) {
    const x = input(value, overextend);
    return x < 0.5
        ? (1 - Math.sqrt(1 - Math.pow(2 * x, 2))) / 2
        : (Math.sqrt(1 - Math.pow(-2 * x + 2, 2)) + 1) / 2;
}
export function easeInBack(value, overextend = false) {
    const x = input(value, overextend);
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return c3 * x * x * x - c1 * x * x;
}
export function easeOutBack(value, overextend = false) {
    const x = input(value, overextend);
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
}
export function easeInOutBack(value, overextend = false) {
    const x = input(value, overextend);
    const c1 = 1.70158;
    const c2 = c1 * 1.525;
    return x < 0.5
        ? (Math.pow(2 * x, 2) * ((c2 + 1) * 2 * x - c2)) / 2
        : (Math.pow(2 * x - 2, 2) * ((c2 + 1) * (x * 2 - 2) + c2) + 2) / 2;
}
export function easeInElastic(value, overextend = false) {
    const x = input(value, overextend);
    const c4 = (2 * Math.PI) / 3;
    return x === 0
        ? 0
        : x === 1
            ? 1
            : -Math.pow(2, 10 * x - 10) * Math.sin((x * 10 - 10.75) * c4);
}
export function easeOutElastic(value, overextend = false) {
    const x = input(value, overextend);
    const c4 = (2 * Math.PI) / 3;
    return x === 0
        ? 0
        : x === 1
            ? 1
            : Math.pow(2, -10 * x) * Math.sin((x * 10 - 0.75) * c4) + 1;
}
export function easeInOutElastic(value, overextend = false) {
    const x = input(value, overextend);
    const c5 = (2 * Math.PI) / 4.5;
    return x === 0
        ? 0
        : x === 1
            ? 1
            : x < 0.5
                ? -(Math.pow(2, 20 * x - 10) * Math.sin((20 * x - 11.125) * c5)) / 2
                : (Math.pow(2, -20 * x + 10) * Math.sin((20 * x - 11.125) * c5)) / 2 + 1;
}
export function easeInBounce(value, overextend = false) {
    const x = input(value, overextend);
    return 1 - easeOutBounce(1 - x, true);
}
export function easeOutBounce(value, overextend = false) {
    let x = input(value, overextend);
    const n1 = 7.5625;
    const d1 = 2.75;
    if (x < 1 / d1) {
        return n1 * x * x;
    }
    if (x < 2 / d1) {
        x -= 1.5 / d1;
        return n1 * x * x + 0.75;
    }
    if (x < 2.5 / d1) {
        x -= 2.25 / d1;
        return n1 * x * x + 0.9375;
    }
    x -= 2.625 / d1;
    return n1 * x * x + 0.984375;
}
export function easeInOutBounce(value, overextend = false) {
    const x = input(value, overextend);
    return x < 0.5
        ? (1 - easeOutBounce(1 - 2 * x, true)) / 2
        : (1 + easeOutBounce(2 * x - 1, true)) / 2;
}
export const easeTypes = {
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
};
export function ease(type, value, overextend = false) {
    return easeTypes[type](value, overextend);
}
