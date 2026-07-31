var Spinner3D = (() => {
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
  function clamp012(value) {
    return Math.min(1, Math.max(0, value));
  }
  function shadeColor(normal, color, light) {
    const lambert = Math.max(0, dot(normal, light.toLight));
    const brightness = clamp012(light.ambient + light.intensity * lambert);
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
          const module = device.createShaderModule({ code: WGSL });
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
              module,
              entryPoint: "vs",
              buffers: [vertexBuffer(0), vertexBuffer(1), vertexBuffer(2)]
            },
            fragment: {
              module,
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
  var init_textured_helpers = __esm({
    "src/engines/little-3d-engine/renderers/textured-helpers.ts"() {
      "use strict";
    }
  });

  // src/engines/little-3d-engine/renderers/webgpu-textured.ts
  var webgpu_textured_exports = {};
  __export(webgpu_textured_exports, {
    WebGPUTexturedRenderer: () => WebGPUTexturedRenderer
  });
  function itemOpacity(transparency) {
    if (!transparency) return 1;
    if (transparency.mode === "two-sided") return resolveTwoSidedOpacity(transparency).front;
    return opacity(transparency.opacity, DEFAULT_ONE_SIDED_OPACITY);
  }
  var WGSL2, CLIP_Z_FIX2, UNIFORM_STRIDE2, WebGPUTexturedRenderer;
  var init_webgpu_textured = __esm({
    "src/engines/little-3d-engine/renderers/webgpu-textured.ts"() {
      "use strict";
      init_geometry();
      init_math();
      init_renderer();
      init_textured_helpers();
      init_webgpu();
      WGSL2 = `
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
      CLIP_Z_FIX2 = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0.5, 0, 0, 0, 0.5, 1];
      UNIFORM_STRIDE2 = 256;
      WebGPUTexturedRenderer = class extends WebGPURenderer {
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
          const module = device.createShaderModule({ code: WGSL2 });
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
              module,
              entryPoint: "vs",
              buffers: [vertexBuffer(0, 3), vertexBuffer(1, 2), vertexBuffer(2, 3)]
            },
            fragment: {
              module,
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
    }
  });

  // src/engines/little-3d-engine/renderers/webgl-textured.ts
  var webgl_textured_exports = {};
  __export(webgl_textured_exports, {
    WebGLTexturedRenderer: () => WebGLTexturedRenderer
  });
  function compile2(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      throw new Error(`3d-spinner: shader compile failed: ${gl.getShaderInfoLog(shader)}`);
    }
    return shader;
  }
  function link2(gl) {
    const program = gl.createProgram();
    gl.attachShader(program, compile2(gl, gl.VERTEX_SHADER, VERTEX_SHADER2));
    gl.attachShader(program, compile2(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER2));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      throw new Error(`3d-spinner: program link failed: ${gl.getProgramInfoLog(program)}`);
    }
    return program;
  }
  function itemOpacity2(transparency) {
    if (!transparency) return 1;
    if (transparency.mode === "two-sided") return resolveTwoSidedOpacity(transparency).front;
    return opacity(transparency.opacity, DEFAULT_ONE_SIDED_OPACITY);
  }
  var VERTEX_SHADER2, FRAGMENT_SHADER2, WebGLTexturedRenderer;
  var init_webgl_textured = __esm({
    "src/engines/little-3d-engine/renderers/webgl-textured.ts"() {
      "use strict";
      init_geometry();
      init_renderer();
      init_textured_helpers();
      init_webgl();
      VERTEX_SHADER2 = `#version 300 es
in vec3 aPos;
in vec2 aUV;
in vec3 aColor;
uniform mat4 uViewProj;
uniform mat4 uModel;
out vec2 vUV;
out vec3 vColor;
void main() {
  vUV = aUV;
  vColor = aColor;
  gl_Position = uViewProj * uModel * vec4(aPos, 1.0);
}`;
      FRAGMENT_SHADER2 = `#version 300 es
precision mediump float;
in vec2 vUV;
in vec3 vColor;
uniform sampler2D uTexture;
uniform float uOpacity;
out vec4 fragColor;
void main() {
  vec4 t = texture(uTexture, vUV);
  fragColor = vec4(t.rgb * vColor, t.a * uOpacity);
}`;
      WebGLTexturedRenderer = class {
        constructor(options = {}) {
          this.sources = /* @__PURE__ */ new Map();
          this.textures = /* @__PURE__ */ new Map();
          this.buffers = /* @__PURE__ */ new Map();
          this.inner = new WebGLRenderer(options);
        }
        /** Texture every instance of `mesh` with `source`. Call any time, also before init. */
        setTexture(mesh, source) {
          this.sources.set(mesh, source);
        }
        init(canvas) {
          this.inner.init(canvas);
          const gl = canvas.getContext("webgl2");
          this.gl = gl;
          this.program = link2(gl);
          this.locations = {
            aPos: gl.getAttribLocation(this.program, "aPos"),
            aUV: gl.getAttribLocation(this.program, "aUV"),
            aColor: gl.getAttribLocation(this.program, "aColor"),
            uViewProj: gl.getUniformLocation(this.program, "uViewProj"),
            uModel: gl.getUniformLocation(this.program, "uModel"),
            uTexture: gl.getUniformLocation(this.program, "uTexture"),
            uOpacity: gl.getUniformLocation(this.program, "uOpacity")
          };
        }
        resize() {
          this.inner.resize();
        }
        textureFor(mesh) {
          const cached = this.textures.get(mesh);
          if (cached) return cached;
          const gl = this.gl;
          const texture = gl.createTexture();
          gl.bindTexture(gl.TEXTURE_2D, texture);
          gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            gl.RGBA,
            1,
            1,
            0,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            new Uint8Array([255, 255, 255, 255])
          );
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
          this.textures.set(mesh, texture);
          const upload = (image) => {
            if (!this.gl || this.textures.get(mesh) !== texture) return;
            this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
            this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, image);
          };
          const source = this.sources.get(mesh);
          if (typeof source === "string") {
            const image = new Image();
            image.onload = () => upload(image);
            image.src = source;
          } else {
            upload(source);
          }
          return texture;
        }
        buffersFor(mesh) {
          const cached = this.buffers.get(mesh);
          if (cached) return cached;
          const gl = this.gl;
          const loc = this.locations;
          const data = expandToTriangles(mesh);
          const vao = gl.createVertexArray();
          gl.bindVertexArray(vao);
          const attribute = (location, array, size) => {
            if (location < 0) return;
            const buffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
            gl.bufferData(gl.ARRAY_BUFFER, array, gl.STATIC_DRAW);
            gl.enableVertexAttribArray(location);
            gl.vertexAttribPointer(location, size, gl.FLOAT, false, 0, 0);
          };
          attribute(loc.aPos, data.positions, 3);
          attribute(loc.aColor, data.colors, 3);
          attribute(loc.aUV, planarUVs(mesh), 2);
          gl.bindVertexArray(null);
          const result = { vao, count: data.count };
          this.buffers.set(mesh, result);
          return result;
        }
        render(frame) {
          const plain = [];
          const textured = [];
          for (const item of frame.items) {
            (this.sources.has(item.mesh) ? textured : plain).push(item);
          }
          this.inner.render(textured.length ? { ...frame, items: plain } : frame);
          if (!textured.length) return;
          const gl = this.gl;
          const loc = this.locations;
          if (!gl || !this.program || !loc) return;
          gl.useProgram(this.program);
          gl.uniformMatrix4fv(loc.uViewProj, false, new Float32Array(frame.viewProjection));
          gl.uniform1i(loc.uTexture, 0);
          gl.activeTexture(gl.TEXTURE0);
          gl.enable(gl.BLEND);
          gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
          gl.depthMask(false);
          for (const item of textured) {
            const buffers = this.buffersFor(item.mesh);
            gl.bindTexture(gl.TEXTURE_2D, this.textureFor(item.mesh));
            gl.uniformMatrix4fv(loc.uModel, false, new Float32Array(item.model));
            gl.uniform1f(loc.uOpacity, itemOpacity2(item.transparency));
            gl.bindVertexArray(buffers.vao);
            gl.drawArrays(gl.TRIANGLES, 0, buffers.count);
          }
          gl.depthMask(true);
          gl.disable(gl.BLEND);
          gl.bindVertexArray(null);
        }
        destroy() {
          const gl = this.gl;
          if (gl) {
            for (const texture of this.textures.values()) gl.deleteTexture(texture);
            for (const buffers of this.buffers.values()) gl.deleteVertexArray(buffers.vao);
            if (this.program) gl.deleteProgram(this.program);
          }
          this.textures.clear();
          this.buffers.clear();
          this.sources.clear();
          this.gl = void 0;
          this.program = void 0;
          this.locations = void 0;
          this.inner.destroy();
        }
      };
    }
  });

  // src/engines/little-3d-engine/renderers/canvas2d-textured.ts
  var canvas2d_textured_exports = {};
  __export(canvas2d_textured_exports, {
    Canvas2DTexturedRenderer: () => Canvas2DTexturedRenderer
  });
  function imageSize(source) {
    if (source instanceof HTMLImageElement) {
      return source.complete && source.naturalWidth > 0 ? { width: source.naturalWidth, height: source.naturalHeight } : void 0;
    }
    if (source instanceof HTMLVideoElement) {
      return source.readyState >= 2 ? { width: source.videoWidth, height: source.videoHeight } : void 0;
    }
    if (source instanceof SVGImageElement) {
      const width = source.width.baseVal.value;
      const height = source.height.baseVal.value;
      return width > 0 && height > 0 ? { width, height } : void 0;
    }
    if (typeof VideoFrame !== "undefined" && source instanceof VideoFrame) {
      return { width: source.displayWidth, height: source.displayHeight };
    }
    const sized = source;
    return sized.width > 0 && sized.height > 0 ? { width: sized.width, height: sized.height } : void 0;
  }
  function drawMappedTriangle(ctx, image, source, target) {
    const [s0, s1, s2] = source;
    const [d0, d1, d2] = target;
    const determinant = s0.x * (s1.y - s2.y) + s1.x * (s2.y - s0.y) + s2.x * (s0.y - s1.y);
    if (Math.abs(determinant) < 1e-8) return;
    const a = (d0.x * (s1.y - s2.y) + d1.x * (s2.y - s0.y) + d2.x * (s0.y - s1.y)) / determinant;
    const c = (d0.x * (s2.x - s1.x) + d1.x * (s0.x - s2.x) + d2.x * (s1.x - s0.x)) / determinant;
    const e = (d0.x * (s1.x * s2.y - s2.x * s1.y) + d1.x * (s2.x * s0.y - s0.x * s2.y) + d2.x * (s0.x * s1.y - s1.x * s0.y)) / determinant;
    const b = (d0.y * (s1.y - s2.y) + d1.y * (s2.y - s0.y) + d2.y * (s0.y - s1.y)) / determinant;
    const d = (d0.y * (s2.x - s1.x) + d1.y * (s0.x - s2.x) + d2.y * (s1.x - s0.x)) / determinant;
    const f = (d0.y * (s1.x * s2.y - s2.x * s1.y) + d1.y * (s2.x * s0.y - s0.x * s2.y) + d2.y * (s0.x * s1.y - s1.x * s0.y)) / determinant;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(d0.x, d0.y);
    ctx.lineTo(d1.x, d1.y);
    ctx.lineTo(d2.x, d2.y);
    ctx.closePath();
    ctx.clip();
    ctx.transform(a, b, c, d, e, f);
    ctx.drawImage(image, 0, 0);
    ctx.restore();
  }
  var Canvas2DTexturedRenderer;
  var init_canvas2d_textured = __esm({
    "src/engines/little-3d-engine/renderers/canvas2d-textured.ts"() {
      "use strict";
      init_math();
      init_renderer();
      init_canvas2d();
      Canvas2DTexturedRenderer = class {
        constructor(options = {}) {
          this.sources = /* @__PURE__ */ new Map();
          this.loaded = /* @__PURE__ */ new Map();
          this.dpr = 1;
          this.inner = new Canvas2DRenderer(options);
        }
        /** Texture every instance of `mesh` with `source`. Call any time, also before init. */
        setTexture(mesh, source) {
          this.sources.set(mesh, source);
          if (typeof source === "string" && !this.loaded.has(source)) {
            const image = new Image();
            image.src = source;
            this.loaded.set(source, image);
          }
        }
        init(canvas) {
          this.inner.init(canvas);
          this.ctx = canvas.getContext("2d") ?? void 0;
        }
        resize(cssWidth, cssHeight, dpr) {
          this.dpr = dpr;
          this.inner.resize(cssWidth, cssHeight, dpr);
        }
        drawable(mesh) {
          const source = this.sources.get(mesh);
          return typeof source === "string" ? this.loaded.get(source) : source;
        }
        render(frame) {
          const plain = frame.items.filter((item) => {
            if (!this.sources.has(item.mesh)) return true;
            const source = this.drawable(item.mesh);
            return !source || !imageSize(source);
          });
          this.inner.render({ ...frame, items: plain });
          const ctx = this.ctx;
          if (!ctx) return;
          ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
          const tinted = /* @__PURE__ */ new Map();
          for (const item of frame.items) {
            const source = this.drawable(item.mesh);
            if (!source) continue;
            const size = imageSize(source);
            if (!size) continue;
            let image = tinted.get(item.mesh);
            if (!image) {
              image = document.createElement("canvas");
              image.width = size.width;
              image.height = size.height;
              const tint = image.getContext("2d");
              if (!tint) continue;
              tint.drawImage(source, 0, 0, size.width, size.height);
              tint.globalCompositeOperation = "source-in";
              tint.fillStyle = item.mesh.faces[0]?.color ?? "#ffffff";
              tint.fillRect(0, 0, size.width, size.height);
              tinted.set(item.mesh, image);
            }
            const world = item.mesh.vertices.map((vertex) => transformAffine(item.model, vertex));
            const projected = world.map((vertex) => {
              const ndc = transformPoint(frame.viewProjection, vertex);
              return { x: (ndc.x * 0.5 + 0.5) * frame.width, y: (1 - (ndc.y * 0.5 + 0.5)) * frame.height };
            });
            const face = item.mesh.faces[0];
            if (!face || face.indices.length !== 4) continue;
            const [a, b, c, d] = face.indices.map((index) => projected[index]);
            ctx.globalAlpha = item.transparency?.mode === "one-sided" ? opacity(item.transparency.opacity, DEFAULT_ONE_SIDED_OPACITY) : 1;
            drawMappedTriangle(ctx, image, [{ x: 0, y: size.height }, { x: size.width, y: size.height }, { x: size.width, y: 0 }], [a, b, c]);
            drawMappedTriangle(ctx, image, [{ x: 0, y: size.height }, { x: size.width, y: 0 }, { x: 0, y: 0 }], [a, c, d]);
          }
          ctx.globalAlpha = 1;
        }
        destroy() {
          this.inner.destroy();
          this.ctx = void 0;
          this.sources.clear();
          this.loaded.clear();
        }
      };
    }
  });

  // <stdin>
  var stdin_exports = {};
  __export(stdin_exports, {
    Camera: () => Camera,
    ChargedOrbAnimation: () => ChargedOrbAnimation,
    CompositeAnimation: () => CompositeAnimation,
    GridAssemblyAnimation: () => GridAssemblyAnimation,
    Light: () => Light,
    Little3dEngine: () => Little3dEngine,
    LittleTweenEngine: () => LittleTweenEngine,
    ObjectMotionAnimation: () => ObjectMotionAnimation,
    ParticlesAnimation: () => ParticlesAnimation,
    SpinAnimation: () => SpinAnimation,
    WebGLTexturedRenderer: () => WebGLTexturedRenderer,
    WebGPUTexturedRenderer: () => WebGPUTexturedRenderer,
    centerAndScaleMesh: () => centerAndScaleMesh,
    chargedOrb: () => chargedOrb,
    circleMotion: () => circleMotion,
    createSpinner: () => createSpinner,
    cross: () => cross,
    crystalComet: () => crystalComet,
    cube: () => cube,
    cubeSphere: () => cubeSphere,
    cubic: () => cubic,
    dot: () => dot,
    ease: () => ease,
    easeInBack: () => easeInBack,
    easeInBounce: () => easeInBounce,
    easeInCirc: () => easeInCirc,
    easeInCubic: () => easeInCubic,
    easeInElastic: () => easeInElastic,
    easeInExpo: () => easeInExpo,
    easeInOutBack: () => easeInOutBack,
    easeInOutBounce: () => easeInOutBounce,
    easeInOutCirc: () => easeInOutCirc,
    easeInOutCubic: () => easeInOutCubic,
    easeInOutElastic: () => easeInOutElastic,
    easeInOutExpo: () => easeInOutExpo,
    easeInOutQuad: () => easeInOutQuad,
    easeInOutQuart: () => easeInOutQuart,
    easeInOutQuint: () => easeInOutQuint,
    easeInOutSine: () => easeInOutSine,
    easeInQuad: () => easeInQuad,
    easeInQuart: () => easeInQuart,
    easeInQuint: () => easeInQuint,
    easeInSine: () => easeInSine,
    easeOutBack: () => easeOutBack,
    easeOutBounce: () => easeOutBounce,
    easeOutCirc: () => easeOutCirc,
    easeOutCubic: () => easeOutCubic,
    easeOutElastic: () => easeOutElastic,
    easeOutExpo: () => easeOutExpo,
    easeOutQuad: () => easeOutQuad,
    easeOutQuart: () => easeOutQuart,
    easeOutQuint: () => easeOutQuint,
    easeOutSine: () => easeOutSine,
    easeTypes: () => easeTypes,
    enterFromObjectDirection: () => enterFromObjectDirection,
    expandToTriangles: () => expandToTriangles,
    figureEightMotion: () => figureEightMotion,
    ghostTrain: () => ghostTrain,
    gridAssembly: () => gridAssembly,
    grow: () => grow,
    icosphere: () => icosphere,
    leaveInObjectDirection: () => leaveInObjectDirection,
    linear: () => linear,
    monochromeStreak: () => monochromeStreak,
    normalize: () => normalize,
    octaSphere: () => octaSphere,
    octahedron: () => octahedron,
    orderRenderItems: () => orderRenderItems,
    parseObj: () => parseObj,
    particleField: () => particleField,
    planeMesh: () => planeMesh,
    planeStarTrail: () => planeStarTrail,
    pulsingStarfield: () => pulsingStarfield,
    pyramid: () => pyramid,
    quad: () => quad,
    quadratic: () => quadratic,
    quartic: () => quartic,
    quintic: () => quintic,
    rocketLaunch: () => rocketLaunch,
    scale: () => scale,
    shineTexture: () => shineTexture,
    shrink: () => shrink,
    squareMotion: () => squareMotion,
    starSwarm: () => starSwarm,
    starTexture: () => starTexture,
    streakTexture: () => streakTexture,
    subtract: () => subtract,
    tetrahedron: () => tetrahedron,
    transform: () => transform,
    uvSphere: () => uvSphere,
    vec3: () => vec3,
    wanderMotion: () => wanderMotion
  });

  // src/index.ts
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

  // src/engines/little-tween-engine/core/tweens.ts
  function input(value, overextend) {
    if (Number.isNaN(value)) return 0;
    if (overextend) return value;
    return Math.min(1, Math.max(0, value));
  }
  function linear(value, overextend = false) {
    return input(value, overextend);
  }
  function quadratic(value, overextend = false) {
    return easeInQuad(value, overextend);
  }
  function cubic(value, overextend = false) {
    return easeInCubic(value, overextend);
  }
  function quartic(value, overextend = false) {
    return easeInQuart(value, overextend);
  }
  function quintic(value, overextend = false) {
    return easeInQuint(value, overextend);
  }
  function easeInSine(value, overextend = false) {
    const x = input(value, overextend);
    return 1 - Math.cos(x * Math.PI / 2);
  }
  function easeOutSine(value, overextend = false) {
    const x = input(value, overextend);
    return Math.sin(x * Math.PI / 2);
  }
  function easeInOutSine(value, overextend = false) {
    const x = input(value, overextend);
    return -(Math.cos(Math.PI * x) - 1) / 2;
  }
  function easeInQuad(value, overextend = false) {
    const x = input(value, overextend);
    return x * x;
  }
  function easeOutQuad(value, overextend = false) {
    const x = input(value, overextend);
    return 1 - (1 - x) * (1 - x);
  }
  function easeInOutQuad(value, overextend = false) {
    const x = input(value, overextend);
    return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
  }
  function easeInCubic(value, overextend = false) {
    const x = input(value, overextend);
    return x * x * x;
  }
  function easeOutCubic(value, overextend = false) {
    const x = input(value, overextend);
    return 1 - Math.pow(1 - x, 3);
  }
  function easeInOutCubic(value, overextend = false) {
    const x = input(value, overextend);
    return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
  }
  function easeInQuart(value, overextend = false) {
    const x = input(value, overextend);
    return x * x * x * x;
  }
  function easeOutQuart(value, overextend = false) {
    const x = input(value, overextend);
    return 1 - Math.pow(1 - x, 4);
  }
  function easeInOutQuart(value, overextend = false) {
    const x = input(value, overextend);
    return x < 0.5 ? 8 * x * x * x * x : 1 - Math.pow(-2 * x + 2, 4) / 2;
  }
  function easeInQuint(value, overextend = false) {
    const x = input(value, overextend);
    return x * x * x * x * x;
  }
  function easeOutQuint(value, overextend = false) {
    const x = input(value, overextend);
    return 1 - Math.pow(1 - x, 5);
  }
  function easeInOutQuint(value, overextend = false) {
    const x = input(value, overextend);
    return x < 0.5 ? 16 * x * x * x * x * x : 1 - Math.pow(-2 * x + 2, 5) / 2;
  }
  function easeInExpo(value, overextend = false) {
    const x = input(value, overextend);
    return x === 0 ? 0 : Math.pow(2, 10 * x - 10);
  }
  function easeOutExpo(value, overextend = false) {
    const x = input(value, overextend);
    return x === 1 ? 1 : 1 - Math.pow(2, -10 * x);
  }
  function easeInOutExpo(value, overextend = false) {
    const x = input(value, overextend);
    return x === 0 ? 0 : x === 1 ? 1 : x < 0.5 ? Math.pow(2, 20 * x - 10) / 2 : (2 - Math.pow(2, -20 * x + 10)) / 2;
  }
  function easeInCirc(value, overextend = false) {
    const x = input(value, overextend);
    return 1 - Math.sqrt(1 - Math.pow(x, 2));
  }
  function easeOutCirc(value, overextend = false) {
    const x = input(value, overextend);
    return Math.sqrt(1 - Math.pow(x - 1, 2));
  }
  function easeInOutCirc(value, overextend = false) {
    const x = input(value, overextend);
    return x < 0.5 ? (1 - Math.sqrt(1 - Math.pow(2 * x, 2))) / 2 : (Math.sqrt(1 - Math.pow(-2 * x + 2, 2)) + 1) / 2;
  }
  function easeInBack(value, overextend = false) {
    const x = input(value, overextend);
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return c3 * x * x * x - c1 * x * x;
  }
  function easeOutBack(value, overextend = false) {
    const x = input(value, overextend);
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
  }
  function easeInOutBack(value, overextend = false) {
    const x = input(value, overextend);
    const c1 = 1.70158;
    const c2 = c1 * 1.525;
    return x < 0.5 ? Math.pow(2 * x, 2) * ((c2 + 1) * 2 * x - c2) / 2 : (Math.pow(2 * x - 2, 2) * ((c2 + 1) * (x * 2 - 2) + c2) + 2) / 2;
  }
  function easeInElastic(value, overextend = false) {
    const x = input(value, overextend);
    const c4 = 2 * Math.PI / 3;
    return x === 0 ? 0 : x === 1 ? 1 : -Math.pow(2, 10 * x - 10) * Math.sin((x * 10 - 10.75) * c4);
  }
  function easeOutElastic(value, overextend = false) {
    const x = input(value, overextend);
    const c4 = 2 * Math.PI / 3;
    return x === 0 ? 0 : x === 1 ? 1 : Math.pow(2, -10 * x) * Math.sin((x * 10 - 0.75) * c4) + 1;
  }
  function easeInOutElastic(value, overextend = false) {
    const x = input(value, overextend);
    const c5 = 2 * Math.PI / 4.5;
    return x === 0 ? 0 : x === 1 ? 1 : x < 0.5 ? -(Math.pow(2, 20 * x - 10) * Math.sin((20 * x - 11.125) * c5)) / 2 : Math.pow(2, -20 * x + 10) * Math.sin((20 * x - 11.125) * c5) / 2 + 1;
  }
  function easeInBounce(value, overextend = false) {
    const x = input(value, overextend);
    return 1 - easeOutBounce(1 - x, true);
  }
  function easeOutBounce(value, overextend = false) {
    let x = input(value, overextend);
    const n1 = 7.5625;
    const d1 = 2.75;
    if (x < 1 / d1) {
      return n1 * x * x;
    }
    if (x < 2 / d1) {
      x -= 1.5 / d1;
      return n1 * x * x + 0.75;
    }
    if (x < 2.5 / d1) {
      x -= 2.25 / d1;
      return n1 * x * x + 0.9375;
    }
    x -= 2.625 / d1;
    return n1 * x * x + 0.984375;
  }
  function easeInOutBounce(value, overextend = false) {
    const x = input(value, overextend);
    return x < 0.5 ? (1 - easeOutBounce(1 - 2 * x, true)) / 2 : (1 + easeOutBounce(2 * x - 1, true)) / 2;
  }
  var easeTypes = {
    linear,
    quadratic,
    cubic,
    quartic,
    quintic,
    easeInSine,
    easeOutSine,
    easeInOutSine,
    easeInQuad,
    easeOutQuad,
    easeInOutQuad,
    easeInCubic,
    easeOutCubic,
    easeInOutCubic,
    easeInQuart,
    easeOutQuart,
    easeInOutQuart,
    easeInQuint,
    easeOutQuint,
    easeInOutQuint,
    easeInExpo,
    easeOutExpo,
    easeInOutExpo,
    easeInCirc,
    easeOutCirc,
    easeInOutCirc,
    easeInBack,
    easeOutBack,
    easeInOutBack,
    easeInElastic,
    easeOutElastic,
    easeInOutElastic,
    easeInBounce,
    easeOutBounce,
    easeInOutBounce
  };
  function ease(type, value, overextend = false) {
    return easeTypes[type](value, overextend);
  }

  // src/progress-animation.ts
  function resolveOptions(options = {}) {
    return {
      popDurationMs: options.popDurationMs ?? 500,
      overextend: options.overextend ?? 0.2,
      startSnapRatio: options.startSnapRatio ?? 0.2,
      loadingText: options.loadingText === void 0 ? "loading" : options.loadingText,
      doneText: options.doneText ?? "done",
      doneFadeDurationMs: options.doneFadeDurationMs ?? 2e3,
      removeOnComplete: options.removeOnComplete ?? false
    };
  }
  function popPhaseT(now, phaseStart, durationMs) {
    if (durationMs <= 0) return 1;
    return Math.min(1, Math.max(0, (now - phaseStart) / durationMs));
  }
  var ProgressAnimation = class {
    constructor(options = {}) {
      this.phase = "idle";
      this.phaseStart = 0;
      this.activeProgress = 0;
      this.popTarget = 0;
      this.doneFadeStart = 0;
      this.options = resolveOptions(options);
    }
    /** Begin the intro pop. Ignored unless idle. */
    enter(now) {
      if (this.phase !== "idle") return;
      this.phase = "startPop";
      this.phaseStart = now;
      this.activeProgress = 0;
      this.popTarget = 0;
    }
    /** Begin the outro pop. Ignored unless mid-intro or active. */
    exit(now) {
      if (this.phase !== "startPop" && this.phase !== "active") return;
      this.phase = "endPop";
      this.phaseStart = now;
    }
    isFinished() {
      return this.phase === "finished";
    }
    update(now, progress, targetProgress) {
      const {
        popDurationMs,
        overextend,
        startSnapRatio,
        loadingText,
        doneText,
        doneFadeDurationMs,
        removeOnComplete
      } = this.options;
      const goal = targetProgress ?? progress;
      if (this.phase === "startPop" || this.phase === "active") {
        this.activeProgress = progress;
        if (this.phase === "startPop") this.popTarget = Math.max(this.popTarget, goal, progress);
      }
      let scale2 = 0;
      let text = null;
      let textOpacity = 0;
      let hidden = false;
      if (this.phase === "startPop") {
        const t = popPhaseT(now, this.phaseStart, popDurationMs);
        const peak = this.popTarget * (1 + overextend);
        if (t < startSnapRatio) {
          const snapT = startSnapRatio > 0 ? t / startSnapRatio : 1;
          scale2 = peak * easeOutExpo(snapT);
        } else {
          const settleT = startSnapRatio < 1 ? (t - startSnapRatio) / (1 - startSnapRatio) : 1;
          scale2 = peak + (this.activeProgress - peak) * easeOutCubic(settleT);
        }
        if (t >= 1) this.phase = "active";
      } else if (this.phase === "active") {
        scale2 = this.activeProgress;
      } else if (this.phase === "endPop") {
        const t = popPhaseT(now, this.phaseStart, popDurationMs);
        const peak = 1 + overextend;
        if (t < 0.5) {
          scale2 = 1 + (peak - 1) * easeOutQuad(t * 2);
        } else {
          scale2 = peak * (1 - easeInQuad((t - 0.5) * 2));
        }
        if (t >= 1) {
          this.phase = "done";
          this.doneFadeStart = now;
          scale2 = 0;
        }
      }
      if (this.phase === "startPop" || this.phase === "active") {
        if (loadingText !== false) {
          text = loadingText;
          textOpacity = 0.65;
        }
      } else if (this.phase === "endPop") {
        text = doneText;
        textOpacity = 0.65;
      } else if (this.phase === "done") {
        const fadeT = popPhaseT(now, this.doneFadeStart, doneFadeDurationMs);
        if (fadeT >= 1) {
          if (removeOnComplete) hidden = true;
          this.phase = "finished";
        } else {
          text = doneText;
          textOpacity = 0.65 * (1 - fadeT);
        }
      }
      return { scale: scale2, text, textOpacity, hidden };
    }
  };

  // src/animations/spin.ts
  var LABEL_STYLE = [
    "position:absolute",
    "inset:0",
    "display:flex",
    "align-items:center",
    "justify-content:center",
    "pointer-events:none",
    "font:600 1.1rem/1.2 system-ui,sans-serif",
    "letter-spacing:0.06em",
    "text-transform:lowercase",
    "color:rgba(255,255,255,0.65)",
    "z-index:1"
  ].join(";");
  function resolveMesh(shape) {
    if (!shape) return cube();
    return typeof shape === "function" ? shape() : shape;
  }
  function applyColor(mesh, color) {
    if (color === void 0 || Array.isArray(color) && color.length === 0) return mesh;
    const pick = Array.isArray(color) ? (i) => color[i % color.length] : () => color;
    return { vertices: mesh.vertices, faces: mesh.faces.map((f, i) => ({ ...f, color: pick(i) })) };
  }
  var SpinAnimation = class {
    constructor(options = {}) {
      this.exited = false;
      this.mesh = applyColor(resolveMesh(options.shape), options.color);
      this.spinX = options.spinX ?? 7e-4;
      this.spinY = options.spinY ?? 11e-4;
      this.backend = options.backend;
      this.transparency = options.transparency;
      this.progress = options.progressAnimation ? new ProgressAnimation(options.progressAnimation) : void 0;
    }
    mount(target) {
      target.style.position = "relative";
      const engine = new Little3dEngine({
        backend: this.backend,
        camera: { position: { x: 0, y: 0, z: 2.8 } }
      });
      this.handle = engine.add(this.mesh, { transparency: this.transparency });
      this.engine = engine;
      engine.mount(target).catch((error) => {
        target.textContent = error instanceof Error ? error.message : String(error);
      });
      if (this.progress) {
        const label = document.createElement("div");
        label.style.cssText = LABEL_STYLE;
        label.setAttribute("aria-hidden", "true");
        label.hidden = true;
        target.appendChild(label);
        this.label = label;
      }
    }
    enter(now) {
      this.progress?.enter(now);
    }
    exit(now) {
      this.exited = true;
      this.progress?.exit(now);
    }
    isFinished() {
      return this.progress ? this.progress.isFinished() : this.exited;
    }
    render(now, frame) {
      if (!this.engine || !this.handle) return;
      const rotation = this.handle.transform.rotation;
      rotation.x = now * this.spinX;
      rotation.y = now * this.spinY;
      if (this.progress) {
        const visual = this.progress.update(now, frame.progress, frame.targetProgress);
        this.handle.transform.scale = visual.hidden ? 0 : visual.scale;
        this.applyLabel(visual);
      } else {
        this.handle.transform.scale = 1;
      }
      this.engine.render();
    }
    destroy() {
      this.label?.remove();
      this.label = void 0;
      this.engine?.destroy();
      this.engine = void 0;
      this.handle = void 0;
    }
    applyLabel(visual) {
      if (!this.label) return;
      if (visual.hidden || visual.text == null) {
        this.label.hidden = true;
        this.label.textContent = "";
        return;
      }
      this.label.hidden = false;
      this.label.textContent = visual.text;
      this.label.style.opacity = String(visual.textOpacity);
    }
  };

  // src/animation-label.ts
  var LABEL_STYLE2 = [
    "position:absolute",
    "inset:0",
    "display:flex",
    "align-items:center",
    "justify-content:center",
    "pointer-events:none",
    "font:700 1.6rem/1 system-ui,sans-serif",
    "letter-spacing:0.02em",
    "color:rgba(255,255,255,0.9)",
    "text-shadow:0 1px 10px rgba(0,0,0,0.6)",
    "z-index:1"
  ].join(";");
  function animationLabelOpacity(now, enterAt, introDurationMs, exitAt, outroDurationMs) {
    if (enterAt === Infinity) return 0;
    const intro = introDurationMs <= 0 ? 1 : Math.max(0, Math.min(1, (now - enterAt) / introDurationMs));
    const outro = exitAt === Infinity ? 1 : outroDurationMs <= 0 ? 0 : Math.max(0, Math.min(1, 1 - (now - exitAt) / outroDurationMs));
    return Math.min(intro, outro);
  }
  function mountAnimationLabel(target, content) {
    var _a;
    const container = document.createElement("div");
    container.style.cssText = LABEL_STYLE2;
    container.setAttribute("role", "status");
    if (typeof content === "string") container.textContent = content;
    else if (content) {
      (_a = content.style).pointerEvents || (_a.pointerEvents = "auto");
      container.appendChild(content);
    }
    target.appendChild(container);
    return {
      container,
      setText(value) {
        if (typeof content !== "object") container.textContent = value;
      },
      setOpacity(value) {
        container.style.opacity = String(value);
      }
    };
  }

  // src/animations/object-motion.ts
  init_math();

  // src/motion/transitions.ts
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
  function resolveDirection(input2, fallback) {
    return normalizeVector(fallback ?? input2.direction ?? input2.velocity ?? { x: 1, y: 0, z: 0 });
  }
  function easeOutBack2(delta) {
    const c = 1.70158;
    const u = delta - 1;
    return 1 + (c + 1) * u * u * u + c * u * u;
  }
  function joinVelocity(input2, options, durationMs) {
    const inputSpeed = input2.velocity ? vectorLength(input2.velocity) : 0;
    if (input2.velocity && inputSpeed > 1e-6 && !options.direction) {
      return input2.velocity;
    }
    const distance = options.distance ?? DEFAULT_DISTANCE;
    return scaleVector(resolveDirection(input2, options.direction), distance / durationMs);
  }
  function enterFromObjectDirection(options = {}) {
    return (input2) => {
      const durationMs = Math.max(1, input2.durationMs);
      const velocity = joinVelocity(input2, options, durationMs);
      const remaining = durationMs - input2.elapsedMs;
      return { position: add(input2.position, scaleVector(velocity, -remaining)) };
    };
  }
  function leaveInObjectDirection(options = {}) {
    return (input2) => {
      const durationMs = Math.max(1, input2.durationMs);
      const velocity = joinVelocity(input2, options, durationMs);
      return { position: add(input2.position, scaleVector(velocity, input2.elapsedMs)) };
    };
  }
  function grow() {
    return (input2) => ({ size: (input2.size ?? 1) * easeOutBack2(input2.delta) });
  }
  function shrink() {
    return (input2) => ({ size: (input2.size ?? 1) * (1 - input2.delta * input2.delta) });
  }

  // src/animations/object-motion.ts
  var WORLD_UP = { x: 0, y: 1, z: 0 };
  var DEFAULT_INTRO_MS = 2100;
  var DEFAULT_OUTRO_MS = 2100;
  var BANK_GAIN = 26;
  var BANK_LIMIT = 0.7;
  var BANK_SMOOTH = 0.12;
  var SAMPLE_MS = 8;
  var FACE_FORWARD = {
    "+x": (v) => v,
    "-x": (v) => ({ x: -v.x, y: v.y, z: -v.z }),
    "+z": (v) => ({ x: v.z, y: v.y, z: -v.x }),
    "-z": (v) => ({ x: -v.z, y: v.y, z: v.x }),
    "+y": (v) => ({ x: v.y, y: -v.x, z: v.z }),
    "-y": (v) => ({ x: -v.y, y: v.x, z: v.z })
  };
  function add2(a, b) {
    return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z };
  }
  function resolveMesh2(mesh) {
    return typeof mesh === "function" ? mesh() : mesh;
  }
  function applyColor2(mesh, color) {
    if (color === void 0) return mesh;
    return { vertices: mesh.vertices, faces: mesh.faces.map((face) => ({ ...face, color })) };
  }
  function faceForward(mesh, facing) {
    if (facing === "+x") return mesh;
    const turn = FACE_FORWARD[facing];
    return { vertices: mesh.vertices.map(turn), faces: mesh.faces };
  }
  function centerAndScaleMesh(mesh, targetSize) {
    let minX = Infinity;
    let minY = Infinity;
    let minZ = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    let maxZ = -Infinity;
    for (const vertex of mesh.vertices) {
      minX = Math.min(minX, vertex.x);
      minY = Math.min(minY, vertex.y);
      minZ = Math.min(minZ, vertex.z);
      maxX = Math.max(maxX, vertex.x);
      maxY = Math.max(maxY, vertex.y);
      maxZ = Math.max(maxZ, vertex.z);
    }
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    const centerZ = (minZ + maxZ) / 2;
    const extent = Math.max(maxX - minX, maxY - minY, maxZ - minZ) || 1;
    const factor = targetSize / extent;
    return {
      vertices: mesh.vertices.map((vertex) => ({
        x: (vertex.x - centerX) * factor,
        y: (vertex.y - centerY) * factor,
        z: (vertex.z - centerZ) * factor
      })),
      faces: mesh.faces
    };
  }
  function orientationFor(forward, bank) {
    const fwd = normalize(forward);
    let right = cross(fwd, WORLD_UP);
    if (Math.hypot(right.x, right.y, right.z) < 1e-4) right = { x: 0, y: 0, z: 1 };
    right = normalize(right);
    const levelUp = cross(right, fwd);
    const up = add2(scale(levelUp, Math.cos(bank)), scale(right, Math.sin(bank)));
    const w = normalize(cross(fwd, up));
    return {
      x: Math.atan2(cross(w, fwd).z, w.z),
      y: Math.asin(Math.max(-1, Math.min(1, -fwd.z))),
      z: Math.atan2(fwd.y, fwd.x)
    };
  }
  function rotationMatrix(x, y, z) {
    return multiply(rotationZ(z), multiply(rotationY(y), rotationX(x)));
  }
  function eulerFromRotationMatrix(matrix) {
    const sy = Math.hypot(matrix[0], matrix[1]);
    if (sy > 1e-6) {
      return {
        x: Math.atan2(matrix[9], matrix[10]),
        y: Math.asin(Math.max(-1, Math.min(1, -matrix[8]))),
        z: Math.atan2(matrix[4], matrix[0])
      };
    }
    return {
      x: Math.atan2(-matrix[6], matrix[5]),
      y: Math.asin(Math.max(-1, Math.min(1, -matrix[8]))),
      z: 0
    };
  }
  function combineLocalRotation(path, extra) {
    return eulerFromRotationMatrix(
      multiply(rotationMatrix(path.x, path.y, path.z), rotationMatrix(extra.x, extra.y, extra.z))
    );
  }
  function clamp013(value) {
    return Math.max(0, Math.min(1, value));
  }
  function motionVectorAt(motion, t) {
    return scale(subtract(motion.positionAt(t + 1), motion.positionAt(t - 1)), 0.5);
  }
  function resolveDirection2(velocity, fallback) {
    return Math.hypot(velocity.x, velocity.y, velocity.z) > 1e-6 ? normalize(velocity) : fallback;
  }
  function resolveTransition(config, fallback, durationMs) {
    if (!config) return { transition: fallback, durationMs };
    if (typeof config === "function") return { transition: config, durationMs };
    return { transition: config.transition, durationMs: Math.max(0, config.durationMs ?? durationMs) };
  }
  var ObjectMotionAnimation = class {
    constructor(options) {
      this.handles = [];
      this.banks = [];
      this.headings = [];
      this.started = false;
      this.finished = false;
      this.introStart = 0;
      this.outroStart = Infinity;
      this.outroPosition = { x: 0, y: 0, z: 0 };
      this.outroVelocity = { x: 0, y: 0, z: 0 };
      this.outroDirection = { x: 1, y: 0, z: 0 };
      const centered = centerAndScaleMesh(resolveMesh2(options.mesh), options.size ?? 1);
      const facing = faceForward(centered, options.facing ?? "+x");
      this.mesh = applyColor2(facing, options.color);
      this.motion = options.motion;
      this.backend = options.backend;
      this.transparency = options.transparency;
      this.labelContent = options.label;
      this.fadeLabel = options.fadeLabel ?? true;
      this.tailCount = Math.max(0, Math.floor(options.tail?.count ?? 0));
      this.tailGap = Math.max(0, options.tail?.gapMs ?? 0);
      this.intro = resolveTransition(options.intro, enterFromObjectDirection(), DEFAULT_INTRO_MS);
      this.outro = resolveTransition(options.outro, leaveInObjectDirection(), DEFAULT_OUTRO_MS);
      const rotation = options.rotation;
      this.rotationOffset = { x: rotation?.x ?? 0, y: rotation?.y ?? 0, z: rotation?.z ?? 0 };
      this.rotationSpin = {
        x: rotation?.spinX ?? 0,
        y: rotation?.spinY ?? 0,
        z: rotation?.spinZ ?? 0
      };
      this.hasExtraRotation = this.rotationOffset.x !== 0 || this.rotationOffset.y !== 0 || this.rotationOffset.z !== 0 || this.rotationSpin.x !== 0 || this.rotationSpin.y !== 0 || this.rotationSpin.z !== 0;
    }
    mount(target) {
      if (!target.style.position) target.style.position = "relative";
      const engine = new Little3dEngine({
        backend: this.backend,
        camera: { position: { x: 0, y: 0, z: 3 } }
      });
      for (let i = 0; i <= this.tailCount; i++) {
        this.handles.push(engine.add(this.mesh, { transparency: this.transparency }));
        this.banks.push(0);
        this.headings.push({ x: 1, y: 0, z: 0 });
      }
      this.engine = engine;
      engine.mount(target).catch((error) => {
        target.textContent = error instanceof Error ? error.message : String(error);
      });
      this.label = mountAnimationLabel(target, this.labelContent);
      if (this.fadeLabel) this.label.setOpacity(0);
    }
    enter(now) {
      if (this.started) return;
      this.started = true;
      this.introStart = now;
    }
    exit(now) {
      if (!this.started || this.outroStart !== Infinity) return;
      this.outroPosition = this.motion.positionAt(now);
      this.outroVelocity = motionVectorAt(this.motion, now);
      this.outroDirection = resolveDirection2(this.outroVelocity, this.headings[0]);
      this.outroStart = now;
    }
    isFinished() {
      return this.finished;
    }
    /** Milliseconds the fly-out takes; used to align a following particle trail's outro. */
    get outroDurationMs() {
      return this.outro.durationMs;
    }
    /**
     * A {@link MotionController} that follows the object's *actual* position, including
     * the intro fly-in and outro fly-out (it falls back to the raw motion path before
     * {@link enter} and once idle). Feed it to a particle layer's `emitter` so the
     * particles trail the object through its transitions instead of the bare path.
     */
    trailEmitter() {
      return { positionAt: (t) => this.sampleAt(t)?.position ?? this.motion.positionAt(t) };
    }
    render(now, frame) {
      if (!this.engine || !this.label) return;
      if (this.outroStart !== Infinity && now >= this.outroStart + this.outro.durationMs + this.tailCount * this.tailGap) {
        this.finished = true;
      }
      for (let k = 0; k < this.handles.length; k++) {
        const transform2 = this.handles[k].transform;
        const t = now - k * this.tailGap;
        const sample = this.sampleAt(t);
        if (!sample) {
          transform2.scale = 0;
          continue;
        }
        transform2.scale = sample.size;
        let euler = sample.orientation;
        if (!euler) {
          const heading = subtract(this.positionAt(t + SAMPLE_MS) ?? sample.position, sample.position);
          if (Math.hypot(heading.x, heading.y, heading.z) > 1e-5) {
            this.headings[k] = normalize(heading);
          }
          const ahead = this.aheadAt(t) ?? this.headings[k];
          const targetBank = Math.max(
            -BANK_LIMIT,
            Math.min(BANK_LIMIT, cross(this.headings[k], ahead).y * BANK_GAIN)
          );
          this.banks[k] += (targetBank - this.banks[k]) * BANK_SMOOTH;
          euler = orientationFor(this.headings[k], this.banks[k]);
        }
        if (this.hasExtraRotation) {
          euler = combineLocalRotation(euler, {
            x: this.rotationOffset.x + this.rotationSpin.x * t,
            y: this.rotationOffset.y + this.rotationSpin.y * t,
            z: this.rotationOffset.z + this.rotationSpin.z * t
          });
        }
        transform2.position.x = sample.position.x;
        transform2.position.y = sample.position.y;
        transform2.position.z = sample.position.z;
        transform2.rotation.x = euler.x;
        transform2.rotation.y = euler.y;
        transform2.rotation.z = euler.z;
      }
      this.label.setText(frame.indeterminate ? typeof this.labelContent === "string" ? this.labelContent : "" : `${Math.round(frame.progress * 100)}%`);
      if (this.fadeLabel) {
        this.label.setOpacity(animationLabelOpacity(
          now,
          this.started ? this.introStart : Infinity,
          this.intro.durationMs,
          this.outroStart,
          this.outro.durationMs
        ));
      }
      this.engine.render();
    }
    destroy() {
      this.label?.container.remove();
      this.label = void 0;
      this.engine?.destroy();
      this.engine = void 0;
      this.handles.length = 0;
    }
    aheadAt(t) {
      const next = this.positionAt(t + SAMPLE_MS);
      const afterNext = this.positionAt(t + 2 * SAMPLE_MS);
      if (!next || !afterNext) return void 0;
      const ahead = subtract(afterNext, next);
      if (Math.hypot(ahead.x, ahead.y, ahead.z) <= 1e-5) return void 0;
      return normalize(ahead);
    }
    positionAt(t) {
      return this.sampleAt(t)?.position;
    }
    sampleAt(t) {
      if (!this.started || t < this.introStart) return void 0;
      if (t < this.introStart + this.intro.durationMs) {
        return this.transitionSample("intro", t, this.intro, this.introStart);
      }
      if (this.outroStart !== Infinity) {
        if (t > this.outroStart + this.outro.durationMs) return void 0;
        if (t >= this.outroStart) return this.transitionSample("outro", t, this.outro, this.outroStart);
      }
      return { position: this.motion.positionAt(t), size: 1 };
    }
    transitionSample(phase, t, transition, start) {
      const elapsedMs = Math.max(0, t - start);
      const delta = transition.durationMs === 0 ? 1 : clamp013(elapsedMs / transition.durationMs);
      const input2 = this.transitionInput(phase, delta, elapsedMs, transition.durationMs, start);
      const output = transition.transition(input2);
      return this.applyTransitionOutput(input2, output, phase, t);
    }
    transitionInput(phase, delta, elapsedMs, durationMs, start) {
      if (phase === "intro") {
        const handoff = start + durationMs;
        const velocity = motionVectorAt(this.motion, handoff);
        return {
          delta,
          position: this.motion.positionAt(handoff),
          direction: resolveDirection2(velocity, { x: 1, y: 0, z: 0 }),
          velocity,
          size: 1,
          durationMs,
          elapsedMs,
          phase
        };
      }
      return {
        delta,
        position: this.outroPosition,
        direction: this.outroDirection,
        velocity: this.outroVelocity,
        size: 1,
        durationMs,
        elapsedMs,
        phase
      };
    }
    applyTransitionOutput(input2, output, phase, t) {
      return {
        position: output.position ?? (phase === "intro" ? this.motion.positionAt(t) : input2.position),
        size: output.size ?? input2.size ?? 1,
        orientation: output.orientation
      };
    }
  };

  // src/animations/particles.ts
  var DEFAULT_COLORS11 = ["#fde047", "#fb923c", "#f472b6", "#60a5fa"];
  var FADE_IN_END = 0.15;
  var FADE_OUT_START = 0.6;
  function rand01(seed, index, salt) {
    let h = (seed ^ Math.imul(index + 1, 2654435769) ^ Math.imul(salt + 1, 2246822507)) >>> 0;
    h = Math.imul(h ^ h >>> 16, 73244475);
    h = Math.imul(h ^ h >>> 16, 73244475);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  }
  function smoothstep(edge0, edge1, value) {
    const x = Math.max(0, Math.min(1, (value - edge0) / (edge1 - edge0)));
    return x * x * (3 - 2 * x);
  }
  function positiveFinite(value, name) {
    if (!Number.isFinite(value) || value <= 0) {
      throw new RangeError(`3d-spinner: ${name} must be a finite number greater than zero.`);
    }
    return value;
  }
  function emitBasis(direction) {
    const d = normalize(direction);
    const helper = Math.abs(d.y) < 0.99 ? { x: 0, y: 1, z: 0 } : { x: 1, y: 0, z: 0 };
    const right = normalize(cross(helper, d));
    return { d, right, up: cross(d, right) };
  }
  function particleField(options = {}) {
    const rate = positiveFinite(options.rate ?? 20, "rate");
    const lifeMs = positiveFinite(options.lifeMs ?? 1800, "lifeMs");
    const size = options.size ?? 0.16;
    const speed = options.speed ?? 0.6;
    const gravity = options.gravity;
    const spread = options.spread ?? 0.5;
    const peak = Math.max(0, Math.min(1, options.opacity ?? 0.9));
    const spin = options.spin ?? 2e-3;
    const alignToMotion = options.alignToMotion ?? false;
    const seed = options.seed ?? 1;
    const basis = options.direction && emitBasis(options.direction);
    const spawnGapMs = 1e3 / rate;
    const directionOf = (index) => {
      const u = rand01(seed, index, 0);
      const phi = 2 * Math.PI * rand01(seed, index, 1);
      if (!basis) {
        const z = 2 * u - 1;
        const r = Math.sqrt(Math.max(0, 1 - z * z));
        return { x: r * Math.cos(phi), y: r * Math.sin(phi), z };
      }
      const cos = 1 - u * (1 - Math.cos(spread));
      const sin = Math.sqrt(Math.max(0, 1 - cos * cos));
      const { d, right, up } = basis;
      return {
        x: d.x * cos + (right.x * Math.cos(phi) + up.x * Math.sin(phi)) * sin,
        y: d.y * cos + (right.y * Math.cos(phi) + up.y * Math.sin(phi)) * sin,
        z: d.z * cos + (right.z * Math.cos(phi) + up.z * Math.sin(phi)) * sin
      };
    };
    return {
      maxLive: Math.ceil(lifeMs * rate / 1e3) + 1,
      spawnGapMs,
      lifeMs,
      sample(index, t) {
        if (index < 0) return void 0;
        const age = t - index * spawnGapMs;
        if (age < 0 || age >= lifeMs) return void 0;
        const seconds = age / 1e3;
        const dir = directionOf(index);
        const particleSpeed = speed * (0.6 + 0.8 * rand01(seed, index, 2));
        const travel = particleSpeed * seconds;
        const pull = gravity ? 0.5 * seconds * seconds : 0;
        const life = age / lifeMs;
        const roll = alignToMotion ? Math.atan2(
          dir.y * particleSpeed + (gravity?.y ?? 0) * seconds,
          dir.x * particleSpeed + (gravity?.x ?? 0) * seconds
        ) : 2 * Math.PI * rand01(seed, index, 3) + (2 * rand01(seed, index, 4) - 1) * spin * age;
        return {
          position: {
            x: dir.x * travel + (gravity ? gravity.x * pull : 0),
            y: dir.y * travel + (gravity ? gravity.y * pull : 0),
            z: dir.z * travel + (gravity ? gravity.z * pull : 0)
          },
          roll,
          size: size * (0.7 + 0.6 * rand01(seed, index, 5)),
          opacity: peak * smoothstep(0, FADE_IN_END, life) * (1 - smoothstep(FADE_OUT_START, 1, life))
        };
      }
    };
  }
  var ParticlesAnimation = class {
    constructor(options = {}) {
      this.handles = [];
      this.fades = [];
      this.enterAt = Infinity;
      this.exitAt = Infinity;
      this.finished = false;
      this.field = particleField(options);
      this.colors = options.colors ?? DEFAULT_COLORS11;
      this.backend = options.backend;
      this.texture = options.texture;
      this.labelContent = options.label;
      this.fadeLabel = options.fadeLabel ?? true;
      this.emitter = options.emitter;
      this.outroMs = Math.max(0, options.outroMs ?? 0);
    }
    mount(target) {
      if (!target.style.position) target.style.position = "relative";
      const meshes = this.colors.map((color) => quad(1, [color]));
      const texture = this.texture;
      const backend = texture ? async (rendererOptions) => {
        const renderer = this.backend === "webgpu" ? new (await Promise.resolve().then(() => (init_webgpu_textured(), webgpu_textured_exports))).WebGPUTexturedRenderer(rendererOptions) : this.backend === "webgl" ? new (await Promise.resolve().then(() => (init_webgl_textured(), webgl_textured_exports))).WebGLTexturedRenderer(rendererOptions) : new (await Promise.resolve().then(() => (init_canvas2d_textured(), canvas2d_textured_exports))).Canvas2DTexturedRenderer(rendererOptions);
        for (const mesh of meshes) renderer.setTexture(mesh, texture);
        return renderer;
      } : this.backend;
      const engine = new Little3dEngine({
        backend,
        camera: { position: { x: 0, y: 0, z: 3 } },
        light: { intensity: 0, ambient: 1 }
      });
      for (let slot = 0; slot < this.field.maxLive; slot++) {
        const fade = { mode: "one-sided", opacity: 0 };
        this.fades.push(fade);
        this.handles.push(engine.add(meshes[slot % meshes.length], { scale: 0, transparency: fade }));
      }
      this.engine = engine;
      engine.mount(target).catch((error) => {
        target.textContent = error instanceof Error ? error.message : String(error);
      });
      this.label = mountAnimationLabel(target, this.labelContent);
      if (this.fadeLabel) this.label.setOpacity(0);
    }
    enter(now) {
      if (this.enterAt === Infinity) this.enterAt = now;
    }
    exit(now) {
      if (this.exitAt === Infinity) this.exitAt = now;
    }
    isFinished() {
      return this.finished;
    }
    render(now, frame) {
      if (!this.engine || !this.label) return;
      if (this.exitAt !== Infinity && now >= this.exitAt + this.outroMs + this.field.lifeMs) this.finished = true;
      for (const handle of this.handles) handle.transform.scale = 0;
      if (this.enterAt !== Infinity) {
        const t = now - this.enterAt;
        const gap = this.field.spawnGapMs;
        let first = Math.max(0, Math.ceil((t - this.field.lifeMs) / gap));
        let last = Math.floor(t / gap);
        if (this.exitAt !== Infinity) {
          last = Math.min(last, Math.floor((this.exitAt - this.enterAt + this.outroMs) / gap));
        }
        first = Math.max(first, last - this.field.maxLive + 1);
        for (let index = first; index <= last; index++) {
          const sample = this.field.sample(index, t);
          if (!sample) continue;
          const slot = index % this.handles.length;
          const transform2 = this.handles[slot].transform;
          const origin = this.emitter?.positionAt(this.enterAt + index * gap);
          transform2.position.x = sample.position.x + (origin?.x ?? 0);
          transform2.position.y = sample.position.y + (origin?.y ?? 0);
          transform2.position.z = sample.position.z + (origin?.z ?? 0);
          transform2.rotation.z = sample.roll;
          transform2.scale = sample.size;
          this.fades[slot].opacity = sample.opacity;
        }
      }
      this.label.setText(frame.indeterminate ? typeof this.labelContent === "string" ? this.labelContent : "" : `${Math.round(frame.progress * 100)}%`);
      if (this.fadeLabel) {
        this.label.setOpacity(animationLabelOpacity(
          now,
          this.enterAt,
          this.field.lifeMs * FADE_IN_END,
          this.exitAt,
          this.field.lifeMs
        ));
      }
      this.engine.render();
    }
    destroy() {
      this.label?.container.remove();
      this.label = void 0;
      this.engine?.destroy();
      this.engine = void 0;
      this.handles.length = 0;
      this.fades.length = 0;
    }
  };

  // src/animations/charged-orb.ts
  var MINIS = 10;
  var CAMERA_Z = 3;
  var CENTER_SCALE = 0.76;
  var MINI_SCALE = 0.36;
  var MINI_TRANSPARENCY = { mode: "two-sided", frontOpacity: 0.68, backOpacity: 0.87 };
  var ORBIT_RADIUS = 1.2;
  var TILT = 0.8;
  var TWO_PI = Math.PI * 2;
  var CENTER_POP_MS = 500;
  var LAUNCH_MS = 550;
  var EXIT_HURRY = 2.5;
  var SPREAD_TAU_MS = 250;
  var EXTRA_PAUSE_MS = 250;
  var EXTRA_SPIN_MS = 1300;
  var REENTER_MS = 600;
  var REENTER_STAGGER_MS = 45;
  var CENTER_POP_OUT_AT = REENTER_MS + (MINIS - 1) * REENTER_STAGGER_MS + 150;
  var CENTER_POP_OUT_MS = 420;
  var PARKED = { x: 0, y: 0, z: 50 };
  var CENTER_COLORS = ["#67e8f9", "#22d3ee", "#0ea5e9", "#38bdf8", "#7dd3fc"];
  var MINI_COLORS = [
    ["#e0f2fe", "#bae6fd", "#7dd3fc"],
    ["#c7d2fe", "#a5b4fc", "#818cf8"],
    ["#a5f3fc", "#67e8f9", "#22d3ee"]
  ];
  function clamp014(value) {
    return Math.max(0, Math.min(1, value));
  }
  var ChargedOrbAnimation = class {
    constructor(options = {}) {
      this.minis = [];
      this.blends = new Array(MINIS).fill(0);
      this.offsets = new Array(MINIS).fill(0);
      this.enterAt = Infinity;
      this.exitAt = Infinity;
      this.allOutAt = Infinity;
      this.lastNow = 0;
      this.finished = false;
      this.orbitPeriodMs = options.orbitPeriodMs ?? 6e3;
      this.backend = options.backend;
    }
    mount(target) {
      if (!target.style.position) target.style.position = "relative";
      const engine = new Little3dEngine({
        backend: this.backend,
        camera: { position: { x: 0, y: 0, z: CAMERA_Z } }
      });
      this.center = engine.add(icosphere(1, 2, CENTER_COLORS), { scale: 0 });
      for (let i = 0; i < MINIS; i++) {
        const mesh = icosphere(1, 1, MINI_COLORS[i % MINI_COLORS.length]);
        this.minis.push(engine.add(mesh, { scale: 0, transparency: { ...MINI_TRANSPARENCY } }));
      }
      this.engine = engine;
      engine.mount(target).catch((error) => {
        target.textContent = error instanceof Error ? error.message : String(error);
      });
    }
    enter(now) {
      if (this.enterAt === Infinity) this.enterAt = now;
    }
    exit(now) {
      if (this.exitAt === Infinity) this.exitAt = now;
    }
    isFinished() {
      return this.finished;
    }
    /** Milliseconds after {@link exit} during which the satellites are still flying. */
    get outroEmitMs() {
      return EXTRA_PAUSE_MS + EXTRA_SPIN_MS + CENTER_POP_OUT_AT;
    }
    /**
     * A {@link MotionController} that cycles across the live satellites, one
     * spawn slot per orb, so a particle layer emits one stream per satellite.
     * `spawnGapMs` must match the particle layer's emission gap (`1000 / rate`).
     */
    satelliteEmitter(spawnGapMs) {
      return {
        positionAt: (t) => {
          const live = [];
          for (let i = 0; i < MINIS; i++) {
            const sample = this.miniSample(i, t);
            if (sample) live.push(sample.position);
          }
          if (live.length === 0) return PARKED;
          const slot = Math.abs(Math.floor(t / spawnGapMs)) % live.length;
          return live[slot];
        }
      };
    }
    render(now, frame) {
      if (!this.engine || !this.center) return;
      if (this.enterAt === Infinity) {
        this.center.transform.scale = 0;
        for (const mini of this.minis) mini.transform.scale = 0;
        this.engine.render();
        return;
      }
      const dt = this.lastNow === 0 ? 16 : Math.min(50, now - this.lastNow);
      this.lastNow = now;
      this.updateBlends(dt, frame.progress, now);
      this.updateSpread(dt);
      const t = now - this.enterAt;
      this.center.transform.scale = this.centerScale(now, t);
      this.center.transform.rotation.x = t * 2e-4;
      this.center.transform.rotation.y = t * 5e-4;
      for (let i = 0; i < MINIS; i++) {
        const transform2 = this.minis[i].transform;
        const sample = this.miniSample(i, now);
        if (!sample) {
          transform2.scale = 0;
          continue;
        }
        transform2.position.x = sample.position.x;
        transform2.position.y = sample.position.y;
        transform2.position.z = sample.position.z;
        transform2.scale = sample.scale;
        transform2.rotation.y = t * 12e-4;
      }
      this.engine.render();
    }
    destroy() {
      this.engine?.destroy();
      this.engine = void 0;
      this.center = void 0;
      this.minis.length = 0;
    }
    updateBlends(dt, progress, now) {
      const exiting = this.exitAt !== Infinity;
      const want = exiting ? MINIS : Math.min(MINIS, Math.floor(progress * MINIS + 1e-9));
      const rate = dt / LAUNCH_MS * (exiting ? EXIT_HURRY : 1);
      for (let i = 0; i < MINIS; i++) {
        const target = i < want ? 1 : 0;
        const blend = this.blends[i];
        if (target > blend && (i === 0 || this.blends[i - 1] >= 0.6)) {
          this.blends[i] = Math.min(1, blend + rate);
          if (blend === 0) this.offsets[i] = this.slotAngle(i);
        } else if (target < blend && (i === MINIS - 1 || this.blends[i + 1] <= 0.4)) {
          this.blends[i] = Math.max(0, blend - rate);
        }
      }
      if (exiting && this.allOutAt === Infinity && this.blends.every((blend) => blend >= 1)) {
        this.allOutAt = now;
      }
    }
    updateSpread(dt) {
      const ease2 = 1 - Math.exp(-dt / SPREAD_TAU_MS);
      for (let i = 0; i < MINIS; i++) {
        if (this.blends[i] <= 0) continue;
        this.offsets[i] += (this.slotAngle(i) - this.offsets[i]) * ease2;
      }
    }
    slotAngle(index) {
      const launched = Math.max(1, this.blends.filter((blend) => blend > 0).length);
      return TWO_PI * Math.min(index, launched - 1) / launched;
    }
    baseAngleAt(t) {
      let angle = -TWO_PI * (t - this.enterAt) / this.orbitPeriodMs;
      if (this.allOutAt !== Infinity) {
        const u = clamp014((t - this.allOutAt - EXTRA_PAUSE_MS) / EXTRA_SPIN_MS);
        angle -= TWO_PI * easeInOutCubic(u);
      }
      return angle;
    }
    reenterStart() {
      return this.allOutAt + EXTRA_PAUSE_MS + EXTRA_SPIN_MS;
    }
    miniSample(index, t) {
      const blend = this.blends[index];
      if (blend <= 0) return void 0;
      let radial = easeOutCubic(blend);
      let scale2 = MINI_SCALE * easeOutBack(blend);
      if (this.allOutAt !== Infinity) {
        const start = this.reenterStart() + index * REENTER_STAGGER_MS;
        const pull = easeInCubic(clamp014((t - start) / REENTER_MS));
        if (pull >= 1) return void 0;
        radial *= 1 - pull;
        scale2 *= 1 - pull;
      }
      const angle = this.baseAngleAt(t) + this.offsets[index];
      const flat = Math.sin(angle) * ORBIT_RADIUS * radial;
      return {
        position: {
          x: Math.cos(angle) * ORBIT_RADIUS * radial,
          y: flat * Math.cos(TILT),
          z: flat * Math.sin(TILT)
        },
        scale: scale2
      };
    }
    centerScale(now, t) {
      if (this.allOutAt !== Infinity) {
        const w = clamp014((now - this.reenterStart() - CENTER_POP_OUT_AT) / CENTER_POP_OUT_MS);
        if (w >= 1) {
          this.finished = true;
          return 0;
        }
        if (w > 0) {
          return CENTER_SCALE * (w < 0.35 ? 1 + 0.18 * easeOutQuad(w / 0.35) : 1.18 * (1 - easeInQuad((w - 0.35) / 0.65)));
        }
      }
      return CENTER_SCALE * easeOutBack(clamp014(t / CENTER_POP_MS));
    }
  };

  // src/animations/grid-assembly.ts
  var GRID = 5;
  var COUNT = GRID * GRID;
  var CAMERA_Z2 = 4;
  var FOV = 55 * Math.PI / 180;
  var TWO_PI2 = Math.PI * 2;
  var INTRO_MS = 900;
  var INTRO_STAGGER_MS = 60;
  var INTRO_DONE_MS = (COUNT - 1) * INTRO_STAGGER_MS + INTRO_MS;
  var GATE_DOCK = 0.35;
  var GATE_UNDOCK = 0.65;
  var EXIT_HURRY2 = 2.5;
  var SPIN_EVERY_MS = 2e3;
  var SPIN_MS = 380;
  var SPIN_STAGGER_MS = 80;
  var HOLD_MS = 1e3;
  var COLLAPSE_MS = 700;
  var COLLAPSE_SPREAD_MS = 500;
  var POP_MS = 170;
  var LABEL_FADE_MS = 600;
  var CUBE_COLORS = ["#8397c6", "#7186b8", "#6176a8", "#93a6cf", "#556a9c", "#7a8fc0"];
  var DEFAULT_MESHES = [() => cube(1, CUBE_COLORS)];
  function clamp015(value) {
    return Math.max(0, Math.min(1, value));
  }
  function smooth01(value) {
    const x = clamp015(value);
    return x * x * (3 - 2 * x);
  }
  function resolveMesh3(mesh) {
    return typeof mesh === "function" ? mesh() : mesh;
  }
  function wrapAngle(angle) {
    const wrapped = angle - TWO_PI2 * Math.floor(angle / TWO_PI2);
    return wrapped > Math.PI ? wrapped - TWO_PI2 : wrapped;
  }
  function hash01(index, salt) {
    let h = (Math.imul(index + 1, 2654435769) ^ Math.imul(salt + 1, 2246822507)) >>> 0;
    h = Math.imul(h ^ h >>> 16, 73244475);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  }
  var GridAssemblyAnimation = class {
    constructor(options = {}) {
      this.handles = [];
      this.blends = new Array(COUNT).fill(0);
      this.dockedAt = new Array(COUNT).fill(Infinity);
      this.tumbleX = [];
      this.tumbleY = [];
      this.collapseDelay = [];
      this.popStarted = new Array(COUNT).fill(false);
      this.maxCollapseDelay = 0;
      this.fades = [];
      this.slots = [];
      this.aspect = 16 / 9;
      this.enterAt = Infinity;
      this.exitAt = Infinity;
      this.allDockedAt = Infinity;
      this.collapseAt = Infinity;
      this.lastNow = 0;
      this.finished = false;
      const sources = options.meshes && options.meshes.length > 0 ? options.meshes : DEFAULT_MESHES;
      this.meshes = sources.map(resolveMesh3);
      this.size = options.size ?? 0.34;
      this.orbitPeriodMs = options.orbitPeriodMs ?? 9e3;
      this.dockMs = options.dockMs ?? 800;
      this.backend = options.backend;
      this.labelContent = options.label;
      this.fadeLabel = options.fadeLabel ?? true;
      const spacing = this.size + (options.gap ?? 0.12);
      for (let i = 0; i < COUNT; i++) {
        const row = Math.floor(i / GRID);
        const col = i % GRID;
        this.slots.push({ x: (col - 2) * spacing, y: (2 - row) * spacing, z: 0 });
        this.tumbleX.push(TWO_PI2 * hash01(i, 2) - Math.PI);
        this.tumbleY.push(TWO_PI2 * hash01(i, 4) - Math.PI);
        this.collapseDelay.push(hash01(i, 7) * COLLAPSE_SPREAD_MS);
      }
      this.maxCollapseDelay = Math.max(...this.collapseDelay);
    }
    mount(target) {
      if (!target.style.position) target.style.position = "relative";
      const engine = new Little3dEngine({
        backend: this.backend,
        camera: { position: { x: 0, y: 0, z: CAMERA_Z2 }, fov: FOV }
      });
      for (let i = 0; i < COUNT; i++) {
        this.fades.push({ mode: "one-sided", opacity: 1 });
        this.handles.push(engine.add(this.meshes[i % this.meshes.length], { scale: 0 }));
      }
      this.engine = engine;
      engine.mount(target).catch((error) => {
        target.textContent = error instanceof Error ? error.message : String(error);
      });
      const measure = () => {
        if (target.clientWidth > 0 && target.clientHeight > 0) {
          this.aspect = target.clientWidth / target.clientHeight;
        }
      };
      measure();
      this.observer = new ResizeObserver(measure);
      this.observer.observe(target);
      this.label = mountAnimationLabel(target, this.labelContent);
      if (this.fadeLabel) this.label.setOpacity(0);
    }
    enter(now) {
      if (this.enterAt === Infinity) this.enterAt = now;
    }
    exit(now) {
      if (this.exitAt === Infinity) this.exitAt = now;
    }
    isFinished() {
      return this.finished;
    }
    render(now, frame) {
      if (!this.engine || !this.label) return;
      if (this.enterAt === Infinity) {
        for (const handle of this.handles) handle.transform.scale = 0;
        this.engine.render();
        return;
      }
      const dt = this.lastNow === 0 ? 16 : Math.min(50, now - this.lastNow);
      this.lastNow = now;
      this.updateBlends(dt, frame.progress, now);
      if (this.exitAt !== Infinity && this.allDockedAt !== Infinity && this.collapseAt === Infinity) {
        this.collapseAt = Math.max(this.exitAt, this.allDockedAt) + HOLD_MS;
      }
      if (now >= this.collapseAt) this.renderCollapse(now);
      else this.renderStory(now, dt);
      this.label.setText(frame.indeterminate ? typeof this.labelContent === "string" ? this.labelContent : "" : `${Math.round(frame.progress * 100)}%`);
      if (this.fadeLabel) {
        this.label.setOpacity(animationLabelOpacity(
          now,
          this.enterAt,
          LABEL_FADE_MS,
          this.collapseAt,
          COLLAPSE_MS
        ));
      }
      if (this.collapseAt !== Infinity && now >= this.collapseAt + this.maxCollapseDelay + COLLAPSE_MS + POP_MS) {
        this.finished = true;
      }
      this.engine.render();
    }
    destroy() {
      this.observer?.disconnect();
      this.observer = void 0;
      this.label?.container.remove();
      this.label = void 0;
      this.engine?.destroy();
      this.engine = void 0;
      this.handles.length = 0;
      this.fades.length = 0;
    }
    updateBlends(dt, progress, now) {
      const exiting = this.exitAt !== Infinity;
      const ringComplete = now - this.enterAt >= INTRO_DONE_MS;
      const want = !ringComplete ? 0 : exiting ? COUNT : Math.min(COUNT, Math.floor(progress * COUNT + 1e-9));
      const rate = dt / this.dockMs * (exiting ? EXIT_HURRY2 : 1);
      for (let i = 0; i < COUNT; i++) {
        const target = i < want ? 1 : 0;
        const blend = this.blends[i];
        if (target > blend && (i === 0 || this.blends[i - 1] >= GATE_DOCK)) {
          this.blends[i] = Math.min(1, blend + rate);
        } else if (target < blend && (i === COUNT - 1 || this.blends[i + 1] <= GATE_UNDOCK)) {
          this.blends[i] = Math.max(0, blend - rate);
        }
        if (this.blends[i] >= 1) {
          if (this.dockedAt[i] === Infinity) this.dockedAt[i] = now;
        } else {
          this.dockedAt[i] = Infinity;
        }
      }
      const allDocked = want === COUNT && this.blends.every((blend) => blend >= 1);
      if (allDocked) {
        if (this.allDockedAt === Infinity) this.allDockedAt = now;
      } else if (!exiting) {
        this.allDockedAt = Infinity;
      }
    }
    renderStory(now, dt) {
      const t = now - this.enterAt;
      const halfHeight = Math.tan(FOV / 2) * CAMERA_Z2;
      const halfWidth = halfHeight * this.aspect;
      const radius = Math.max(0.6, Math.min(halfWidth, halfHeight) - this.size * 0.55);
      const spawnFactor = (Math.max(halfWidth, halfHeight) * 1.25 + this.size * 2) / radius;
      for (let i = 0; i < COUNT; i++) {
        const transform2 = this.handles[i].transform;
        const eased = smooth01(this.blends[i]);
        const introT = clamp015((t - i * INTRO_STAGGER_MS) / INTRO_MS);
        const reach = 1 + (spawnFactor - 1) * (1 - easeOutCubic(introT));
        const angle = Math.PI / 2 - i / COUNT * TWO_PI2 - t / this.orbitPeriodMs * TWO_PI2;
        const orbitX = Math.cos(angle) * radius * reach;
        const orbitY = Math.sin(angle) * radius * reach;
        const slot = this.slots[i];
        transform2.position.x = orbitX + (slot.x - orbitX) * eased;
        transform2.position.y = orbitY + (slot.y - orbitY) * eased;
        transform2.position.z = 0;
        transform2.scale = this.size;
        if (this.blends[i] === 0) {
          this.tumbleX[i] = wrapAngle(this.tumbleX[i] + (4e-4 + 8e-4 * hash01(i, 1)) * dt);
          this.tumbleY[i] = wrapAngle(this.tumbleY[i] + (6e-4 + 1e-3 * hash01(i, 3)) * dt);
        }
        transform2.rotation.z = 0;
        if (this.blends[i] >= 1) {
          const phase = (t + i * SPIN_STAGGER_MS) % SPIN_EVERY_MS;
          const spinning = phase < SPIN_MS && now - phase >= this.dockedAt[i];
          transform2.rotation.x = 0;
          transform2.rotation.y = spinning ? TWO_PI2 * easeInOutCubic(phase / SPIN_MS) : 0;
        } else {
          const free = 1 - eased;
          transform2.rotation.x = this.tumbleX[i] * free;
          transform2.rotation.y = this.tumbleY[i] * free;
        }
      }
    }
    renderCollapse(now) {
      if (!this.captured) {
        this.captured = this.handles.map((handle) => ({ ...handle.transform.position }));
      }
      for (let i = 0; i < COUNT; i++) {
        const transform2 = this.handles[i].transform;
        const from = this.captured[i];
        const local = now - this.collapseAt - this.collapseDelay[i];
        if (local <= 0) {
          transform2.position.x = from.x;
          transform2.position.y = from.y;
          transform2.position.z = from.z;
          transform2.scale = this.size;
          continue;
        }
        const pull = easeInCubic(clamp015(local / COLLAPSE_MS));
        transform2.position.x = from.x * (1 - pull);
        transform2.position.y = from.y * (1 - pull);
        transform2.position.z = from.z * (1 - pull);
        transform2.scale = this.size * (1 - 0.99 * pull);
        if (local >= COLLAPSE_MS) {
          if (!this.popStarted[i]) {
            this.popStarted[i] = true;
            this.handles[i].transparency = this.fades[i];
          }
          const v = clamp015((local - COLLAPSE_MS) / POP_MS);
          this.fades[i].opacity = 1 - v;
          transform2.scale = v >= 1 ? 0 : this.size * 0.01 * (1 + 1.6 * Math.sin(Math.PI * v));
        }
      }
    }
  };

  // src/composite-animation.ts
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

  // src/prefabs/spinner.ts
  function spinner(animation, options) {
    return {
      type: "indeterminate",
      animation,
      loop: options.loop,
      periodMs: options.periodMs
    };
  }
  function progressSpinner(animation, options) {
    return {
      type: "progress",
      animation,
      progress: options.progress ?? 1e-3,
      timeout: options.timeout,
      until: options.until
    };
  }

  // src/prefabs/charged-orb.ts
  function chargedOrb(options = {}) {
    const particles = options.particles ?? {};
    const rate = particles.rate ?? 60;
    const orb = new ChargedOrbAnimation({
      backend: options.backend,
      ...options.orb
    });
    const streams = new ParticlesAnimation({
      rate,
      lifeMs: 1200,
      size: 0.12,
      speed: 0.05,
      colors: ["#ffffff", "#a5f3fc", "#818cf8"],
      texture: particles.texture ?? shineTexture(),
      emitter: orb.satelliteEmitter(1e3 / rate),
      outroMs: orb.outroEmitMs,
      seed: 5,
      backend: options.backend,
      ...particles,
      label: options.label ?? particles.label,
      fadeLabel: options.fadeLabel ?? particles.fadeLabel
    });
    return progressSpinner(new CompositeAnimation([orb, streams]), options);
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

  // src/prefabs/crystal-comet.ts
  function crystalComet(options = {}) {
    const motion = options.object?.motion ?? figureEightMotion({ size: 0.66, periodMs: 7200 });
    const particles = options.particles ?? {};
    const object = new ObjectMotionAnimation({
      mesh: () => tetrahedron(1, ["#f0f9ff", "#7dd3fc", "#818cf8", "#e879f9"]),
      motion,
      size: 0.42,
      rotation: { spinX: 2e-3, spinY: 3e-3 },
      backend: options.backend,
      ...options.object,
      label: options.object?.label
    });
    const animation = new CompositeAnimation([
      new ParticlesAnimation({
        rate: 44,
        lifeMs: 2300,
        size: 0.25,
        speed: 0.08,
        colors: ["#ffffff", "#bae6fd", "#818cf8"],
        texture: particles.texture ?? shineTexture(),
        emitter: object.trailEmitter(),
        outroMs: object.outroDurationMs,
        seed: 28,
        backend: options.backend,
        ...particles,
        label: options.label ?? particles.label ?? "Polishing pixels",
        fadeLabel: options.fadeLabel ?? particles.fadeLabel
      }),
      object
    ]);
    return spinner(animation, options);
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

  // src/animations/ghost-train.ts
  var MAX_CARS = 50;
  var CAMERA_Z3 = 3;
  var FOV2 = 55 * Math.PI / 180;
  var HALF_HEIGHT = Math.tan(FOV2 / 2) * CAMERA_Z3;
  var RUN_GAP_MS = 130;
  var POP_MS2 = 320;
  var SAMPLE_MS2 = 8;
  var TURN_RATE = 0.4 * Math.PI / 180;
  var MAX_OUTRO_MS = 4e3;
  var WARP_ACCEL = 1e3;
  var TRAIL_OUTRO_MS = 1200;
  var TRANSPARENCY = { mode: "two-sided", opacity: 0.275 };
  var CAR_COLORS = ["#bae6fd", "#7dd3fc", "#38bdf8", "#0ea5e9", "#a5f3fc", "#e0f2fe"];
  var WORLD_UP2 = { x: 0, y: 1, z: 0 };
  function clamp016(value) {
    return Math.max(0, Math.min(1, value));
  }
  function orientationFor2(forward) {
    const fwd = normalize(forward);
    let right = cross(fwd, WORLD_UP2);
    if (Math.hypot(right.x, right.y, right.z) < 1e-4) right = { x: 0, y: 0, z: 1 };
    right = normalize(right);
    const up = cross(right, fwd);
    const w = normalize(cross(fwd, up));
    return {
      x: Math.atan2(cross(w, fwd).z, w.z),
      y: Math.asin(Math.max(-1, Math.min(1, -fwd.z))),
      z: Math.atan2(fwd.y, fwd.x)
    };
  }
  function rotateToward(from, to, maxRad) {
    const a = normalize(from);
    const b = normalize(to);
    const d = Math.max(-1, Math.min(1, dot(a, b)));
    const angle = Math.acos(d);
    if (angle <= maxRad || angle < 1e-4) return b;
    const sin = Math.sin(angle);
    if (sin < 1e-4) return b;
    const t = maxRad / angle;
    const w1 = Math.sin((1 - t) * angle) / sin;
    const w2 = Math.sin(t * angle) / sin;
    return normalize({ x: a.x * w1 + b.x * w2, y: a.y * w1 + b.y * w2, z: a.z * w1 + b.z * w2 });
  }
  var GhostTrainAnimation = class {
    constructor(options = {}) {
      this.cars = [];
      this.appear = new Array(MAX_CARS).fill(0);
      this.headings = new Array(MAX_CARS).fill(void 0);
      this.aspect = 16 / 9;
      this.enterAt = Infinity;
      this.outroAt = Infinity;
      this.carsAtOutro = 0;
      this.exitPathTime = 0;
      // lead car's path-time at blast-off (the escape switch point)
      this.exitPoint = { x: 0, y: 0, z: 0 };
      this.exitDir = { x: 1, y: 0, z: 0 };
      // shared escape direction, outward from the track
      this.exitSpeed = 1e-3;
      // path-units per path-millisecond at the switch (keeps speed continuous)
      this.lastNow = 0;
      this.finished = false;
      this.motion = options.motion ?? squareMotion({ size: 1.7, periodMs: 6800, tilt: 0.5 });
      this.size = options.size ?? 0.15;
      this.backend = options.backend;
      this.labelContent = options.label;
      this.fadeLabel = options.fadeLabel ?? true;
    }
    mount(target) {
      if (!target.style.position) target.style.position = "relative";
      const engine = new Little3dEngine({
        backend: this.backend,
        camera: { position: { x: 0, y: 0, z: CAMERA_Z3 }, fov: FOV2 }
      });
      const mesh = cube(1, CAR_COLORS);
      for (let i = 0; i < MAX_CARS; i++) {
        this.cars.push(engine.add(mesh, { scale: 0, transparency: { ...TRANSPARENCY } }));
      }
      this.engine = engine;
      engine.mount(target).catch((error) => {
        target.textContent = error instanceof Error ? error.message : String(error);
      });
      const measure = () => {
        if (target.clientWidth > 0 && target.clientHeight > 0) {
          this.aspect = target.clientWidth / target.clientHeight;
        }
      };
      measure();
      this.observer = new ResizeObserver(measure);
      this.observer.observe(target);
      this.label = mountAnimationLabel(target, this.labelContent);
      if (this.fadeLabel) this.label.setOpacity(0);
    }
    enter(now) {
      if (this.enterAt === Infinity) this.enterAt = now;
    }
    exit(now) {
      if (this.outroAt !== Infinity || this.enterAt === Infinity) return;
      this.outroAt = now;
      this.carsAtOutro = this.appear.filter((a) => a > 0.5).length;
      this.exitPathTime = now - this.enterAt;
      const from = this.motion.positionAt(this.exitPathTime);
      const velocity = subtract(
        this.motion.positionAt(this.exitPathTime + 1),
        this.motion.positionAt(this.exitPathTime - 1)
      );
      const speed = Math.hypot(velocity.x, velocity.y, velocity.z);
      this.exitPoint = from;
      if (speed > 1e-6) this.exitSpeed = speed / 2;
      this.exitDir = speed > 1e-6 ? normalize(velocity) : { x: 1, y: 0, z: 0 };
    }
    isFinished() {
      return this.finished;
    }
    /** Milliseconds the lead car keeps moving into the outro; feed a trail layer's `outroMs`. */
    get outroDurationMs() {
      return TRAIL_OUTRO_MS;
    }
    /**
     * A {@link MotionController} following the lead car's actual position, through
     * laps and the accelerating escape. Feed it to a particle layer's `emitter`
     * so the star trail stays behind the train.
     */
    trailEmitter() {
      return {
        positionAt: (t) => this.enterAt === Infinity ? this.motion.positionAt(t) : this.pathPosition(t - this.enterAt + this.warp(t))
      };
    }
    render(now, frame) {
      if (!this.engine || !this.label) return;
      for (const car of this.cars) car.transform.scale = 0;
      if (this.enterAt === Infinity) {
        this.engine.render();
        return;
      }
      const dt = this.lastNow === 0 ? 16 : Math.min(50, now - this.lastNow);
      this.lastNow = now;
      const want = this.outroAt !== Infinity ? this.carsAtOutro : Math.min(MAX_CARS, Math.round(frame.progress * MAX_CARS));
      const halfWidth = HALF_HEIGHT * this.aspect;
      const warp = this.warp(now);
      let anyOnScreen = false;
      for (let k = 0; k < MAX_CARS; k++) {
        const target = k < want ? 1 : 0;
        this.appear[k] = clamp016(this.appear[k] + Math.sign(target - this.appear[k]) * (dt / POP_MS2));
        if (this.appear[k] <= 0) {
          this.headings[k] = void 0;
          continue;
        }
        const p = now - this.enterAt - k * RUN_GAP_MS + warp;
        const position = this.pathPosition(p);
        if (Math.abs(position.x) > halfWidth + this.size || Math.abs(position.y) > HALF_HEIGHT + this.size) {
          continue;
        }
        const ahead = subtract(this.pathPosition(p + SAMPLE_MS2), position);
        const targetDir = Math.hypot(ahead.x, ahead.y, ahead.z) > 1e-5 ? ahead : this.headings[k] ?? { x: 1, y: 0, z: 0 };
        this.headings[k] = this.headings[k] ? rotateToward(this.headings[k], targetDir, TURN_RATE * dt) : normalize(targetDir);
        const orientation = orientationFor2(this.headings[k]);
        const transform2 = this.cars[k].transform;
        transform2.position.x = position.x;
        transform2.position.y = position.y;
        transform2.position.z = position.z;
        transform2.rotation.x = orientation.x;
        transform2.rotation.y = orientation.y;
        transform2.rotation.z = orientation.z;
        transform2.scale = this.size * easeOutBack(this.appear[k]);
        anyOnScreen = true;
      }
      this.label.setText(frame.indeterminate ? typeof this.labelContent === "string" ? this.labelContent : "" : `${Math.round(frame.progress * 100)}%`);
      if (this.fadeLabel) {
        this.label.setOpacity(animationLabelOpacity(now, this.enterAt, POP_MS2, this.outroAt, TRAIL_OUTRO_MS));
      }
      if (this.outroAt !== Infinity && now > this.outroAt + 300 && (!anyOnScreen || now >= this.outroAt + MAX_OUTRO_MS)) {
        this.finished = true;
      }
      this.engine.render();
    }
    destroy() {
      this.observer?.disconnect();
      this.observer = void 0;
      this.label?.container.remove();
      this.label = void 0;
      this.engine?.destroy();
      this.engine = void 0;
      this.cars.length = 0;
    }
    /** Extra path-time every car has accelerated forward by, `now` ms into the outro. */
    warp(now) {
      if (this.outroAt === Infinity) return 0;
      const seconds = (now - this.outroAt) / 1e3;
      return 0.5 * WARP_ACCEL * seconds * seconds;
    }
    /**
     * The single trajectory every car rides, sampled at path-time `p`: the track
     * up to the exit switch point, then a straight escape outward. Because the
     * switch point and direction are shared, all cars follow the exact same path.
     */
    pathPosition(p) {
      if (this.outroAt === Infinity || p <= this.exitPathTime) {
        return this.motion.positionAt(p);
      }
      const distance = this.exitSpeed * (p - this.exitPathTime);
      return {
        x: this.exitPoint.x + this.exitDir.x * distance,
        y: this.exitPoint.y + this.exitDir.y * distance,
        z: this.exitPoint.z + this.exitDir.z * distance
      };
    }
  };

  // src/prefabs/ghost-train.ts
  function ghostTrain(options = {}) {
    const particles = options.particles ?? {};
    const train = new GhostTrainAnimation({
      motion: options.object?.motion,
      backend: options.backend
    });
    const trail = new ParticlesAnimation({
      rate: 30,
      lifeMs: 1700,
      size: 0.15,
      speed: 0.11,
      colors: ["#e0f2fe", "#a5f3fc", "#c4b5fd"],
      texture: particles.texture ?? starTexture({ glow: 5 }),
      emitter: train.trailEmitter(),
      outroMs: train.outroDurationMs,
      seed: 17,
      backend: options.backend,
      ...particles,
      label: options.label ?? particles.label,
      fadeLabel: options.fadeLabel ?? particles.fadeLabel
    });
    return progressSpinner(new CompositeAnimation([trail, train]), options);
  }

  // src/prefabs/grid-assembly.ts
  function gridAssembly(options = {}) {
    return progressSpinner(
      new GridAssemblyAnimation({
        backend: options.backend,
        label: options.label,
        fadeLabel: options.fadeLabel,
        ...options.assembly
      }),
      options
    );
  }

  // src/prefabs/monochrome-streak.ts
  function monochromeStreak(options = {}) {
    const particles = options.particles ?? {};
    return spinner(new ParticlesAnimation({
      rate: 70,
      lifeMs: 2800,
      size: 0.38,
      speed: 1.35,
      direction: { x: 0, y: 1, z: 0 },
      spread: 0.62,
      gravity: { x: 0, y: -1.45, z: 0 },
      colors: ["#fff", "#000"],
      texture: particles.texture ?? streakTexture(),
      spin: 0,
      alignToMotion: true,
      seed: 37,
      backend: options.backend,
      ...particles,
      label: options.label ?? particles.label ?? "Loading...",
      fadeLabel: options.fadeLabel ?? particles.fadeLabel
    }), options);
  }

  // src/prefabs/plane-star-trail.ts
  function planeStarTrail(options = {}) {
    const motion = options.object?.motion ?? figureEightMotion({ size: 0.72, periodMs: 6200 });
    const particles = options.particles ?? {};
    const object = new ObjectMotionAnimation({
      mesh: planeMesh,
      motion,
      size: 0.48,
      backend: options.backend,
      ...options.object,
      label: options.object?.label
    });
    const animation = new CompositeAnimation([
      new ParticlesAnimation({
        rate: 34,
        lifeMs: 1900,
        size: 0.16,
        speed: 0.11,
        colors: ["#fde047", "#f472b6", "#7dd3fc"],
        texture: particles.texture ?? starTexture(),
        emitter: object.trailEmitter(),
        outroMs: object.outroDurationMs,
        seed: 11,
        backend: options.backend,
        ...particles,
        label: options.label ?? particles.label ?? "Flying in...",
        fadeLabel: options.fadeLabel ?? particles.fadeLabel
      }),
      object
    ]);
    return spinner(animation, options);
  }

  // src/prefabs/pulsing-starfield.ts
  function pulsingLabel() {
    const label = document.createElement("div");
    label.innerHTML = `<style>
    @keyframes spinner-prefab-pulse { 0%,100% { color:#fff; transform:scale(1); } 50% { color:#93c5fd; transform:scale(1.06); } }
  </style><div style="animation:spinner-prefab-pulse 2.4s ease-in-out infinite;font-size:2rem">Loading the good stuff</div>`;
    return label;
  }
  function pulsingStarfield(options = {}) {
    const particles = options.particles ?? {};
    return spinner(new ParticlesAnimation({
      rate: 48,
      lifeMs: 4200,
      size: 0.3,
      speed: 0.34,
      colors: ["#ffffff", "#dbeafe", "#93c5fd", "#c4b5fd"],
      texture: particles.texture ?? shineTexture(),
      seed: 71,
      backend: options.backend,
      ...particles,
      label: options.label ?? particles.label ?? pulsingLabel(),
      fadeLabel: options.fadeLabel ?? particles.fadeLabel
    }), options);
  }

  // src/animations/rocket-launch.ts
  var ROCKETS = 20;
  var CAMERA_Z4 = 3;
  var FOV3 = 55 * Math.PI / 180;
  var HALF_HEIGHT2 = Math.tan(FOV3 / 2) * CAMERA_Z4;
  var SIZE = 0.12;
  var ROW_Y = -0.5;
  var PARTICLE_Z = 0.3;
  var SLIDE_MS = 460;
  var SLIDE_GATE = 0.45;
  var EXIT_HURRY3 = 2.5;
  var LAUNCH_SPREAD_MS = 620;
  var ASCENT_G = 5.2;
  var FINISH_PAD_MS = 2e3;
  var TURNERS = 3;
  var TURN_MIN_Y = 0.2;
  var TURN_MAX_Y = 0.8;
  var TURN_MIN_DEG = 30;
  var TURN_MAX_DEG = 50;
  var DEG = Math.PI / 180;
  var SMOKE_LIFE_MS = 1400;
  var SMOKE_GAP_MS = 320;
  var SMOKE_RISE = 0.55;
  var SMOKE_SIZE = 0.17;
  var SMOKE_PEAK = 0.16;
  var SMOKE_POOL = 104;
  var FIRE_LIFE_MS = 420;
  var FIRE_GAP_MS = 55;
  var FIRE_ON_MS = 950;
  var FIRE_TRAIL = 0.25;
  var FIRE_SPREAD = 0.09;
  var FIRE_SIZE = 0.15;
  var FIRE_PEAK = 0.9;
  var FIRE_POOL = 140;
  var SMOKE_COLORS = ["#e2e8f0", "#cbd5e1"];
  var FIRE_COLORS = ["#fef3c7", "#fde047", "#fb923c", "#ef4444"];
  var ROCKET_COLORS = ["#e2e8f0", "#f8fafc", "#cbd5e1", "#94a3b8", "#e2e8f0"];
  function clamp017(value) {
    return Math.max(0, Math.min(1, value));
  }
  function smoothstep2(edge0, edge1, value) {
    const x = clamp017((value - edge0) / (edge1 - edge0));
    return x * x * (3 - 2 * x);
  }
  function hash012(index, salt) {
    let h = (Math.imul(index + 1, 2654435769) ^ Math.imul(salt + 1, 2246822507)) >>> 0;
    h = Math.imul(h ^ h >>> 16, 73244475);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  }
  function puffTexture(coreAlpha, coreStop) {
    return canvasTexture((ctx) => {
      const g = ctx.createRadialGradient(48, 48, 1, 48, 48, 47);
      g.addColorStop(0, `rgba(255,255,255,${coreAlpha})`);
      g.addColorStop(coreStop, `rgba(255,255,255,${coreAlpha * 0.6})`);
      g.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 96, 96);
    });
  }
  var RocketLaunchAnimation = class {
    constructor(options = {}) {
      this.rockets = [];
      this.smoke = [];
      this.fire = [];
      this.smokeFades = [];
      this.fireFades = [];
      this.blends = new Array(ROCKETS).fill(0);
      this.groundedAt = new Array(ROCKETS).fill(Infinity);
      // Per-rocket veer parameters (turnS = Infinity for a rocket that climbs straight).
      this.turnS = new Array(ROCKETS).fill(Infinity);
      this.turnDir = [];
      this.turnRoll = new Array(ROCKETS).fill(0);
      this.stagger = new Array(ROCKETS).fill(0);
      this.aspect = 16 / 9;
      this.enterAt = Infinity;
      this.exitAt = Infinity;
      this.launchedAt = Infinity;
      this.lastNow = 0;
      this.finished = false;
      this.backend = options.backend;
      this.labelContent = options.label;
      this.fadeLabel = options.fadeLabel ?? true;
      for (let i = 0; i < ROCKETS; i++) {
        this.turnDir.push({ x: 0, y: 1 });
        this.stagger[i] = hash012(i, 7) * LAUNCH_SPREAD_MS;
      }
      const order = Array.from({ length: ROCKETS }, (_, i) => i).sort(
        (a, b) => hash012(a, 11) - hash012(b, 11)
      );
      for (const i of order.slice(0, TURNERS)) {
        const height = TURN_MIN_Y + hash012(i, 12) * (TURN_MAX_Y - TURN_MIN_Y);
        const angle = (TURN_MIN_DEG + hash012(i, 13) * (TURN_MAX_DEG - TURN_MIN_DEG)) * DEG;
        const sign = hash012(i, 14) < 0.5 ? -1 : 1;
        this.turnS[i] = height - ROW_Y;
        this.turnDir[i] = { x: sign * Math.sin(angle), y: Math.cos(angle) };
        this.turnRoll[i] = -sign * angle;
      }
    }
    mount(target) {
      if (!target.style.position) target.style.position = "relative";
      const smokeMeshes = SMOKE_COLORS.map((color) => quad(1, [color]));
      const fireMeshes = FIRE_COLORS.map((color) => quad(1, [color]));
      const smokeTexture = puffTexture(0.85, 0.5);
      const fireTexture = puffTexture(1, 0.32);
      const backend = async (rendererOptions) => {
        const renderer = this.backend === "webgpu" ? new (await Promise.resolve().then(() => (init_webgpu_textured(), webgpu_textured_exports))).WebGPUTexturedRenderer(rendererOptions) : this.backend === "webgl" ? new (await Promise.resolve().then(() => (init_webgl_textured(), webgl_textured_exports))).WebGLTexturedRenderer(rendererOptions) : new (await Promise.resolve().then(() => (init_canvas2d_textured(), canvas2d_textured_exports))).Canvas2DTexturedRenderer(rendererOptions);
        for (const mesh of smokeMeshes) renderer.setTexture(mesh, smokeTexture);
        for (const mesh of fireMeshes) renderer.setTexture(mesh, fireTexture);
        return renderer;
      };
      const engine = new Little3dEngine({
        backend,
        camera: { position: { x: 0, y: 0, z: CAMERA_Z4 }, fov: FOV3 }
      });
      const rocketMesh = pyramid(1, ROCKET_COLORS);
      for (let i = 0; i < ROCKETS; i++) this.rockets.push(engine.add(rocketMesh, { scale: 0 }));
      for (let s = 0; s < SMOKE_POOL; s++) {
        const fade = { mode: "one-sided", opacity: 0 };
        this.smokeFades.push(fade);
        this.smoke.push(engine.add(smokeMeshes[s % smokeMeshes.length], { scale: 0, transparency: fade }));
      }
      for (let f = 0; f < FIRE_POOL; f++) {
        const fade = { mode: "one-sided", opacity: 0 };
        this.fireFades.push(fade);
        this.fire.push(engine.add(fireMeshes[f % fireMeshes.length], { scale: 0, transparency: fade }));
      }
      this.engine = engine;
      engine.mount(target).catch((error) => {
        target.textContent = error instanceof Error ? error.message : String(error);
      });
      const measure = () => {
        if (target.clientWidth > 0 && target.clientHeight > 0) {
          this.aspect = target.clientWidth / target.clientHeight;
        }
      };
      measure();
      this.observer = new ResizeObserver(measure);
      this.observer.observe(target);
      this.label = mountAnimationLabel(target, this.labelContent);
      if (this.fadeLabel) this.label.setOpacity(0);
    }
    enter(now) {
      if (this.enterAt === Infinity) this.enterAt = now;
    }
    exit(now) {
      if (this.exitAt === Infinity) this.exitAt = now;
    }
    isFinished() {
      return this.finished;
    }
    render(now, frame) {
      if (!this.engine || !this.label) return;
      for (const handle of this.rockets) handle.transform.scale = 0;
      for (const fade of this.smokeFades) fade.opacity = 0;
      for (const fade of this.fireFades) fade.opacity = 0;
      for (const handle of this.smoke) handle.transform.scale = 0;
      for (const handle of this.fire) handle.transform.scale = 0;
      if (this.enterAt === Infinity) {
        this.engine.render();
        return;
      }
      const dt = this.lastNow === 0 ? 16 : Math.min(50, now - this.lastNow);
      this.lastNow = now;
      const exiting = this.exitAt !== Infinity;
      this.updateBlends(dt, frame.progress, now, exiting);
      if (exiting && this.launchedAt === Infinity && this.blends.every((blend) => blend >= 1)) {
        this.launchedAt = now;
      }
      const launched = this.launchedAt !== Infinity;
      const halfWidth = HALF_HEIGHT2 * this.aspect;
      const rowHalf = Math.min(halfWidth * 0.8, 1.18);
      const spawnX = halfWidth + 0.6;
      let smokeCursor = 0;
      let fireCursor = 0;
      for (let i = 0; i < ROCKETS; i++) {
        const homeX = -rowHalf + 2 * rowHalf * i / (ROCKETS - 1);
        const launchAt = launched ? this.launchedAt + this.stagger[i] : Infinity;
        const la = now - launchAt;
        if (launched && la >= 0) {
          this.renderAscent(i, homeX, la, halfWidth);
          fireCursor = this.emitFire(i, homeX, la, fireCursor);
          continue;
        }
        const blend = this.blends[i];
        if (blend <= 0) continue;
        const transform2 = this.rockets[i].transform;
        transform2.position.x = spawnX + (homeX - spawnX) * easeOutBack(blend);
        transform2.position.y = ROW_Y;
        transform2.position.z = 0;
        transform2.rotation.x = 0;
        transform2.rotation.y = 0;
        transform2.rotation.z = 0;
        transform2.scale = SIZE * smoothstep2(0, 0.6, blend);
        if (this.groundedAt[i] !== Infinity) {
          smokeCursor = this.emitSmoke(i, homeX, now, launchAt, smokeCursor);
        }
      }
      this.label.setText(frame.indeterminate ? typeof this.labelContent === "string" ? this.labelContent : "" : `${Math.round(frame.progress * 100)}%`);
      if (this.fadeLabel) {
        this.label.setOpacity(animationLabelOpacity(
          now,
          this.enterAt,
          SLIDE_MS,
          this.launchedAt,
          LAUNCH_SPREAD_MS
        ));
      }
      if (launched && now >= this.launchedAt + LAUNCH_SPREAD_MS + FINISH_PAD_MS) {
        this.finished = true;
      }
      this.engine.render();
    }
    destroy() {
      this.observer?.disconnect();
      this.observer = void 0;
      this.label?.container.remove();
      this.label = void 0;
      this.engine?.destroy();
      this.engine = void 0;
      this.rockets.length = 0;
      this.smoke.length = 0;
      this.fire.length = 0;
      this.smokeFades.length = 0;
      this.fireFades.length = 0;
    }
    updateBlends(dt, progress, now, exiting) {
      const want = exiting ? ROCKETS : Math.min(ROCKETS, Math.round(progress * ROCKETS));
      const rate = dt / SLIDE_MS * (exiting ? EXIT_HURRY3 : 1);
      for (let i = 0; i < ROCKETS; i++) {
        const target = i < want ? 1 : 0;
        const blend = this.blends[i];
        if (target > blend && (i === 0 || this.blends[i - 1] >= SLIDE_GATE)) {
          this.blends[i] = Math.min(1, blend + rate);
        } else if (target < blend && (i === ROCKETS - 1 || this.blends[i + 1] <= 1 - SLIDE_GATE)) {
          this.blends[i] = Math.max(0, blend - rate);
        }
        if (this.blends[i] >= 1) {
          if (this.groundedAt[i] === Infinity) this.groundedAt[i] = now;
        } else {
          this.groundedAt[i] = Infinity;
        }
      }
    }
    /** Along-track distance climbed `la` ms after this rocket's own blast-off. */
    ascentDistance(la) {
      const seconds = la / 1e3;
      return 0.5 * ASCENT_G * seconds * seconds;
    }
    /** Rocket center, nose direction, and roll `la` ms into its climb. */
    ascentPose(i, homeX, la) {
      const s = this.ascentDistance(la);
      const turnS = this.turnS[i];
      if (s <= turnS) {
        return { pos: { x: homeX, y: ROW_Y + s }, dir: { x: 0, y: 1 }, roll: 0 };
      }
      const post = s - turnS;
      const dir = this.turnDir[i];
      return {
        pos: { x: homeX + dir.x * post, y: ROW_Y + turnS + dir.y * post },
        dir,
        roll: this.turnRoll[i]
      };
    }
    renderAscent(i, homeX, la, halfWidth) {
      const { pos, roll } = this.ascentPose(i, homeX, la);
      if (pos.y > HALF_HEIGHT2 + 0.4 || Math.abs(pos.x) > halfWidth + 0.4) return;
      const transform2 = this.rockets[i].transform;
      transform2.position.x = pos.x;
      transform2.position.y = pos.y;
      transform2.position.z = 0;
      transform2.rotation.x = 0;
      transform2.rotation.y = 0;
      transform2.rotation.z = roll;
      transform2.scale = SIZE;
    }
    emitFire(i, homeX, la, cursor) {
      const gap = FIRE_GAP_MS;
      const last = Math.min(Math.floor(la / gap), Math.floor(FIRE_ON_MS / gap));
      const first = Math.max(0, Math.ceil((la - FIRE_LIFE_MS) / gap));
      for (let n = first; n <= last; n++) {
        if (cursor >= this.fire.length) return cursor;
        const emitLa = n * gap;
        const age = la - emitLa;
        if (age < 0 || age >= FIRE_LIFE_MS) continue;
        const life = age / FIRE_LIFE_MS;
        const seconds = age / 1e3;
        const pose = this.ascentPose(i, homeX, emitLa);
        const back = { x: -pose.dir.x, y: -pose.dir.y };
        const perp = { x: -pose.dir.y, y: pose.dir.x };
        const lat = (hash012(i * 97 + n, 1) - 0.5) * FIRE_SPREAD;
        const baseX = pose.pos.x + back.x * SIZE * 0.5;
        const baseY = pose.pos.y + back.y * SIZE * 0.5;
        const transform2 = this.fire[cursor].transform;
        transform2.position.x = baseX + back.x * FIRE_TRAIL * seconds + perp.x * lat;
        transform2.position.y = baseY + back.y * FIRE_TRAIL * seconds + perp.y * lat - 0.12 * seconds * seconds;
        transform2.position.z = PARTICLE_Z;
        transform2.rotation.z = hash012(i * 97 + n, 2) * Math.PI * 2;
        transform2.scale = FIRE_SIZE * (0.7 + 0.5 * hash012(i * 97 + n, 3)) * (1 - 0.55 * life);
        this.fireFades[cursor].opacity = FIRE_PEAK * smoothstep2(0, 0.15, life) * (1 - smoothstep2(0.55, 1, life));
        cursor++;
      }
      return cursor;
    }
    emitSmoke(i, homeX, now, launchAt, cursor) {
      const start = this.groundedAt[i];
      const tr = now - start;
      const gap = SMOKE_GAP_MS;
      const emitUntil = Number.isFinite(launchAt) ? launchAt - start : tr;
      const last = Math.min(Math.floor(tr / gap), Math.floor(emitUntil / gap));
      const first = Math.max(0, Math.ceil((tr - SMOKE_LIFE_MS) / gap));
      const baseY = ROW_Y - SIZE * 0.4;
      for (let n = first; n <= last; n++) {
        if (cursor >= this.smoke.length) return cursor;
        const age = tr - n * gap;
        if (age < 0 || age >= SMOKE_LIFE_MS) continue;
        const life = age / SMOKE_LIFE_MS;
        const drift = (hash012(i * 131 + n, 1) - 0.5) * 0.14;
        const transform2 = this.smoke[cursor].transform;
        transform2.position.x = homeX + drift * life;
        transform2.position.y = baseY + SMOKE_RISE * life;
        transform2.position.z = PARTICLE_Z;
        transform2.rotation.z = hash012(i * 131 + n, 2) * Math.PI * 2;
        transform2.scale = SMOKE_SIZE * (0.5 + 0.8 * life) * (0.7 + 0.6 * hash012(i * 131 + n, 3));
        this.smokeFades[cursor].opacity = SMOKE_PEAK * smoothstep2(0, 0.25, life) * (1 - smoothstep2(0.5, 1, life));
        cursor++;
      }
      return cursor;
    }
  };

  // src/prefabs/rocket-launch.ts
  function rocketLaunch(options = {}) {
    return progressSpinner(
      new RocketLaunchAnimation({
        backend: options.backend,
        label: options.label,
        fadeLabel: options.fadeLabel
      }),
      options
    );
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

  // src/prefabs/star-swarm.ts
  function starSwarm(options = {}) {
    const particles = options.particles ?? {};
    const emitter = particles.emitter ?? wanderMotion({
      bounds: { x: 1.1, y: 0.72, z: 0.35 },
      periodMs: 7200,
      seed: 19
    });
    return spinner(new ParticlesAnimation({
      rate: 38,
      lifeMs: 2600,
      size: 0.15,
      speed: 0.17,
      colors: ["#fef08a", "#f9a8d4", "#a5f3fc"],
      texture: particles.texture ?? starTexture(),
      emitter,
      seed: 91,
      backend: options.backend,
      ...particles,
      label: options.label ?? particles.label ?? "Loading...",
      fadeLabel: options.fadeLabel ?? particles.fadeLabel
    }), options);
  }

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

  // <stdin>
  init_webgl_textured();
  init_webgpu_textured();

  // src/engines/little-3d-engine/loaders/obj.ts
  var DEFAULT_COLORS12 = ["#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#ef4444"];
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
    const colors = options.colors ?? DEFAULT_COLORS12;
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

  // src/engines/little-tween-engine/little-tween-engine.ts
  var LittleTweenEngine = class {
    constructor(options = {}) {
      this.type = options.type ?? "linear";
      this.overextend = options.overextend ?? false;
    }
    /** Map `value` through the selected ease type. */
    value(value, type = this.type, overextend = this.overextend) {
      return ease(type, value, overextend);
    }
  };
  return __toCommonJS(stdin_exports);
})();
