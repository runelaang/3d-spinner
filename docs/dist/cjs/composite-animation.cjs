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
var CompositeAnimation = class {
  constructor(layers) {
    this.elements = [];
    this.layers = layers.map((layer) => "animation" in layer ? layer : { animation: layer });
  }
  mount(target) {
    target.style.position = "relative";
    for (const [index, layer] of this.layers.entries()) {
      const element = document.createElement("div");
      element.style.cssText = `position:absolute;inset:0;z-index:${layer.zIndex ?? index}`;
      target.appendChild(element);
      this.elements.push(element);
      layer.animation.mount(element);
    }
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
  destroy() {
    for (const layer of this.layers) layer.animation.destroy();
    for (const element of this.elements) element.remove();
    this.elements.length = 0;
  }
};
