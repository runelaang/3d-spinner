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
function clamp01(value) {
  return Math.min(1, Math.max(0, value));
}
function channelToHex(value) {
  const channel = Number.parseFloat(value);
  if (!Number.isFinite(channel)) return void 0;
  return Math.round(clamp01(channel) * 255).toString(16).padStart(2, "0");
}
function parseRgb(parts) {
  const channels = parts.slice(1, 4).map(Number.parseFloat);
  if (channels.length !== 3 || !channels.every(Number.isFinite)) return void 0;
  return [clamp01(channels[0]), clamp01(channels[1]), clamp01(channels[2])];
}
function toMaterial(surface) {
  const material = {};
  if (surface.specular) material.specular = surface.specular;
  if (surface.shininess !== void 0) material.shininess = surface.shininess;
  if (surface.emissive) material.emissive = surface.emissive;
  return Object.keys(material).length > 0 ? material : void 0;
}
function parseMtl(text) {
  const materials = /* @__PURE__ */ new Map();
  const surfaces = /* @__PURE__ */ new Map();
  let name;
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (trimmed === "" || trimmed.startsWith("#")) continue;
    const parts = trimmed.split(/\s+/);
    const keyword = parts[0];
    if (keyword === "newmtl") {
      name = parts.slice(1).join(" ");
      if (name && !materials.has(name)) {
        materials.set(name, {});
        surfaces.set(name, {});
      }
      continue;
    }
    if (!name) continue;
    const entry = materials.get(name);
    const surface = surfaces.get(name);
    if (keyword === "Kd") {
      const channels = parts.slice(1, 4).map(channelToHex);
      if (channels.length === 3 && channels.every((channel) => channel !== void 0)) {
        entry.color = `#${channels.join("")}`;
      }
    } else if (keyword === "Ks") {
      surface.specular = parseRgb(parts);
    } else if (keyword === "Ns") {
      const ns = Number.parseFloat(parts[1]);
      if (Number.isFinite(ns)) surface.shininess = Math.max(0, ns);
    } else if (keyword === "Ke") {
      surface.emissive = parseRgb(parts);
    }
  }
  for (const [key, surface] of surfaces) {
    materials.get(key).material = toMaterial(surface);
  }
  return materials;
}
function resolveIndex(token, vertexCount) {
  const n = parseInt(token, 10);
  return n < 0 ? vertexCount + n : n - 1;
}
function parseObj(text, options = {}) {
  const colors = options.colors ?? DEFAULT_COLORS;
  const materials = options.useMtlColors && options.mtl ? parseMtl(options.mtl) : void 0;
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
        const entry = material ? materials?.get(material) : void 0;
        const color = entry?.color ?? (materials ? colors[0] ?? "#888888" : colors[faces.length % colors.length]);
        const face = { indices, color };
        if (entry?.material) face.material = entry.material;
        faces.push(face);
      }
    }
  }
  return { vertices, faces };
}
