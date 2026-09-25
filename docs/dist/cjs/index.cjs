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
  createSpinner: () => createSpinner,
  prefersReducedMotion: () => prefersReducedMotion
});
module.exports = __toCommonJS(index_exports);

// src/engines/little-tween-engine/core/damp.ts
function damp(perFrame, deltaMs) {
  return 1 - Math.pow(1 - perFrame, Math.max(0, deltaMs) / (1e3 / 60));
}

// src/mount-host.ts
async function mountAnimation(animation, target) {
  await animation.mount(target);
}

// src/index.ts
function clamp01(value) {
  if (Number.isNaN(value)) return 0;
  return Math.min(1, Math.max(0, value));
}
function lerp(from, to, t) {
  return from + (to - from) * t;
}
var usedAnimations = /* @__PURE__ */ new WeakSet();
var PROGRESSBAR_STYLE = "position:absolute;width:1px;height:1px;margin:-1px;padding:0;border:0;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap";
function prefersReducedMotion() {
  return typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
}
function mountProgressbar(target, label, indeterminate) {
  const element = document.createElement("div");
  element.style.cssText = PROGRESSBAR_STYLE;
  element.setAttribute("role", "progressbar");
  element.setAttribute("aria-label", label);
  if (!indeterminate) {
    element.setAttribute("aria-valuemin", "0");
    element.setAttribute("aria-valuemax", "100");
  }
  target.appendChild(element);
  let shown = -1;
  return {
    element,
    update(progress) {
      if (indeterminate) return;
      const percent = Math.round(progress * 100);
      if (percent === shown) return;
      shown = percent;
      element.setAttribute("aria-valuenow", String(percent));
    }
  };
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
  if (!indeterminate && options.until instanceof Date && Number.isNaN(options.until.getTime())) {
    throw new RangeError("3d-spinner: until must be a valid Date.");
  }
  const timeoutMs = indeterminate ? void 0 : options.timeoutMs ?? options.timeout;
  if (Number.isNaN(timeoutMs)) {
    throw new RangeError("3d-spinner: timeoutMs must be a number of milliseconds, not NaN.");
  }
  if (usedAnimations.has(animation)) {
    throw new Error(
      "3d-spinner: this animation instance is already in use. Animations are single-use; create a new one for each spinner."
    );
  }
  usedAnimations.add(animation);
  const mounting = mountAnimation(animation, target);
  const progressbar = mountProgressbar(target, options.ariaLabel ?? "Loading", indeterminate);
  const ready = Promise.resolve(mounting).catch((error) => {
    halt();
    throw error;
  });
  const start = performance.now();
  let rafId = 0;
  let stopped = false;
  let destroyed = false;
  let entered = false;
  let exiting = false;
  let current = 0;
  let targetProgress = 0;
  let deadline = Infinity;
  let lastFrame = start;
  if (!indeterminate) {
    if (typeof options.progress === "number") {
      current = clamp01(options.progress);
      targetProgress = current;
    }
    if (typeof timeoutMs === "number") deadline = Math.min(deadline, start + timeoutMs);
    if (options.until instanceof Date) {
      deadline = Math.min(deadline, start + (options.until.getTime() - Date.now()));
    }
  }
  function computeProgress(now) {
    if (!indeterminate) {
      if (now >= deadline) targetProgress = 1;
      const deltaMs = now - lastFrame;
      lastFrame = now;
      current = lerp(current, targetProgress, damp(0.12, deltaMs));
      if (Math.abs(targetProgress - current) < 5e-4) current = targetProgress;
      return current;
    }
    const period = options.periodMs ?? 2e3;
    const t = (now - start) / period;
    if ((options.loop ?? "bounce") === "restart") return t - Math.floor(t);
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
    progressbar.update(progress);
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
    try {
      animation.destroy();
    } finally {
      progressbar.element.remove();
    }
  }
  rafId = requestAnimationFrame(frame);
  return { ready, setProgress, stop, destroy };
}
