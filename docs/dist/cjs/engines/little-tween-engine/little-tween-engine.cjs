"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/engines/little-tween-engine/little-tween-engine.ts
var little_tween_engine_exports = {};
__export(little_tween_engine_exports, {
  LittleTweenEngine: () => LittleTweenEngine,
  cubic: () => cubic,
  ease: () => ease,
  easeInBack: () => easeInBack,
  easeInBounce: () => easeInBounce,
  easeInCirc: () => easeInCirc,
  easeInCubic: () => easeInCubic,
  easeInElastic: () => easeInElastic,
  easeInExpo: () => easeInExpo,
  easeInOutBack: () => easeInOutBack,
  easeInOutBounce: () => easeInOutBounce,
  easeInOutCirc: () => easeInOutCirc,
  easeInOutCubic: () => easeInOutCubic,
  easeInOutElastic: () => easeInOutElastic,
  easeInOutExpo: () => easeInOutExpo,
  easeInOutQuad: () => easeInOutQuad,
  easeInOutQuart: () => easeInOutQuart,
  easeInOutQuint: () => easeInOutQuint,
  easeInOutSine: () => easeInOutSine,
  easeInQuad: () => easeInQuad,
  easeInQuart: () => easeInQuart,
  easeInQuint: () => easeInQuint,
  easeInSine: () => easeInSine,
  easeOutBack: () => easeOutBack,
  easeOutBounce: () => easeOutBounce,
  easeOutCirc: () => easeOutCirc,
  easeOutCubic: () => easeOutCubic,
  easeOutElastic: () => easeOutElastic,
  easeOutExpo: () => easeOutExpo,
  easeOutQuad: () => easeOutQuad,
  easeOutQuart: () => easeOutQuart,
  easeOutQuint: () => easeOutQuint,
  easeOutSine: () => easeOutSine,
  easeTypes: () => easeTypes,
  linear: () => linear,
  quadratic: () => quadratic,
  quartic: () => quartic,
  quintic: () => quintic
});
module.exports = __toCommonJS(little_tween_engine_exports);

// src/engines/little-tween-engine/core/tweens.ts
function input(value, overextend) {
  if (Number.isNaN(value)) return 0;
  if (overextend) return value;
  return Math.min(1, Math.max(0, value));
}
function linear(value, overextend = false) {
  return input(value, overextend);
}
function quadratic(value, overextend = false) {
  return easeInQuad(value, overextend);
}
function cubic(value, overextend = false) {
  return easeInCubic(value, overextend);
}
function quartic(value, overextend = false) {
  return easeInQuart(value, overextend);
}
function quintic(value, overextend = false) {
  return easeInQuint(value, overextend);
}
function easeInSine(value, overextend = false) {
  const x = input(value, overextend);
  return 1 - Math.cos(x * Math.PI / 2);
}
function easeOutSine(value, overextend = false) {
  const x = input(value, overextend);
  return Math.sin(x * Math.PI / 2);
}
function easeInOutSine(value, overextend = false) {
  const x = input(value, overextend);
  return -(Math.cos(Math.PI * x) - 1) / 2;
}
function easeInQuad(value, overextend = false) {
  const x = input(value, overextend);
  return x * x;
}
function easeOutQuad(value, overextend = false) {
  const x = input(value, overextend);
  return 1 - (1 - x) * (1 - x);
}
function easeInOutQuad(value, overextend = false) {
  const x = input(value, overextend);
  return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
}
function easeInCubic(value, overextend = false) {
  const x = input(value, overextend);
  return x * x * x;
}
function easeOutCubic(value, overextend = false) {
  const x = input(value, overextend);
  return 1 - Math.pow(1 - x, 3);
}
function easeInOutCubic(value, overextend = false) {
  const x = input(value, overextend);
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}
function easeInQuart(value, overextend = false) {
  const x = input(value, overextend);
  return x * x * x * x;
}
function easeOutQuart(value, overextend = false) {
  const x = input(value, overextend);
  return 1 - Math.pow(1 - x, 4);
}
function easeInOutQuart(value, overextend = false) {
  const x = input(value, overextend);
  return x < 0.5 ? 8 * x * x * x * x : 1 - Math.pow(-2 * x + 2, 4) / 2;
}
function easeInQuint(value, overextend = false) {
  const x = input(value, overextend);
  return x * x * x * x * x;
}
function easeOutQuint(value, overextend = false) {
  const x = input(value, overextend);
  return 1 - Math.pow(1 - x, 5);
}
function easeInOutQuint(value, overextend = false) {
  const x = input(value, overextend);
  return x < 0.5 ? 16 * x * x * x * x * x : 1 - Math.pow(-2 * x + 2, 5) / 2;
}
function easeInExpo(value, overextend = false) {
  const x = input(value, overextend);
  return x === 0 ? 0 : Math.pow(2, 10 * x - 10);
}
function easeOutExpo(value, overextend = false) {
  const x = input(value, overextend);
  return x === 1 ? 1 : 1 - Math.pow(2, -10 * x);
}
function easeInOutExpo(value, overextend = false) {
  const x = input(value, overextend);
  return x === 0 ? 0 : x === 1 ? 1 : x < 0.5 ? Math.pow(2, 20 * x - 10) / 2 : (2 - Math.pow(2, -20 * x + 10)) / 2;
}
function easeInCirc(value, overextend = false) {
  const x = input(value, overextend);
  return 1 - Math.sqrt(1 - Math.pow(x, 2));
}
function easeOutCirc(value, overextend = false) {
  const x = input(value, overextend);
  return Math.sqrt(1 - Math.pow(x - 1, 2));
}
function easeInOutCirc(value, overextend = false) {
  const x = input(value, overextend);
  return x < 0.5 ? (1 - Math.sqrt(1 - Math.pow(2 * x, 2))) / 2 : (Math.sqrt(1 - Math.pow(-2 * x + 2, 2)) + 1) / 2;
}
function easeInBack(value, overextend = false) {
  const x = input(value, overextend);
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return c3 * x * x * x - c1 * x * x;
}
function easeOutBack(value, overextend = false) {
  const x = input(value, overextend);
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
}
function easeInOutBack(value, overextend = false) {
  const x = input(value, overextend);
  const c1 = 1.70158;
  const c2 = c1 * 1.525;
  return x < 0.5 ? Math.pow(2 * x, 2) * ((c2 + 1) * 2 * x - c2) / 2 : (Math.pow(2 * x - 2, 2) * ((c2 + 1) * (x * 2 - 2) + c2) + 2) / 2;
}
function easeInElastic(value, overextend = false) {
  const x = input(value, overextend);
  const c4 = 2 * Math.PI / 3;
  return x === 0 ? 0 : x === 1 ? 1 : -Math.pow(2, 10 * x - 10) * Math.sin((x * 10 - 10.75) * c4);
}
function easeOutElastic(value, overextend = false) {
  const x = input(value, overextend);
  const c4 = 2 * Math.PI / 3;
  return x === 0 ? 0 : x === 1 ? 1 : Math.pow(2, -10 * x) * Math.sin((x * 10 - 0.75) * c4) + 1;
}
function easeInOutElastic(value, overextend = false) {
  const x = input(value, overextend);
  const c5 = 2 * Math.PI / 4.5;
  return x === 0 ? 0 : x === 1 ? 1 : x < 0.5 ? -(Math.pow(2, 20 * x - 10) * Math.sin((20 * x - 11.125) * c5)) / 2 : Math.pow(2, -20 * x + 10) * Math.sin((20 * x - 11.125) * c5) / 2 + 1;
}
function easeInBounce(value, overextend = false) {
  const x = input(value, overextend);
  return 1 - easeOutBounce(1 - x, true);
}
function easeOutBounce(value, overextend = false) {
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
function easeInOutBounce(value, overextend = false) {
  const x = input(value, overextend);
  return x < 0.5 ? (1 - easeOutBounce(1 - 2 * x, true)) / 2 : (1 + easeOutBounce(2 * x - 1, true)) / 2;
}
var easeTypes = {
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
  easeInOutBounce
};
function ease(type, value, overextend = false) {
  return easeTypes[type](value, overextend);
}

// src/engines/little-tween-engine/little-tween-engine.ts
var LittleTweenEngine = class {
  constructor(options = {}) {
    this.type = options.type ?? "linear";
    this.overextend = options.overextend ?? false;
  }
  /** Map `value` through the selected ease type. */
  value(value, type = this.type, overextend = this.overextend) {
    return ease(type, value, overextend);
  }
};
