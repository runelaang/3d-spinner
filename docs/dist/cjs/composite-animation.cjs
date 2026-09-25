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

// src/composite-animation.ts
var composite_animation_exports = {};
__export(composite_animation_exports, {
  CompositeAnimation: () => CompositeAnimation
});
module.exports = __toCommonJS(composite_animation_exports);

// src/mount-host.ts
function prepareHost(target) {
  const position = getComputedStyle(target).position;
  if (position === "static" || position === "") target.style.position = "relative";
}
async function mountAnimation(animation, target) {
  await animation.mount(target);
}

// src/composite-animation.ts
var CompositeAnimation = class {
  constructor(layers) {
    this.elements = [];
    this.layers = layers.map((layer) => "animation" in layer ? layer : { animation: layer });
  }
  /** Mount every layer in its own stacked element; resolves once all layers can draw. */
  mount(target) {
    prepareHost(target);
    const mounting = [];
    for (const [index, layer] of this.layers.entries()) {
      const element = document.createElement("div");
      element.style.cssText = `position:absolute;inset:0;z-index:${layer.zIndex ?? index}`;
      target.appendChild(element);
      this.elements.push(element);
      mounting.push(mountAnimation(layer.animation, element));
    }
    return Promise.all(mounting).then(() => void 0);
  }
  enter(now) {
    for (const layer of this.layers) layer.animation.enter(now);
  }
  exit(now) {
    for (const layer of this.layers) layer.animation.exit(now);
  }
  render(now, frame) {
    for (const layer of this.layers) layer.animation.render(now, frame);
  }
  isFinished() {
    return this.layers.every((layer) => layer.animation.isFinished());
  }
  /** Destroy every layer even if one throws, then rethrow the first error. */
  destroy() {
    let failed = false;
    let firstError;
    for (const layer of this.layers) {
      try {
        layer.animation.destroy();
      } catch (error) {
        if (!failed) firstError = error;
        failed = true;
      }
    }
    for (const element of this.elements) element.remove();
    this.elements.length = 0;
    if (failed) throw firstError;
  }
};
