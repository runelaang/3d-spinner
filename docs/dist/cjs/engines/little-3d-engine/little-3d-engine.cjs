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
function vec3(x, y, z) {
  return { x, y, z };
}
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
function dot(a, b) {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}
function scale(v, s) {
  return { x: v.x * s, y: v.y * s, z: v.z * s };
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
function translation(x, y, z) {
  return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, x, y, z, 1];
}
function scaleMatrix(s) {
  return [s, 0, 0, 0, 0, s, 0, 0, 0, 0, s, 0, 0, 0, 0, 1];
}
function rotationX(rad) {
  const c = Math.cos(rad);
  const s = Math.sin(rad);
  return [1, 0, 0, 0, 0, c, s, 0, 0, -s, c, 0, 0, 0, 0, 1];
}
function rotationY(rad) {
  const c = Math.cos(rad);
  const s = Math.sin(rad);
  return [c, 0, -s, 0, 0, 1, 0, 0, s, 0, c, 0, 0, 0, 0, 1];
}
function rotationZ(rad) {
  const c = Math.cos(rad);
  const s = Math.sin(rad);
  return [c, s, 0, 0, -s, c, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
}
function perspective(fovY, aspect, near, far) {
  const f = 1 / Math.tan(fovY / 2);
  const nf = 1 / (near - far);
  return [
    f / aspect,
    0,
    0,
    0,
    0,
    f,
    0,
    0,
    0,
    0,
    (far + near) * nf,
    -1,
    0,
    0,
    2 * far * near * nf,
    0
  ];
}
function transformPoint(m, p) {
  const x = m[0] * p.x + m[4] * p.y + m[8] * p.z + m[12];
  const y = m[1] * p.x + m[5] * p.y + m[9] * p.z + m[13];
  const z = m[2] * p.x + m[6] * p.y + m[10] * p.z + m[14];
  const w = m[3] * p.x + m[7] * p.y + m[11] * p.z + m[15] || 1;
  return { x: x / w, y: y / w, z: z / w };
}
function transformAffine(m, p) {
  return {
    x: m[0] * p.x + m[4] * p.y + m[8] * p.z + m[12],
    y: m[1] * p.x + m[5] * p.y + m[9] * p.z + m[13],
    z: m[2] * p.x + m[6] * p.y + m[10] * p.z + m[14]
  };
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
  let o = 0;
  for (const face of mesh.faces) {
    const v0 = mesh.vertices[face.indices[0]];
    const v1 = mesh.vertices[face.indices[1]];
    const v2 = mesh.vertices[face.indices[2]];
    const normal = normalize(cross(subtract(v1, v0), subtract(v2, v0)));
    const [r, g, b] = parseColor(face.color);
    const cr = r / 255;
    const cg = g / 255;
    const cb = b / 255;
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
        o += 3;
      }
    }
  }
  return { positions, normals, colors, count: positions.length / 3 };
}
function midpoint(a, b) {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, z: (a.z + b.z) / 2 };
}
function sphereFromTriangles(seedVertices, seedFaces, size, detail, colors) {
  const radius = size / 2;
  let triangles = seedFaces.map((f) => f.map((i) => normalize(seedVertices[i])));
  const levels = Math.max(0, Math.floor(detail) - 1);
  for (let level = 0; level < levels; level++) {
    const next = [];
    for (const [a, b, c] of triangles) {
      const ab = normalize(midpoint(a, b));
      const bc = normalize(midpoint(b, c));
      const ca = normalize(midpoint(c, a));
      next.push([a, ab, ca], [b, bc, ab], [c, ca, bc], [ab, bc, ca]);
    }
    triangles = next;
  }
  const vertices = [];
  const faces = triangles.map((tri, i) => {
    const base = vertices.length;
    vertices.push(scale(tri[0], radius), scale(tri[1], radius), scale(tri[2], radius));
    return { indices: [base, base + 1, base + 2], color: colors[i % colors.length] };
  });
  return { vertices, faces };
}
var init_geometry = __esm({
  "src/engines/little-3d-engine/core/geometry.ts"() {
    "use strict";
    init_math();
  }
});

// src/engines/little-3d-engine/core/light.ts
function clamp01(value) {
  return Math.min(1, Math.max(0, value));
}
function shadeColor(normal, color, light) {
  const lambert = Math.max(0, dot(normal, light.toLight));
  const brightness = clamp01(light.ambient + light.intensity * lambert);
  const [r, g, b] = parseColor(color);
  return `rgb(${Math.round(r * brightness)}, ${Math.round(g * brightness)}, ${Math.round(
    b * brightness
  )})`;
}
var DEFAULTS2, Light;
var init_light = __esm({
  "src/engines/little-3d-engine/core/light.ts"() {
    "use strict";
    init_math();
    init_geometry();
    DEFAULTS2 = {
      direction: { x: -0.4, y: -0.7, z: -0.6 },
      intensity: 0.85,
      ambient: 0.25
    };
    Light = class {
      constructor(options) {
        this.options = { ...DEFAULTS2, ...options };
        this.params = {
          toLight: normalize(scale(this.options.direction, -1)),
          intensity: this.options.intensity,
          ambient: this.options.ambient
        };
      }
      /** Convenience wrapper around {@link shadeColor} using this light. */
      shade(normal, color) {
        return shadeColor(normal, color, this.params);
      }
    };
  }
});

// src/engines/little-3d-engine/renderers/webgl.ts
var webgl_exports = {};
__export(webgl_exports, {
  WebGLRenderer: () => WebGLRenderer
});
function compile(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    throw new Error(`3d-spinner: shader compile failed: ${gl.getShaderInfoLog(shader)}`);
  }
  return shader;
}
function link(gl) {
  const program = gl.createProgram();
  gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, VERTEX_SHADER));
  gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER));
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new Error(`3d-spinner: program link failed: ${gl.getProgramInfoLog(program)}`);
  }
  return program;
}
var VERTEX_SHADER, FRAGMENT_SHADER, WebGLRenderer;
var init_webgl = __esm({
  "src/engines/little-3d-engine/renderers/webgl.ts"() {
    "use strict";
    init_geometry();
    init_renderer();
    VERTEX_SHADER = `#version 300 es
in vec3 aPos;
in vec3 aNormal;
in vec3 aColor;
uniform mat4 uViewProj;
uniform mat4 uModel;
out vec3 vNormal;
out vec3 vColor;
void main() {
  vNormal = mat3(uModel) * aNormal;
  vColor = aColor;
  gl_Position = uViewProj * uModel * vec4(aPos, 1.0);
}`;
    FRAGMENT_SHADER = `#version 300 es
precision mediump float;
in vec3 vNormal;
in vec3 vColor;
uniform vec3 uToLight;
uniform float uIntensity;
uniform float uAmbient;
uniform float uOpacity;
out vec4 fragColor;
void main() {
  float lambert = max(dot(normalize(vNormal), normalize(uToLight)), 0.0);
  float brightness = clamp(uAmbient + uIntensity * lambert, 0.0, 1.0);
  fragColor = vec4(vColor * brightness, uOpacity);
}`;
    WebGLRenderer = class {
      constructor(options = {}) {
        this.cache = /* @__PURE__ */ new Map();
        if (options.background) {
          const [r, g, b] = parseColor(options.background);
          this.clearColor = [r / 255, g / 255, b / 255, 1];
        } else {
          this.clearColor = [0, 0, 0, 0];
        }
      }
      init(canvas) {
        const gl = canvas.getContext("webgl2");
        if (!gl) throw new Error("3d-spinner: WebGL2 is not supported in this browser.");
        this.gl = gl;
        this.program = link(gl);
        this.locations = {
          aPos: gl.getAttribLocation(this.program, "aPos"),
          aNormal: gl.getAttribLocation(this.program, "aNormal"),
          aColor: gl.getAttribLocation(this.program, "aColor"),
          uViewProj: gl.getUniformLocation(this.program, "uViewProj"),
          uModel: gl.getUniformLocation(this.program, "uModel"),
          uToLight: gl.getUniformLocation(this.program, "uToLight"),
          uIntensity: gl.getUniformLocation(this.program, "uIntensity"),
          uAmbient: gl.getUniformLocation(this.program, "uAmbient"),
          uOpacity: gl.getUniformLocation(this.program, "uOpacity")
        };
        gl.enable(gl.DEPTH_TEST);
        gl.enable(gl.CULL_FACE);
        gl.cullFace(gl.BACK);
        gl.frontFace(gl.CCW);
      }
      resize() {
        const gl = this.gl;
        if (!gl) return;
        const canvas = gl.canvas;
        gl.viewport(0, 0, canvas.width, canvas.height);
      }
      buffers(mesh) {
        const cached = this.cache.get(mesh);
        if (cached) return cached;
        const gl = this.gl;
        const loc = this.locations;
        const data = expandToTriangles(mesh);
        const vao = gl.createVertexArray();
        gl.bindVertexArray(vao);
        const attribute = (location, array) => {
          if (location < 0) return;
          const buffer = gl.createBuffer();
          gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
          gl.bufferData(gl.ARRAY_BUFFER, array, gl.STATIC_DRAW);
          gl.enableVertexAttribArray(location);
          gl.vertexAttribPointer(location, 3, gl.FLOAT, false, 0, 0);
        };
        attribute(loc.aPos, data.positions);
        attribute(loc.aNormal, data.normals);
        attribute(loc.aColor, data.colors);
        gl.bindVertexArray(null);
        const result = { vao, count: data.count };
        this.cache.set(mesh, result);
        return result;
      }
      render(frame) {
        const gl = this.gl;
        const loc = this.locations;
        if (!gl || !this.program || !loc) return;
        gl.clearColor(...this.clearColor);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.useProgram(this.program);
        gl.uniformMatrix4fv(loc.uViewProj, false, new Float32Array(frame.viewProjection));
        gl.uniform3f(loc.uToLight, frame.light.toLight.x, frame.light.toLight.y, frame.light.toLight.z);
        gl.uniform1f(loc.uIntensity, frame.light.intensity);
        gl.uniform1f(loc.uAmbient, frame.light.ambient);
        gl.disable(gl.BLEND);
        gl.depthMask(true);
        gl.cullFace(gl.BACK);
        for (const item of frame.items) {
          if (item.transparency) continue;
          const mesh = this.buffers(item.mesh);
          gl.uniformMatrix4fv(loc.uModel, false, new Float32Array(item.model));
          gl.uniform1f(loc.uOpacity, 1);
          gl.bindVertexArray(mesh.vao);
          gl.drawArrays(gl.TRIANGLES, 0, mesh.count);
        }
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        gl.depthMask(false);
        for (const item of frame.items) {
          const transparency = item.transparency;
          if (!transparency) continue;
          const mesh = this.buffers(item.mesh);
          gl.uniformMatrix4fv(loc.uModel, false, new Float32Array(item.model));
          gl.bindVertexArray(mesh.vao);
          if (transparency.mode === "two-sided") {
            const resolved = resolveTwoSidedOpacity(transparency);
            gl.cullFace(gl.FRONT);
            gl.uniform1f(loc.uOpacity, resolved.back);
            gl.drawArrays(gl.TRIANGLES, 0, mesh.count);
            gl.cullFace(gl.BACK);
            gl.uniform1f(loc.uOpacity, resolved.front);
            gl.drawArrays(gl.TRIANGLES, 0, mesh.count);
          } else {
            gl.cullFace(gl.BACK);
            gl.uniform1f(loc.uOpacity, opacity(transparency.opacity, DEFAULT_ONE_SIDED_OPACITY));
            gl.drawArrays(gl.TRIANGLES, 0, mesh.count);
          }
        }
        gl.depthMask(true);
        gl.disable(gl.BLEND);
        gl.cullFace(gl.BACK);
        gl.bindVertexArray(null);
      }
      destroy() {
        const gl = this.gl;
        if (gl) {
          for (const mesh of this.cache.values()) gl.deleteVertexArray(mesh.vao);
          if (this.program) gl.deleteProgram(this.program);
        }
        this.cache.clear();
        this.gl = void 0;
        this.program = void 0;
        this.locations = void 0;
      }
    };
  }
});

// src/engines/little-3d-engine/renderers/webgpu.ts
var webgpu_exports = {};
__export(webgpu_exports, {
  WebGPURenderer: () => WebGPURenderer
});
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
};
@group(0) @binding(0) var<uniform> u: Uniforms;

struct VSOut {
  @builtin(position) position: vec4<f32>,
  @location(0) normal: vec3<f32>,
  @location(1) color: vec3<f32>,
};

@vertex
fn vs(@location(0) pos: vec3<f32>, @location(1) normal: vec3<f32>, @location(2) color: vec3<f32>) -> VSOut {
  var out: VSOut;
  let m = mat3x3<f32>(u.model[0].xyz, u.model[1].xyz, u.model[2].xyz);
  out.normal = m * normal;
  out.color = color;
  out.position = u.viewProj * u.model * vec4<f32>(pos, 1.0);
  return out;
}

@fragment
fn fs(in: VSOut) -> @location(0) vec4<f32> {
  let lambert = max(dot(normalize(in.normal), normalize(u.toLight.xyz)), 0.0);
  let brightness = clamp(u.params.y + u.params.x * lambert, 0.0, 1.0);
  return vec4<f32>(in.color * brightness, u.params.z);
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
              buffer: { type: "uniform", hasDynamicOffset: true, minBindingSize: 160 }
            }
          ]
        });
        const vertexBuffer = (location) => ({
          arrayStride: 12,
          attributes: [{ shaderLocation: location, offset: 0, format: "float32x3" }]
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
            buffers: [vertexBuffer(0), vertexBuffer(1), vertexBuffer(2)]
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
            { binding: 0, resource: { buffer: this.uniformBuffer, offset: 0, size: 160 } }
          ]
        });
        draws.forEach((draw, i) => {
          const data = new Float32Array(UNIFORM_STRIDE / 4);
          data.set(viewProj, 0);
          data.set(draw.item.model, 16);
          data.set([frame.light.toLight.x, frame.light.toLight.y, frame.light.toLight.z, 0], 32);
          data.set([frame.light.intensity, frame.light.ambient, draw.opacity, 0], 36);
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

// src/engines/little-3d-engine/renderers/canvas2d.ts
var canvas2d_exports = {};
__export(canvas2d_exports, {
  Canvas2DRenderer: () => Canvas2DRenderer
});
var Canvas2DRenderer;
var init_canvas2d = __esm({
  "src/engines/little-3d-engine/renderers/canvas2d.ts"() {
    "use strict";
    init_light();
    init_math();
    init_renderer();
    Canvas2DRenderer = class {
      constructor(options = {}) {
        this.options = options;
        this.dpr = 1;
      }
      init(canvas) {
        this.ctx = canvas.getContext("2d") ?? void 0;
      }
      resize(_cssWidth, _cssHeight, dpr) {
        this.dpr = dpr;
        this.ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
      }
      render(frame) {
        const ctx = this.ctx;
        if (!ctx) return;
        if (this.options.background) {
          ctx.fillStyle = this.options.background;
          ctx.fillRect(0, 0, frame.width, frame.height);
        } else {
          ctx.clearRect(0, 0, frame.width, frame.height);
        }
        const polygons = [];
        for (const item of frame.items) {
          const world = item.mesh.vertices.map((v) => transformAffine(item.model, v));
          const twoSidedOpacity = item.transparency?.mode === "two-sided" ? resolveTwoSidedOpacity(item.transparency) : void 0;
          for (const face of item.mesh.faces) {
            const a = world[face.indices[0]];
            const b = world[face.indices[1]];
            const c = world[face.indices[2]];
            const normal = normalize(cross(subtract(b, a), subtract(c, a)));
            const frontFacing = dot(normal, subtract(frame.eye, a)) > 0;
            const transparency = item.transparency;
            if (!frontFacing && transparency?.mode !== "two-sided") continue;
            let faceOpacity = 1;
            if (transparency?.mode === "one-sided") {
              faceOpacity = opacity(transparency.opacity, DEFAULT_ONE_SIDED_OPACITY);
            } else if (twoSidedOpacity) {
              faceOpacity = frontFacing ? twoSidedOpacity.front : twoSidedOpacity.back;
            }
            const points = face.indices.map((i) => {
              const ndc = transformPoint(frame.viewProjection, world[i]);
              return {
                x: (ndc.x * 0.5 + 0.5) * frame.width,
                y: (1 - (ndc.y * 0.5 + 0.5)) * frame.height
              };
            });
            let depth = 0;
            for (const i of face.indices) {
              const d = subtract(world[i], frame.eye);
              depth += dot(d, d);
            }
            depth /= face.indices.length;
            polygons.push({
              points,
              color: shadeColor(normal, face.color, frame.light),
              depth,
              opacity: faceOpacity
            });
          }
        }
        polygons.sort((p, q) => q.depth - p.depth);
        for (const poly of polygons) {
          if (poly.points.length < 3) continue;
          ctx.beginPath();
          ctx.moveTo(poly.points[0].x, poly.points[0].y);
          for (let i = 1; i < poly.points.length; i++) {
            ctx.lineTo(poly.points[i].x, poly.points[i].y);
          }
          ctx.closePath();
          ctx.fillStyle = poly.color;
          ctx.strokeStyle = poly.color;
          ctx.lineWidth = 1;
          ctx.globalAlpha = poly.opacity;
          ctx.fill();
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
      }
      destroy() {
        this.ctx = void 0;
      }
    };
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
function orderRenderItems(items, eye) {
  const opaque = [];
  const transparent = [];
  for (const item of items) {
    (item.transparency ? transparent : opaque).push(item);
  }
  transparent.sort((a, b) => {
    const ax = a.model[12] - eye.x;
    const ay = a.model[13] - eye.y;
    const az = a.model[14] - eye.z;
    const bx = b.model[12] - eye.x;
    const by = b.model[13] - eye.y;
    const bz = b.model[14] - eye.z;
    return bx * bx + by * by + bz * bz - (ax * ax + ay * ay + az * az);
  });
  return opaque.concat(transparent);
}
async function createRenderer(backend, options = {}) {
  if (typeof backend === "function") return backend(options);
  switch (backend) {
    case "webgl":
      return new (await Promise.resolve().then(() => (init_webgl(), webgl_exports))).WebGLRenderer(options);
    case "webgpu":
      return new (await Promise.resolve().then(() => (init_webgpu(), webgpu_exports))).WebGPURenderer(options);
    case "canvas2d":
    default:
      return new (await Promise.resolve().then(() => (init_canvas2d(), canvas2d_exports))).Canvas2DRenderer(options);
  }
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

// src/engines/little-3d-engine/little-3d-engine.ts
var little_3d_engine_exports = {};
__export(little_3d_engine_exports, {
  Camera: () => Camera,
  Light: () => Light,
  Little3dEngine: () => Little3dEngine,
  cross: () => cross,
  cube: () => cube,
  cubeSphere: () => cubeSphere,
  dot: () => dot,
  expandToTriangles: () => expandToTriangles,
  icosphere: () => icosphere,
  normalize: () => normalize,
  octaSphere: () => octaSphere,
  octahedron: () => octahedron,
  orderRenderItems: () => orderRenderItems,
  planeMesh: () => planeMesh,
  pyramid: () => pyramid,
  quad: () => quad,
  scale: () => scale,
  shineTexture: () => shineTexture,
  starTexture: () => starTexture,
  streakTexture: () => streakTexture,
  subtract: () => subtract,
  tetrahedron: () => tetrahedron,
  transform: () => transform,
  uvSphere: () => uvSphere,
  vec3: () => vec3
});
module.exports = __toCommonJS(little_3d_engine_exports);

// src/engines/little-3d-engine/core/camera.ts
init_math();
var DEFAULTS = {
  position: { x: 0, y: 0, z: 4 },
  fov: 55 * Math.PI / 180,
  near: 0.1,
  far: 100
};
var Camera = class {
  constructor(options) {
    this.options = { ...DEFAULTS, ...options };
  }
  /** Transform a world-space point into view (camera) space. */
  toView(p) {
    const { position } = this.options;
    return transformAffine(translation(-position.x, -position.y, -position.z), p);
  }
  /** Combined view-projection matrix for the given viewport aspect ratio. */
  viewProjection(aspect) {
    const { position, fov, near, far } = this.options;
    const view = translation(-position.x, -position.y, -position.z);
    const projection = perspective(fov, aspect, near, far);
    return multiply(projection, view);
  }
  /** Convert a normalized device coordinate (-1..1) to a pixel position. */
  toScreen(ndc, width, height) {
    return {
      x: (ndc.x * 0.5 + 0.5) * width,
      y: (1 - (ndc.y * 0.5 + 0.5)) * height
    };
  }
};

// src/engines/little-3d-engine/little-3d-engine.ts
init_light();
init_math();

// src/engines/little-3d-engine/core/mesh.ts
function transform(init) {
  return {
    position: init?.position ?? { x: 0, y: 0, z: 0 },
    rotation: init?.rotation ?? { x: 0, y: 0, z: 0 },
    scale: init?.scale ?? 1
  };
}

// src/engines/little-3d-engine/little-3d-engine.ts
init_renderer();
init_light();

// src/engines/little-3d-engine/shapes/primitives/cube.ts
var DEFAULT_COLORS = ["#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#ef4444"];
function cube(size = 1, colors = DEFAULT_COLORS) {
  const h = size / 2;
  const vertices = [
    { x: -h, y: -h, z: h },
    { x: h, y: -h, z: h },
    { x: h, y: h, z: h },
    { x: -h, y: h, z: h },
    { x: -h, y: -h, z: -h },
    { x: h, y: -h, z: -h },
    { x: h, y: h, z: -h },
    { x: -h, y: h, z: -h }
  ];
  const faces = [
    { indices: [0, 1, 2, 3], color: colors[0 % colors.length] },
    { indices: [5, 4, 7, 6], color: colors[1 % colors.length] },
    { indices: [3, 2, 6, 7], color: colors[2 % colors.length] },
    { indices: [4, 5, 1, 0], color: colors[3 % colors.length] },
    { indices: [1, 5, 6, 2], color: colors[4 % colors.length] },
    { indices: [4, 0, 3, 7], color: colors[5 % colors.length] }
  ];
  return { vertices, faces };
}

// src/engines/little-3d-engine/shapes/primitives/quad.ts
var DEFAULT_COLORS2 = ["#3b82f6"];
function quad(size = 1, colors = DEFAULT_COLORS2) {
  const s = size / 2;
  const vertices = [
    { x: -s, y: -s, z: 0 },
    { x: s, y: -s, z: 0 },
    { x: s, y: s, z: 0 },
    { x: -s, y: s, z: 0 }
  ];
  return { vertices, faces: [{ indices: [0, 1, 2, 3], color: colors[0] }] };
}

// src/engines/little-3d-engine/shapes/primitives/tetrahedron.ts
var DEFAULT_COLORS3 = ["#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b"];
function tetrahedron(size = 1, colors = DEFAULT_COLORS3) {
  const s = size / 2;
  const vertices = [
    { x: s, y: s, z: s },
    { x: s, y: -s, z: -s },
    { x: -s, y: s, z: -s },
    { x: -s, y: -s, z: s }
  ];
  const faces = [
    { indices: [0, 1, 2], color: colors[0 % colors.length] },
    { indices: [0, 3, 1], color: colors[1 % colors.length] },
    { indices: [0, 2, 3], color: colors[2 % colors.length] },
    { indices: [1, 3, 2], color: colors[3 % colors.length] }
  ];
  return { vertices, faces };
}

// src/engines/little-3d-engine/shapes/primitives/octahedron.ts
var DEFAULT_COLORS4 = [
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#f59e0b",
  "#10b981",
  "#ef4444",
  "#06b6d4",
  "#eab308"
];
function octahedron(size = 1, colors = DEFAULT_COLORS4) {
  const r = size / 2;
  const vertices = [
    { x: r, y: 0, z: 0 },
    { x: -r, y: 0, z: 0 },
    { x: 0, y: r, z: 0 },
    { x: 0, y: -r, z: 0 },
    { x: 0, y: 0, z: r },
    { x: 0, y: 0, z: -r }
  ];
  const faces = [
    { indices: [4, 0, 2], color: colors[0 % colors.length] },
    { indices: [4, 2, 1], color: colors[1 % colors.length] },
    { indices: [4, 1, 3], color: colors[2 % colors.length] },
    { indices: [4, 3, 0], color: colors[3 % colors.length] },
    { indices: [5, 2, 0], color: colors[4 % colors.length] },
    { indices: [5, 1, 2], color: colors[5 % colors.length] },
    { indices: [5, 3, 1], color: colors[6 % colors.length] },
    { indices: [5, 0, 3], color: colors[7 % colors.length] }
  ];
  return { vertices, faces };
}

// src/engines/little-3d-engine/shapes/primitives/pyramid.ts
var DEFAULT_COLORS5 = ["#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981"];
function pyramid(size = 1, colors = DEFAULT_COLORS5) {
  const h = size / 2;
  const vertices = [
    { x: -h, y: -h, z: h },
    { x: h, y: -h, z: h },
    { x: h, y: -h, z: -h },
    { x: -h, y: -h, z: -h },
    { x: 0, y: h, z: 0 }
  ];
  const faces = [
    { indices: [0, 3, 2, 1], color: colors[0 % colors.length] },
    { indices: [4, 0, 1], color: colors[1 % colors.length] },
    { indices: [4, 1, 2], color: colors[2 % colors.length] },
    { indices: [4, 2, 3], color: colors[3 % colors.length] },
    { indices: [4, 3, 0], color: colors[4 % colors.length] }
  ];
  return { vertices, faces };
}

// src/engines/little-3d-engine/shapes/primitives/spheres/uv-sphere.ts
var DEFAULT_COLORS6 = ["#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#ef4444"];
function uvSphere(size = 1, detail = 1, colors = DEFAULT_COLORS6) {
  const r = size / 2;
  const d = Math.max(1, Math.floor(detail));
  const slices = Math.max(4, d * 4);
  const stacks = Math.max(2, d * 2);
  const vertices = [{ x: 0, y: r, z: 0 }];
  const ring = (i, j) => 1 + (i - 1) * slices + j;
  for (let i = 1; i < stacks; i++) {
    const phi = Math.PI * i / stacks;
    const y = r * Math.cos(phi);
    const rr = r * Math.sin(phi);
    for (let j = 0; j < slices; j++) {
      const theta = 2 * Math.PI * j / slices;
      vertices.push({ x: rr * Math.cos(theta), y, z: rr * Math.sin(theta) });
    }
  }
  const bottom = vertices.length;
  vertices.push({ x: 0, y: -r, z: 0 });
  const faces = [];
  let ci = 0;
  const color = () => colors[ci++ % colors.length];
  for (let j = 0; j < slices; j++) {
    faces.push({ indices: [0, ring(1, (j + 1) % slices), ring(1, j)], color: color() });
  }
  for (let i = 1; i < stacks - 1; i++) {
    for (let j = 0; j < slices; j++) {
      const j1 = (j + 1) % slices;
      faces.push({
        indices: [ring(i, j), ring(i, j1), ring(i + 1, j1), ring(i + 1, j)],
        color: color()
      });
    }
  }
  for (let j = 0; j < slices; j++) {
    faces.push({
      indices: [bottom, ring(stacks - 1, j), ring(stacks - 1, (j + 1) % slices)],
      color: color()
    });
  }
  return { vertices, faces };
}

// src/engines/little-3d-engine/shapes/primitives/spheres/icosphere.ts
init_geometry();
var DEFAULT_COLORS7 = ["#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#ef4444"];
var T = (1 + Math.sqrt(5)) / 2;
var SEED_VERTICES = [
  { x: -1, y: T, z: 0 },
  { x: 1, y: T, z: 0 },
  { x: -1, y: -T, z: 0 },
  { x: 1, y: -T, z: 0 },
  { x: 0, y: -1, z: T },
  { x: 0, y: 1, z: T },
  { x: 0, y: -1, z: -T },
  { x: 0, y: 1, z: -T },
  { x: T, y: 0, z: -1 },
  { x: T, y: 0, z: 1 },
  { x: -T, y: 0, z: -1 },
  { x: -T, y: 0, z: 1 }
];
var SEED_FACES = [
  [0, 11, 5],
  [0, 5, 1],
  [0, 1, 7],
  [0, 7, 10],
  [0, 10, 11],
  [1, 5, 9],
  [5, 11, 4],
  [11, 10, 2],
  [10, 7, 6],
  [7, 1, 8],
  [3, 9, 4],
  [3, 4, 2],
  [3, 2, 6],
  [3, 6, 8],
  [3, 8, 9],
  [4, 9, 5],
  [2, 4, 11],
  [6, 2, 10],
  [8, 6, 7],
  [9, 8, 1]
];
function icosphere(size = 1, detail = 1, colors = DEFAULT_COLORS7) {
  return sphereFromTriangles(SEED_VERTICES, SEED_FACES, size, detail, colors);
}

// src/engines/little-3d-engine/shapes/primitives/spheres/octa-sphere.ts
init_geometry();
var DEFAULT_COLORS8 = ["#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#ef4444"];
var SEED_VERTICES2 = [
  { x: 1, y: 0, z: 0 },
  { x: -1, y: 0, z: 0 },
  { x: 0, y: 1, z: 0 },
  { x: 0, y: -1, z: 0 },
  { x: 0, y: 0, z: 1 },
  { x: 0, y: 0, z: -1 }
];
var SEED_FACES2 = [
  [4, 0, 2],
  [4, 2, 1],
  [4, 1, 3],
  [4, 3, 0],
  [5, 2, 0],
  [5, 1, 2],
  [5, 3, 1],
  [5, 0, 3]
];
function octaSphere(size = 1, detail = 1, colors = DEFAULT_COLORS8) {
  return sphereFromTriangles(SEED_VERTICES2, SEED_FACES2, size, detail, colors);
}

// src/engines/little-3d-engine/shapes/primitives/spheres/cube-sphere.ts
var DEFAULT_COLORS9 = ["#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#ef4444"];
var CUBE_FACES = [
  { normal: [0, 0, 1], right: [1, 0, 0], up: [0, 1, 0] },
  { normal: [0, 0, -1], right: [-1, 0, 0], up: [0, 1, 0] },
  { normal: [1, 0, 0], right: [0, 0, -1], up: [0, 1, 0] },
  { normal: [-1, 0, 0], right: [0, 0, 1], up: [0, 1, 0] },
  { normal: [0, 1, 0], right: [1, 0, 0], up: [0, 0, -1] },
  { normal: [0, -1, 0], right: [1, 0, 0], up: [0, 0, 1] }
];
function cubeSphere(size = 1, detail = 1, colors = DEFAULT_COLORS9) {
  const r = size / 2;
  const n = Math.max(1, Math.floor(detail));
  const vertices = [];
  const faces = [];
  let ci = 0;
  for (const face of CUBE_FACES) {
    const base = vertices.length;
    for (let i = 0; i <= n; i++) {
      for (let j = 0; j <= n; j++) {
        const u = -1 + 2 * i / n;
        const v = -1 + 2 * j / n;
        const x = face.normal[0] + u * face.right[0] + v * face.up[0];
        const y = face.normal[1] + u * face.right[1] + v * face.up[1];
        const z = face.normal[2] + u * face.right[2] + v * face.up[2];
        const len = Math.hypot(x, y, z);
        vertices.push({ x: x / len * r, y: y / len * r, z: z / len * r });
      }
    }
    const idx = (i, j) => base + i * (n + 1) + j;
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        faces.push({
          indices: [idx(i, j), idx(i + 1, j), idx(i + 1, j + 1), idx(i, j + 1)],
          color: colors[ci++ % colors.length]
        });
      }
    }
  }
  return { vertices, faces };
}

// src/engines/little-3d-engine/shapes/complex/plane.ts
var DEFAULT_COLORS10 = ["#e0f2fe", "#7dd3fc", "#38bdf8", "#f8fafc"];
function planeMesh(colors = DEFAULT_COLORS10) {
  return {
    vertices: [
      { x: 0.9, y: 0, z: 0 },
      { x: -0.2, y: 0, z: 0.82 },
      { x: -0.55, y: 0, z: 0.16 },
      { x: -0.72, y: 0, z: 0 },
      { x: -0.55, y: 0, z: -0.16 },
      { x: -0.2, y: 0, z: -0.82 },
      { x: -0.08, y: 0.12, z: 0 },
      { x: -0.08, y: -0.1, z: 0 },
      { x: -0.52, y: 0.38, z: 0 }
    ],
    faces: [
      { indices: [6, 1, 0], color: colors[0] ?? DEFAULT_COLORS10[0] },
      { indices: [6, 2, 1], color: colors[3] ?? DEFAULT_COLORS10[3] },
      { indices: [6, 3, 2], color: colors[1] ?? DEFAULT_COLORS10[1] },
      { indices: [6, 4, 3], color: colors[2] ?? DEFAULT_COLORS10[2] },
      { indices: [6, 5, 4], color: colors[3] ?? DEFAULT_COLORS10[3] },
      { indices: [6, 0, 5], color: colors[0] ?? DEFAULT_COLORS10[0] },
      { indices: [7, 0, 1], color: colors[1] ?? DEFAULT_COLORS10[1] },
      { indices: [7, 1, 2], color: colors[2] ?? DEFAULT_COLORS10[2] },
      { indices: [7, 2, 3], color: colors[1] ?? DEFAULT_COLORS10[1] },
      { indices: [7, 3, 4], color: colors[2] ?? DEFAULT_COLORS10[2] },
      { indices: [7, 4, 5], color: colors[1] ?? DEFAULT_COLORS10[1] },
      { indices: [7, 5, 0], color: colors[2] ?? DEFAULT_COLORS10[2] },
      { indices: [3, 6, 8], color: colors[0] ?? DEFAULT_COLORS10[0] },
      { indices: [3, 8, 6], color: colors[1] ?? DEFAULT_COLORS10[1] }
    ]
  };
}

// src/engines/little-3d-engine/textures/dynamic/canvas-texture.ts
function canvasTexture(draw, size = 96) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (ctx) draw(ctx);
  return canvas;
}

// src/engines/little-3d-engine/textures/dynamic/star.ts
function drawStar(ctx) {
  ctx.save();
  ctx.translate(48, 48);
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  for (let index = 0; index < 10; index++) {
    const radius = index % 2 === 0 ? 43 : 16;
    const angle = index * Math.PI / 5 - Math.PI / 2;
    ctx.lineTo(radius * Math.cos(angle), radius * Math.sin(angle));
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}
function starTexture(options = {}) {
  const glow = Math.max(0, options.glow ?? 0);
  return canvasTexture((ctx) => {
    if (glow > 0) {
      ctx.save();
      ctx.filter = `blur(${glow}px)`;
      drawStar(ctx);
      ctx.restore();
    }
    drawStar(ctx);
  });
}

// src/engines/little-3d-engine/textures/dynamic/shine.ts
function shineTexture() {
  return canvasTexture((ctx) => {
    const halo = ctx.createRadialGradient(48, 48, 1, 48, 48, 46);
    halo.addColorStop(0, "rgba(255,255,255,1)");
    halo.addColorStop(0.08, "rgba(255,255,255,1)");
    halo.addColorStop(0.22, "rgba(210,240,255,0.7)");
    halo.addColorStop(0.55, "rgba(120,200,255,0.22)");
    halo.addColorStop(1, "rgba(80,160,255,0)");
    ctx.fillStyle = halo;
    ctx.fillRect(0, 0, 96, 96);
  });
}

// src/engines/little-3d-engine/textures/dynamic/streak.ts
function streakTexture() {
  return canvasTexture((ctx) => {
    const gradient = ctx.createLinearGradient(5, 0, 91, 0);
    gradient.addColorStop(0, "rgba(255,255,255,0)");
    gradient.addColorStop(0.7, "rgba(255,255,255,0.4)");
    gradient.addColorStop(1, "rgba(255,255,255,1)");
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 3.5;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(5, 48);
    ctx.lineTo(91, 48);
    ctx.stroke();
  });
}

// src/engines/little-3d-engine/little-3d-engine.ts
init_geometry();
init_renderer();
init_math();
function modelMatrix(t) {
  const rotation = multiply(
    rotationZ(t.rotation.z),
    multiply(rotationY(t.rotation.y), rotationX(t.rotation.x))
  );
  return multiply(
    translation(t.position.x, t.position.y, t.position.z),
    multiply(rotation, scaleMatrix(t.scale))
  );
}
var Little3dEngine = class {
  constructor(options = {}) {
    this.scene = [];
    this.cssWidth = 0;
    this.cssHeight = 0;
    this.ready = false;
    this.generation = 0;
    this.rafId = 0;
    this.running = false;
    this.camera = new Camera(options.camera);
    this.light = new Light(options.light);
    this.backend = options.backend ?? "canvas2d";
    this.background = options.background;
  }
  /**
   * Create the canvas inside `target`, load the selected backend, and start
   * tracking size. Resolves once the renderer is ready; rejects if the backend
   * is unavailable. Drawing is a no-op until it resolves.
   */
  async mount(target) {
    const canvas = document.createElement("canvas");
    canvas.style.display = "block";
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    target.appendChild(canvas);
    this.canvas = canvas;
    this.observer = new ResizeObserver(() => this.resize());
    this.observer.observe(canvas);
    this.resize();
    const generation = this.generation;
    const dropCanvas = () => {
      if (this.canvas !== canvas) return;
      this.observer?.disconnect();
      this.observer = void 0;
      canvas.remove();
      this.canvas = void 0;
    };
    try {
      const renderer = await createRenderer(this.backend, { background: this.background });
      if (generation !== this.generation) {
        renderer.destroy();
        dropCanvas();
        return;
      }
      await renderer.init(canvas);
      if (generation !== this.generation) {
        renderer.destroy();
        dropCanvas();
        return;
      }
      this.renderer = renderer;
      this.resize();
      this.ready = true;
    } catch (error) {
      dropCanvas();
      throw error;
    }
  }
  /** Add a mesh to the scene and return a handle for animating it. */
  add(mesh, init) {
    const entry = {
      mesh,
      transform: transform(init),
      transparency: init?.transparency,
      remove: () => {
        const i = this.scene.indexOf(entry);
        if (i >= 0) this.scene.splice(i, 1);
      }
    };
    this.scene.push(entry);
    return entry;
  }
  resize() {
    const canvas = this.canvas;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    this.cssWidth = canvas.clientWidth || canvas.parentElement?.clientWidth || 0;
    this.cssHeight = canvas.clientHeight || canvas.parentElement?.clientHeight || 0;
    canvas.width = Math.max(1, Math.round(this.cssWidth * dpr));
    canvas.height = Math.max(1, Math.round(this.cssHeight * dpr));
    this.renderer?.resize(this.cssWidth, this.cssHeight, dpr);
  }
  /** Draw a single frame from the current scene state. */
  render() {
    if (!this.ready || !this.renderer) return;
    const width = this.cssWidth;
    const height = this.cssHeight;
    if (width === 0 || height === 0) return;
    const items = this.scene.map((entry) => ({
      mesh: entry.mesh,
      model: modelMatrix(entry.transform),
      transparency: entry.transparency
    }));
    const eye = this.camera.options.position;
    this.renderer.render({
      items: orderRenderItems(items, eye),
      viewProjection: this.camera.viewProjection(width / height),
      eye,
      light: this.light.params,
      width,
      height
    });
  }
  /** Start an internal animation loop that calls {@link render} each frame. */
  start() {
    if (this.running) return;
    this.running = true;
    const loop = () => {
      if (!this.running) return;
      this.render();
      this.rafId = requestAnimationFrame(loop);
    };
    this.rafId = requestAnimationFrame(loop);
  }
  /** Stop the internal animation loop started by {@link start}. */
  stop() {
    this.running = false;
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.rafId = 0;
  }
  /** Stop animating, release the renderer, and remove the canvas. */
  destroy() {
    this.generation++;
    this.ready = false;
    this.stop();
    this.observer?.disconnect();
    this.observer = void 0;
    this.renderer?.destroy();
    this.renderer = void 0;
    this.canvas?.remove();
    this.canvas = void 0;
  }
};
