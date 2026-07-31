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

// src/index.ts
var index_exports = {};
__export(index_exports, {
  createSpinner: () => createSpinner
});
module.exports = __toCommonJS(index_exports);
function clamp01(value) {
  if (Number.isNaN(value)) return 0;
  return Math.min(1, Math.max(0, value));
}
function lerp(from, to, t) {
  return from + (to - from) * t;
}
function createSpinner(target, options) {
  if (!(target instanceof HTMLElement)) {
    throw new Error("3d-spinner: createSpinner requires a target HTMLElement.");
  }
  const { animation } = options;
  const indeterminate = options.type === "indeterminate";
  if (indeterminate && options.periodMs !== void 0 && (!Number.isFinite(options.periodMs) || options.periodMs <= 0)) {
    throw new RangeError("3d-spinner: periodMs must be a finite number greater than zero.");
  }
  animation.mount(target);
  const start = performance.now();
  let rafId = 0;
  let stopped = false;
  let destroyed = false;
  let entered = false;
  let exiting = false;
  let current = 0;
  let targetProgress = 0;
  let deadline = Infinity;
  if (!indeterminate) {
    const opts = options;
    if (typeof opts.progress === "number") {
      current = clamp01(opts.progress);
      targetProgress = current;
    }
    if (typeof opts.timeout === "number") deadline = Math.min(deadline, start + opts.timeout);
    if (opts.until instanceof Date) deadline = Math.min(deadline, opts.until.getTime());
  }
  function computeProgress(now) {
    if (!indeterminate) {
      if (now >= deadline) targetProgress = 1;
      current = lerp(current, targetProgress, 0.12);
      if (Math.abs(targetProgress - current) < 5e-4) current = targetProgress;
      return current;
    }
    const opts = options;
    const period = opts.periodMs ?? 2e3;
    const t = (now - start) / period;
    if ((opts.loop ?? "bounce") === "restart") return t - Math.floor(t);
    const phase = t - 2 * Math.floor(t / 2);
    return phase <= 1 ? phase : 2 - phase;
  }
  function frame(now) {
    if (stopped) return;
    const progress = computeProgress(now);
    if (!entered && (indeterminate || progress > 0)) {
      animation.enter(now);
      entered = true;
    }
    if (!exiting && entered && !indeterminate && progress >= 1 && targetProgress >= 1) {
      animation.exit(now);
      exiting = true;
    }
    const target2 = indeterminate ? progress : targetProgress;
    animation.render(now, { progress, targetProgress: target2, indeterminate });
    if (exiting && animation.isFinished()) {
      halt();
      return;
    }
    rafId = requestAnimationFrame(frame);
  }
  function halt() {
    if (stopped) return;
    stopped = true;
    if (rafId) cancelAnimationFrame(rafId);
    rafId = 0;
  }
  function setProgress(value) {
    if (!indeterminate) targetProgress = clamp01(value);
  }
  function stop() {
    if (stopped || exiting) return;
    if (!entered) {
      halt();
      return;
    }
    animation.exit(performance.now());
    exiting = true;
  }
  function destroy() {
    if (destroyed) return;
    destroyed = true;
    halt();
    animation.destroy();
  }
  rafId = requestAnimationFrame(frame);
  return { setProgress, stop, destroy };
}
