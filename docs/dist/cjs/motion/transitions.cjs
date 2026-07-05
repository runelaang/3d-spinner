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

// src/motion/transitions.ts
var transitions_exports = {};
__export(transitions_exports, {
  enterFromObjectDirection: () => enterFromObjectDirection,
  grow: () => grow,
  leaveInObjectDirection: () => leaveInObjectDirection,
  shrink: () => shrink
});
module.exports = __toCommonJS(transitions_exports);
var DEFAULT_DISTANCE = 3.5;
function add(a, b) {
  return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z };
}
function scaleVector(v, factor) {
  return { x: v.x * factor, y: v.y * factor, z: v.z * factor };
}
function vectorLength(v) {
  return Math.hypot(v.x, v.y, v.z);
}
function normalizeVector(v) {
  const length = vectorLength(v);
  if (length < 1e-6) return { x: 1, y: 0, z: 0 };
  return scaleVector(v, 1 / length);
}
function resolveDirection(input, fallback) {
  return normalizeVector(fallback ?? input.direction ?? input.velocity ?? { x: 1, y: 0, z: 0 });
}
function easeOutBack(delta) {
  const c = 1.70158;
  const u = delta - 1;
  return 1 + (c + 1) * u * u * u + c * u * u;
}
function joinVelocity(input, options, durationMs) {
  const inputSpeed = input.velocity ? vectorLength(input.velocity) : 0;
  if (input.velocity && inputSpeed > 1e-6 && !options.direction) {
    return input.velocity;
  }
  const distance = options.distance ?? DEFAULT_DISTANCE;
  return scaleVector(resolveDirection(input, options.direction), distance / durationMs);
}
function enterFromObjectDirection(options = {}) {
  return (input) => {
    const durationMs = Math.max(1, input.durationMs);
    const velocity = joinVelocity(input, options, durationMs);
    const remaining = durationMs - input.elapsedMs;
    return { position: add(input.position, scaleVector(velocity, -remaining)) };
  };
}
function leaveInObjectDirection(options = {}) {
  return (input) => {
    const durationMs = Math.max(1, input.durationMs);
    const velocity = joinVelocity(input, options, durationMs);
    return { position: add(input.position, scaleVector(velocity, input.elapsedMs)) };
  };
}
function grow() {
  return (input) => ({ size: (input.size ?? 1) * easeOutBack(input.delta) });
}
function shrink() {
  return (input) => ({ size: (input.size ?? 1) * (1 - input.delta * input.delta) });
}
