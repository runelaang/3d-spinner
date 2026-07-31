"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = (fn, res, err) => function __init() {
  if (err) throw err[0];
  try {
    return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
  } catch (e) {
    throw err = [e], e;
  }
};
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

// src/engines/little-3d-engine/core/math.ts
function subtract(a, b) {
  return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
}
function cross(a, b) {
  return {
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x
  };
}
function normalize(v) {
  const length = Math.hypot(v.x, v.y, v.z);
  if (length === 0) return { x: 0, y: 0, z: 0 };
  return { x: v.x / length, y: v.y / length, z: v.z / length };
}
function multiply(a, b) {
  const out = new Array(16);
  for (let col = 0; col < 4; col++) {
    for (let row = 0; row < 4; row++) {
      let sum = 0;
      for (let k = 0; k < 4; k++) {
        sum += a[k * 4 + row] * b[col * 4 + k];
      }
      out[col * 4 + row] = sum;
    }
  }
  return out;
}
var init_math = __esm({
  "src/engines/little-3d-engine/core/math.ts"() {
    "use strict";
  }
});

// src/engines/little-3d-engine/core/geometry.ts
function parseColor(color) {
  const hex = color.trim().replace("#", "");
  const full = hex.length === 3 ? hex.split("").map((c) => c + c).join("") : hex;
  const n = parseInt(full, 16);
  return [n >> 16 & 255, n >> 8 & 255, n & 255];
}
function expandToTriangles(mesh) {
  let triangles = 0;
  for (const face of mesh.faces) triangles += Math.max(0, face.indices.length - 2);
  const positions = new Float32Array(triangles * 9);
  const normals = new Float32Array(triangles * 9);
  const colors = new Float32Array(triangles * 9);
  const emissives = new Float32Array(triangles * 9);
  const speculars = new Float32Array(triangles * 12);
  let o = 0;
  let so = 0;
  for (const face of mesh.faces) {
    const v0 = mesh.vertices[face.indices[0]];
    const v1 = mesh.vertices[face.indices[1]];
    const v2 = mesh.vertices[face.indices[2]];
    const normal = normalize(cross(subtract(v1, v0), subtract(v2, v0)));
    const [r, g, b] = parseColor(face.color);
    const cr = r / 255;
    const cg = g / 255;
    const cb = b / 255;
    const emissive = face.material?.emissive;
    const er = emissive ? emissive[0] : 0;
    const eg = emissive ? emissive[1] : 0;
    const eb = emissive ? emissive[2] : 0;
    const specular = face.material?.specular;
    const sr = specular ? specular[0] : 0;
    const sg = specular ? specular[1] : 0;
    const sb = specular ? specular[2] : 0;
    const sn = specular ? face.material?.shininess ?? 32 : 1;
    for (let k = 1; k < face.indices.length - 1; k++) {
      const tri = [face.indices[0], face.indices[k], face.indices[k + 1]];
      for (const index of tri) {
        const v = mesh.vertices[index];
        positions[o] = v.x;
        positions[o + 1] = v.y;
        positions[o + 2] = v.z;
        normals[o] = normal.x;
        normals[o + 1] = normal.y;
        normals[o + 2] = normal.z;
        colors[o] = cr;
        colors[o + 1] = cg;
        colors[o + 2] = cb;
        emissives[o] = er;
        emissives[o + 1] = eg;
        emissives[o + 2] = eb;
        speculars[so] = sr;
        speculars[so + 1] = sg;
        speculars[so + 2] = sb;
        speculars[so + 3] = sn;
        o += 3;
        so += 4;
      }
    }
  }
  return { positions, normals, colors, emissives, speculars, count: positions.length / 3 };
}
var init_geometry = __esm({
  "src/engines/little-3d-engine/core/geometry.ts"() {
    "use strict";
    init_math();
  }
});

// src/engines/little-3d-engine/renderer.ts
function opacity(value, fallback) {
  return Math.max(0, Math.min(1, value ?? fallback));
}
function resolveTwoSidedOpacity(transparency) {
  const front = opacity(
    transparency.frontOpacity ?? transparency.opacity,
    DEFAULT_FRONT_OPACITY
  );
  const backFallback = transparency.opacity === void 0 ? DEFAULT_BACK_OPACITY : front * (2 / 3);
  return {
    front,
    back: opacity(transparency.backOpacity, backFallback)
  };
}
var DEFAULT_ONE_SIDED_OPACITY, DEFAULT_BACK_OPACITY, DEFAULT_FRONT_OPACITY;
var init_renderer = __esm({
  "src/engines/little-3d-engine/renderer.ts"() {
    "use strict";
    DEFAULT_ONE_SIDED_OPACITY = 0.35;
    DEFAULT_BACK_OPACITY = 0.84;
    DEFAULT_FRONT_OPACITY = 0.56;
  }
});

// src/engines/little-3d-engine/renderers/webgpu.ts
var WGSL, CLIP_Z_FIX, UNIFORM_STRIDE, WebGPURenderer;
var init_webgpu = __esm({
  "src/engines/little-3d-engine/renderers/webgpu.ts"() {
    "use strict";
    init_geometry();
    init_math();
    init_renderer();
    WGSL = `
struct Uniforms {
  viewProj: mat4x4<f32>,
  model: mat4x4<f32>,
  toLight: vec4<f32>,
  params: vec4<f32>,
  eye: vec4<f32>,
};
@group(0) @binding(0) var<uniform> u: Uniforms;

struct VSOut {
  @builtin(position) position: vec4<f32>,
  @location(0) normal: vec3<f32>,
  @location(1) color: vec3<f32>,
  @location(2) emissive: vec3<f32>,
  @location(3) specular: vec4<f32>,
  @location(4) worldPos: vec3<f32>,
};

@vertex
fn vs(@location(0) pos: vec3<f32>, @location(1) normal: vec3<f32>, @location(2) color: vec3<f32>, @location(3) emissive: vec3<f32>, @location(4) specular: vec4<f32>) -> VSOut {
  var out: VSOut;
  let m = mat3x3<f32>(u.model[0].xyz, u.model[1].xyz, u.model[2].xyz);
  out.normal = m * normal;
  out.color = color;
  out.emissive = emissive;
  out.specular = specular;
  let world = u.model * vec4<f32>(pos, 1.0);
  out.worldPos = world.xyz;
  out.position = u.viewProj * world;
  return out;
}

@fragment
fn fs(in: VSOut) -> @location(0) vec4<f32> {
  let normal = normalize(in.normal);
  let toLight = normalize(u.toLight.xyz);
  let lambert = max(dot(normal, toLight), 0.0);
  let brightness = clamp(u.params.y + u.params.x * lambert, 0.0, 1.0);
  var lit = in.color * brightness;
  if (lambert > 0.0) {
    let viewDir = normalize(u.eye.xyz - in.worldPos);
    let halfVec = normalize(toLight + viewDir);
    let highlight = pow(max(dot(normal, halfVec), 0.0), in.specular.w) * u.params.x;
    lit = lit + highlight * in.specular.xyz;
  }
  lit = lit + in.emissive;
  return vec4<f32>(lit, u.params.z);
}
`;
    CLIP_Z_FIX = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0.5, 0, 0, 0, 0.5, 1];
    UNIFORM_STRIDE = 256;
    WebGPURenderer = class {
      constructor(options = {}) {
        this.uniformCapacity = 0;
        this.depthSize = "";
        this.destroyed = false;
        this.cache = /* @__PURE__ */ new Map();
        if (options.background) {
          const [r, g, b] = parseColor(options.background);
          this.clearValue = { r: r / 255, g: g / 255, b: b / 255, a: 1 };
          this.alphaMode = "opaque";
        } else {
          this.clearValue = { r: 0, g: 0, b: 0, a: 0 };
          this.alphaMode = "premultiplied";
        }
      }
      async init(canvas) {
        const gpu = navigator.gpu;
        if (!gpu) throw new Error("3d-spinner: WebGPU is not supported in this browser.");
        const adapter = await gpu.requestAdapter();
        if (!adapter) throw new Error("3d-spinner: no WebGPU adapter is available.");
        const device = await adapter.requestDevice();
        if (this.destroyed) {
          device.destroy?.();
          return;
        }
        const context = canvas.getContext("webgpu");
        if (!context) throw new Error("3d-spinner: could not get a WebGPU canvas context.");
        const format = gpu.getPreferredCanvasFormat();
        context.configure({ device, format, alphaMode: this.alphaMode });
        const module2 = device.createShaderModule({ code: WGSL });
        const stage = globalThis.GPUShaderStage;
        const layout = device.createBindGroupLayout({
          entries: [
            {
              binding: 0,
              visibility: stage.VERTEX | stage.FRAGMENT,
              buffer: { type: "uniform", hasDynamicOffset: true, minBindingSize: 176 }
            }
          ]
        });
        const vertexBuffer = (location, components = 3) => ({
          arrayStride: components * 4,
          attributes: [
            { shaderLocation: location, offset: 0, format: `float32x${components}` }
          ]
        });
        const pipelineLayout = device.createPipelineLayout({ bindGroupLayouts: [layout] });
        const blend = {
          color: {
            srcFactor: "src-alpha",
            dstFactor: "one-minus-src-alpha",
            operation: "add"
          },
          alpha: { srcFactor: "one", dstFactor: "one-minus-src-alpha", operation: "add" }
        };
        const pipeline = (cullMode, transparent) => device.createRenderPipeline({
          layout: pipelineLayout,
          vertex: {
            module: module2,
            entryPoint: "vs",
            buffers: [
              vertexBuffer(0),
              vertexBuffer(1),
              vertexBuffer(2),
              vertexBuffer(3),
              vertexBuffer(4, 4)
            ]
          },
          fragment: {
            module: module2,
            entryPoint: "fs",
            targets: [{ format, ...transparent ? { blend } : {} }]
          },
          primitive: { topology: "triangle-list", cullMode, frontFace: "ccw" },
          depthStencil: {
            format: "depth24plus",
            depthWriteEnabled: !transparent,
            depthCompare: "less"
          }
        });
        this.pipeline = pipeline("back", false);
        this.transparentBackPipeline = pipeline("front", true);
        this.transparentFrontPipeline = pipeline("back", true);
        this.canvas = canvas;
        this.device = device;
        this.context = context;
      }
      resize() {
        this.ensureDepth();
      }
      ensureDepth() {
        const canvas = this.canvas;
        if (!this.device || !canvas) return;
        const width = Math.max(1, canvas.width);
        const height = Math.max(1, canvas.height);
        const key = `${width}x${height}`;
        if (key === this.depthSize && this.depthTexture) return;
        this.depthTexture?.destroy?.();
        this.depthTexture = this.device.createTexture({
          size: { width, height },
          format: "depth24plus",
          usage: globalThis.GPUTextureUsage.RENDER_ATTACHMENT
        });
        this.depthSize = key;
      }
      buffers(mesh) {
        const cached = this.cache.get(mesh);
        if (cached) return cached;
        const data = expandToTriangles(mesh);
        const usage = globalThis.GPUBufferUsage.VERTEX | globalThis.GPUBufferUsage.COPY_DST;
        const upload = (array) => {
          const buffer = this.device.createBuffer({ size: array.byteLength, usage });
          this.device.queue.writeBuffer(buffer, 0, array);
          return buffer;
        };
        const result = {
          position: upload(data.positions),
          normal: upload(data.normals),
          color: upload(data.colors),
          emissive: upload(data.emissives),
          specular: upload(data.speculars),
          count: data.count
        };
        this.cache.set(mesh, result);
        return result;
      }
      ensureUniformCapacity(draws) {
        if (draws <= this.uniformCapacity && this.uniformBuffer) return;
        this.uniformBuffer?.destroy?.();
        this.uniformBuffer = this.device.createBuffer({
          size: Math.max(1, draws) * UNIFORM_STRIDE,
          usage: globalThis.GPUBufferUsage.UNIFORM | globalThis.GPUBufferUsage.COPY_DST
        });
        this.uniformCapacity = draws;
      }
      render(frame) {
        if (this.destroyed || !this.device || !this.context || !this.pipeline) return;
        if (frame.width === 0 || frame.height === 0 || frame.items.length === 0) return;
        this.ensureDepth();
        const draws = [];
        for (const item of frame.items) {
          if (!item.transparency) draws.push({ item, opacity: 1, pipeline: this.pipeline });
        }
        for (const item of frame.items) {
          const transparency = item.transparency;
          if (!transparency) continue;
          if (transparency.mode === "two-sided") {
            const resolved = resolveTwoSidedOpacity(transparency);
            draws.push({
              item,
              opacity: resolved.back,
              pipeline: this.transparentBackPipeline
            });
            draws.push({
              item,
              opacity: resolved.front,
              pipeline: this.transparentFrontPipeline
            });
          } else {
            draws.push({
              item,
              opacity: opacity(transparency.opacity, DEFAULT_ONE_SIDED_OPACITY),
              pipeline: this.transparentFrontPipeline
            });
          }
        }
        this.ensureUniformCapacity(draws.length);
        const viewProj = multiply(CLIP_Z_FIX, frame.viewProjection);
        const layout = this.pipeline.getBindGroupLayout(0);
        const bindGroup = this.device.createBindGroup({
          layout,
          entries: [
            { binding: 0, resource: { buffer: this.uniformBuffer, offset: 0, size: 176 } }
          ]
        });
        draws.forEach((draw, i) => {
          const data = new Float32Array(UNIFORM_STRIDE / 4);
          data.set(viewProj, 0);
          data.set(draw.item.model, 16);
          data.set([frame.light.toLight.x, frame.light.toLight.y, frame.light.toLight.z, 0], 32);
          data.set([frame.light.intensity, frame.light.ambient, draw.opacity, 0], 36);
          data.set([frame.eye.x, frame.eye.y, frame.eye.z, 0], 40);
          this.device.queue.writeBuffer(this.uniformBuffer, i * UNIFORM_STRIDE, data);
        });
        const encoder = this.device.createCommandEncoder();
        const pass = encoder.beginRenderPass({
          colorAttachments: [
            {
              view: this.context.getCurrentTexture().createView(),
              clearValue: this.clearValue,
              loadOp: "clear",
              storeOp: "store"
            }
          ],
          depthStencilAttachment: {
            view: this.depthTexture.createView(),
            depthClearValue: 1,
            depthLoadOp: "clear",
            depthStoreOp: "store"
          }
        });
        draws.forEach((draw, i) => {
          const mesh = this.buffers(draw.item.mesh);
          pass.setPipeline(draw.pipeline);
          pass.setBindGroup(0, bindGroup, [i * UNIFORM_STRIDE]);
          pass.setVertexBuffer(0, mesh.position);
          pass.setVertexBuffer(1, mesh.normal);
          pass.setVertexBuffer(2, mesh.color);
          pass.setVertexBuffer(3, mesh.emissive);
          pass.setVertexBuffer(4, mesh.specular);
          pass.draw(mesh.count);
        });
        pass.end();
        this.device.queue.submit([encoder.finish()]);
      }
      destroy() {
        this.destroyed = true;
        for (const mesh of this.cache.values()) {
          mesh.position.destroy?.();
          mesh.normal.destroy?.();
          mesh.color.destroy?.();
          mesh.emissive.destroy?.();
          mesh.specular.destroy?.();
        }
        this.cache.clear();
        this.uniformBuffer?.destroy?.();
        this.depthTexture?.destroy?.();
        this.device?.destroy?.();
        this.device = void 0;
        this.context = void 0;
        this.pipeline = void 0;
        this.transparentBackPipeline = void 0;
        this.transparentFrontPipeline = void 0;
        this.uniformBuffer = void 0;
        this.depthTexture = void 0;
        this.canvas = void 0;
      }
    };
  }
});

// src/engines/little-3d-engine/renderers/webgpu-textured.ts
var webgpu_textured_exports = {};
__export(webgpu_textured_exports, {
  WebGPUTexturedRenderer: () => WebGPUTexturedRenderer
});
module.exports = __toCommonJS(webgpu_textured_exports);
init_geometry();
init_math();
init_renderer();

// src/engines/little-3d-engine/renderers/textured-helpers.ts
function planarUVs(mesh) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const v of mesh.vertices) {
    minX = Math.min(minX, v.x);
    minY = Math.min(minY, v.y);
    maxX = Math.max(maxX, v.x);
    maxY = Math.max(maxY, v.y);
  }
  const width = maxX - minX || 1;
  const height = maxY - minY || 1;
  let triangles = 0;
  for (const face of mesh.faces) triangles += Math.max(0, face.indices.length - 2);
  const uvs = new Float32Array(triangles * 6);
  let o = 0;
  for (const face of mesh.faces) {
    for (let k = 1; k < face.indices.length - 1; k++) {
      for (const index of [face.indices[0], face.indices[k], face.indices[k + 1]]) {
        const v = mesh.vertices[index];
        uvs[o] = (v.x - minX) / width;
        uvs[o + 1] = 1 - (v.y - minY) / height;
        o += 2;
      }
    }
  }
  return uvs;
}

// src/engines/little-3d-engine/renderers/webgpu-textured.ts
init_webgpu();
var WGSL2 = `
struct Uniforms {
  viewProj: mat4x4<f32>,
  model: mat4x4<f32>,
  params: vec4<f32>,
};
@group(0) @binding(0) var<uniform> u: Uniforms;
@group(0) @binding(1) var tex: texture_2d<f32>;
@group(0) @binding(2) var samp: sampler;

struct VSOut {
  @builtin(position) position: vec4<f32>,
  @location(0) uv: vec2<f32>,
  @location(1) color: vec3<f32>,
};

@vertex
fn vs(@location(0) pos: vec3<f32>, @location(1) uv: vec2<f32>, @location(2) color: vec3<f32>) -> VSOut {
  var out: VSOut;
  out.uv = uv;
  out.color = color;
  out.position = u.viewProj * u.model * vec4<f32>(pos, 1.0);
  return out;
}

@fragment
fn fs(in: VSOut) -> @location(0) vec4<f32> {
  let t = textureSample(tex, samp, in.uv);
  return vec4<f32>(t.rgb * in.color, t.a * u.params.x);
}
`;
var CLIP_Z_FIX2 = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0.5, 0, 0, 0, 0.5, 1];
var UNIFORM_STRIDE2 = 256;
function itemOpacity(transparency) {
  if (!transparency) return 1;
  if (transparency.mode === "two-sided") return resolveTwoSidedOpacity(transparency).front;
  return opacity(transparency.opacity, DEFAULT_ONE_SIDED_OPACITY);
}
var WebGPUTexturedRenderer = class extends WebGPURenderer {
  constructor() {
    super(...arguments);
    this.texturedCapacity = 0;
    this.sources = /* @__PURE__ */ new Map();
    this.textures = /* @__PURE__ */ new Map();
    this.retired = [];
    this.texturedBuffers = /* @__PURE__ */ new Map();
    this.bindGroups = /* @__PURE__ */ new Map();
  }
  /** Texture every instance of `mesh` with `source`. Call any time, also before init. */
  setTexture(mesh, source) {
    this.sources.set(mesh, source);
  }
  async init(canvas) {
    await super.init(canvas);
    const device = this.device;
    if (!device) return;
    const format = navigator.gpu.getPreferredCanvasFormat();
    const module2 = device.createShaderModule({ code: WGSL2 });
    const stage = globalThis.GPUShaderStage;
    const layout = device.createBindGroupLayout({
      entries: [
        {
          binding: 0,
          visibility: stage.VERTEX | stage.FRAGMENT,
          buffer: { type: "uniform", hasDynamicOffset: true, minBindingSize: 144 }
        },
        { binding: 1, visibility: stage.FRAGMENT, texture: {} },
        { binding: 2, visibility: stage.FRAGMENT, sampler: {} }
      ]
    });
    const vertexBuffer = (location, components) => ({
      arrayStride: components * 4,
      attributes: [{ shaderLocation: location, offset: 0, format: `float32x${components}` }]
    });
    this.texturedPipeline = device.createRenderPipeline({
      layout: device.createPipelineLayout({ bindGroupLayouts: [layout] }),
      vertex: {
        module: module2,
        entryPoint: "vs",
        buffers: [vertexBuffer(0, 3), vertexBuffer(1, 2), vertexBuffer(2, 3)]
      },
      fragment: {
        module: module2,
        entryPoint: "fs",
        targets: [
          {
            format,
            blend: {
              color: {
                srcFactor: "src-alpha",
                dstFactor: "one-minus-src-alpha",
                operation: "add"
              },
              alpha: { srcFactor: "one", dstFactor: "one-minus-src-alpha", operation: "add" }
            }
          }
        ]
      },
      primitive: { topology: "triangle-list", cullMode: "back", frontFace: "ccw" },
      depthStencil: {
        format: "depth24plus",
        depthWriteEnabled: false,
        depthCompare: "less"
      }
    });
    this.sampler = device.createSampler({ magFilter: "linear", minFilter: "linear" });
  }
  textureFor(mesh) {
    const cached = this.textures.get(mesh);
    if (cached) return cached;
    const device = this.device;
    const usage = globalThis.GPUTextureUsage;
    const white = device.createTexture({
      size: { width: 1, height: 1 },
      format: "rgba8unorm",
      usage: usage.TEXTURE_BINDING | usage.COPY_DST
    });
    device.queue.writeTexture(
      { texture: white },
      new Uint8Array([255, 255, 255, 255]),
      {},
      { width: 1, height: 1 }
    );
    this.textures.set(mesh, white);
    const upload = async (source2) => {
      const image = source2 instanceof HTMLImageElement ? await createImageBitmap(source2) : source2;
      if (this.destroyed || !this.device || this.textures.get(mesh) !== white) return;
      const width = image.width || 1;
      const height = image.height || 1;
      const texture = this.device.createTexture({
        size: { width, height },
        format: "rgba8unorm",
        usage: usage.TEXTURE_BINDING | usage.COPY_DST | usage.RENDER_ATTACHMENT
      });
      this.device.queue.copyExternalImageToTexture(
        { source: image },
        { texture },
        { width, height }
      );
      this.retired.push(white);
      this.textures.set(mesh, texture);
      this.bindGroups.delete(mesh);
    };
    const source = this.sources.get(mesh);
    if (typeof source === "string") {
      const image = new Image();
      image.onload = () => void upload(image);
      image.src = source;
    } else {
      void upload(source);
    }
    return this.textures.get(mesh);
  }
  buffersFor(mesh) {
    const cached = this.texturedBuffers.get(mesh);
    if (cached) return cached;
    const data = expandToTriangles(mesh);
    const usage = globalThis.GPUBufferUsage.VERTEX | globalThis.GPUBufferUsage.COPY_DST;
    const upload = (array) => {
      const buffer = this.device.createBuffer({ size: array.byteLength, usage });
      this.device.queue.writeBuffer(buffer, 0, array);
      return buffer;
    };
    const result = {
      position: upload(data.positions),
      uv: upload(planarUVs(mesh)),
      color: upload(data.colors),
      count: data.count
    };
    this.texturedBuffers.set(mesh, result);
    return result;
  }
  bindGroupFor(mesh) {
    const texture = this.textureFor(mesh);
    const cached = this.bindGroups.get(mesh);
    if (cached && cached.buffer === this.texturedUniforms && cached.texture === texture) {
      return cached.group;
    }
    const group = this.device.createBindGroup({
      layout: this.texturedPipeline.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: { buffer: this.texturedUniforms, offset: 0, size: 144 } },
        { binding: 1, resource: texture.createView() },
        { binding: 2, resource: this.sampler }
      ]
    });
    this.bindGroups.set(mesh, { group, buffer: this.texturedUniforms, texture });
    return group;
  }
  render(frame) {
    const plain = [];
    const textured = [];
    for (const item of frame.items) {
      (this.sources.has(item.mesh) ? textured : plain).push(item);
    }
    super.render(textured.length ? { ...frame, items: plain } : frame);
    if (!textured.length) return;
    if (this.destroyed || !this.device || !this.context || !this.texturedPipeline) return;
    if (frame.width === 0 || frame.height === 0) return;
    this.ensureDepth();
    if (textured.length > this.texturedCapacity || !this.texturedUniforms) {
      this.texturedUniforms?.destroy?.();
      this.texturedUniforms = this.device.createBuffer({
        size: textured.length * UNIFORM_STRIDE2,
        usage: globalThis.GPUBufferUsage.UNIFORM | globalThis.GPUBufferUsage.COPY_DST
      });
      this.texturedCapacity = textured.length;
    }
    const viewProj = multiply(CLIP_Z_FIX2, frame.viewProjection);
    textured.forEach((item, i) => {
      const data = new Float32Array(UNIFORM_STRIDE2 / 4);
      data.set(viewProj, 0);
      data.set(item.model, 16);
      data.set([itemOpacity(item.transparency), 0, 0, 0], 32);
      this.device.queue.writeBuffer(this.texturedUniforms, i * UNIFORM_STRIDE2, data);
    });
    const cleared = plain.length > 0;
    const encoder = this.device.createCommandEncoder();
    const pass = encoder.beginRenderPass({
      colorAttachments: [
        {
          view: this.context.getCurrentTexture().createView(),
          clearValue: this.clearValue,
          loadOp: cleared ? "load" : "clear",
          storeOp: "store"
        }
      ],
      depthStencilAttachment: {
        view: this.depthTexture.createView(),
        depthClearValue: 1,
        depthLoadOp: cleared ? "load" : "clear",
        depthStoreOp: "store"
      }
    });
    pass.setPipeline(this.texturedPipeline);
    textured.forEach((item, i) => {
      const mesh = this.buffersFor(item.mesh);
      pass.setBindGroup(0, this.bindGroupFor(item.mesh), [i * UNIFORM_STRIDE2]);
      pass.setVertexBuffer(0, mesh.position);
      pass.setVertexBuffer(1, mesh.uv);
      pass.setVertexBuffer(2, mesh.color);
      pass.draw(mesh.count);
    });
    pass.end();
    this.device.queue.submit([encoder.finish()]);
  }
  destroy() {
    for (const texture of this.textures.values()) texture.destroy?.();
    for (const texture of this.retired.splice(0)) texture.destroy?.();
    for (const buffers of this.texturedBuffers.values()) {
      buffers.position.destroy?.();
      buffers.uv.destroy?.();
      buffers.color.destroy?.();
    }
    this.textures.clear();
    this.texturedBuffers.clear();
    this.bindGroups.clear();
    this.sources.clear();
    this.texturedUniforms?.destroy?.();
    this.texturedUniforms = void 0;
    this.texturedPipeline = void 0;
    this.sampler = void 0;
    super.destroy();
  }
};
