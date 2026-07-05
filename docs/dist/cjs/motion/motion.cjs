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

// src/motion/motion.ts
var motion_exports = {};
__export(motion_exports, {
  circleMotion: () => circleMotion,
  figureEightMotion: () => figureEightMotion,
  squareMotion: () => squareMotion,
  wanderMotion: () => wanderMotion
});
module.exports = __toCommonJS(motion_exports);

// src/motion/circle.ts
function circleMotion(options = {}) {
  const radius = options.radius ?? 1.3;
  const periodMs = options.periodMs ?? 3e3;
  const tilt = options.tilt ?? 0.5;
  const direction = options.direction ?? 1;
  const cosTilt = Math.cos(tilt);
  const sinTilt = Math.sin(tilt);
  return {
    positionAt(t) {
      const angle = direction * t / periodMs * Math.PI * 2;
      const x = radius * Math.cos(angle);
      const flatY = radius * Math.sin(angle);
      return { x, y: flatY * cosTilt, z: flatY * sinTilt };
    }
  };
}

// src/motion/square.ts
function squareMotion(options = {}) {
  const half = (options.size ?? 2.4) / 2;
  const periodMs = options.periodMs ?? 4e3;
  const tilt = options.tilt ?? 0.45;
  const direction = options.direction ?? 1;
  const cosTilt = Math.cos(tilt);
  const sinTilt = Math.sin(tilt);
  return {
    positionAt(t) {
      const lap = direction * t / periodMs;
      const s = (lap - Math.floor(lap)) * 4;
      const edge = Math.floor(s);
      const f = s - edge;
      let flatX;
      let flatY;
      if (edge === 0) {
        flatX = -half + 2 * half * f;
        flatY = -half;
      } else if (edge === 1) {
        flatX = half;
        flatY = -half + 2 * half * f;
      } else if (edge === 2) {
        flatX = half - 2 * half * f;
        flatY = half;
      } else {
        flatX = -half;
        flatY = half - 2 * half * f;
      }
      return { x: flatX, y: flatY * cosTilt, z: flatY * sinTilt };
    }
  };
}

// src/motion/figure-eight.ts
var LOOP_X = 1.5;
var LOOP_Y = 1;
var LOOP_Z = 1.05;
function figureEightMotion(options = {}) {
  const size = options.size ?? 1;
  const periodMs = options.periodMs ?? 3600;
  return {
    positionAt(t) {
      const a = t / periodMs * Math.PI * 2;
      return {
        x: size * LOOP_X * Math.sin(a),
        y: size * LOOP_Y * Math.sin(a) * Math.cos(a),
        z: size * LOOP_Z * Math.cos(a)
      };
    }
  };
}

// src/motion/wander.ts
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = a + 1831565813 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
function axisDrift(rnd, omega, bound) {
  const components = [0, 1, 2].map(() => ({
    freq: 0.5 + rnd() * 1.4,
    phase: rnd() * Math.PI * 2,
    weight: 0.5 + rnd()
  }));
  const total = components.reduce((sum, c) => sum + c.weight, 0);
  return (t) => {
    let value = 0;
    for (const c of components) value += c.weight * Math.sin(omega * c.freq * t + c.phase);
    return value / total * bound;
  };
}
function wanderMotion(options = {}) {
  const boundX = options.bounds?.x ?? 1.4;
  const boundY = options.bounds?.y ?? 1;
  const boundZ = options.bounds?.z ?? 0.6;
  const periodMs = options.periodMs ?? 9e3;
  const seed = options.seed ?? Math.random() * 1e9 | 0;
  const rnd = mulberry32(seed);
  const omega = 2 * Math.PI / periodMs;
  const driftX = axisDrift(rnd, omega, boundX);
  const driftY = axisDrift(rnd, omega, boundY);
  const driftZ = axisDrift(rnd, omega, boundZ);
  return {
    positionAt(t) {
      return { x: driftX(t), y: driftY(t), z: driftZ(t) };
    }
  };
}
