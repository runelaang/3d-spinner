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

// src/engines/little-3d-engine/loaders/obj.ts
var obj_exports = {};
__export(obj_exports, {
  parseObj: () => parseObj
});
module.exports = __toCommonJS(obj_exports);
var DEFAULT_COLORS = ["#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#ef4444"];
function channelToHex(value) {
  const channel = Number.parseFloat(value);
  if (!Number.isFinite(channel)) return void 0;
  return Math.round(Math.min(1, Math.max(0, channel)) * 255).toString(16).padStart(2, "0");
}
function parseMtlColors(text) {
  const colors = /* @__PURE__ */ new Map();
  let material;
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (trimmed === "" || trimmed.startsWith("#")) continue;
    const parts = trimmed.split(/\s+/);
    if (parts[0] === "newmtl") {
      material = parts.slice(1).join(" ");
    } else if (parts[0] === "Kd" && material) {
      const channels = parts.slice(1, 4).map(channelToHex);
      if (channels.length === 3 && channels.every((channel) => channel !== void 0)) {
        colors.set(material, `#${channels.join("")}`);
      }
    }
  }
  return colors;
}
function resolveIndex(token, vertexCount) {
  const n = parseInt(token, 10);
  return n < 0 ? vertexCount + n : n - 1;
}
function parseObj(text, options = {}) {
  const colors = options.colors ?? DEFAULT_COLORS;
  const materialColors = options.useMtlColors && options.mtl ? parseMtlColors(options.mtl) : void 0;
  const vertices = [];
  const faces = [];
  let material;
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (trimmed === "" || trimmed.startsWith("#")) continue;
    const parts = trimmed.split(/\s+/);
    const keyword = parts[0];
    if (keyword === "v") {
      vertices.push({
        x: parseFloat(parts[1]),
        y: parseFloat(parts[2]),
        z: parseFloat(parts[3])
      });
    } else if (keyword === "usemtl") {
      material = parts.slice(1).join(" ");
    } else if (keyword === "f") {
      const indices = [];
      for (let i = 1; i < parts.length; i++) {
        const vertexToken = parts[i].split("/")[0];
        indices.push(resolveIndex(vertexToken, vertices.length));
      }
      if (indices.length >= 3) {
        const mtlColor = material ? materialColors?.get(material) : void 0;
        const color = mtlColor ?? (materialColors ? colors[0] ?? "#888888" : colors[faces.length % colors.length]);
        faces.push({ indices, color });
      }
    }
  }
  return { vertices, faces };
}
