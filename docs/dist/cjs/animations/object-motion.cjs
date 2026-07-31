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

// src/engines/little-3d-engine/core/light.ts
function clamp01(value) {
  return Math.min(1, Math.max(0, value));
}
function clamp255(value) {
  return Math.round(Math.min(255, Math.max(0, value)));
}
function shade(normal, color, light, surface) {
  const lambert = Math.max(0, dot(normal, light.toLight));
  const brightness = clamp01(light.ambient + light.intensity * lambert);
  const [baseR, baseG, baseB] = parseColor(color);
  let r = baseR * brightness;
  let g = baseG * brightness;
  let b = baseB * brightness;
  const material = surface?.material;
  const specular = material?.specular;
  const viewDir = surface?.viewDir;
  if (specular && viewDir && lambert > 0) {
    const half = normalize({
      x: light.toLight.x + viewDir.x,
      y: light.toLight.y + viewDir.y,
      z: light.toLight.z + viewDir.z
    });
    const shininess = material?.shininess ?? 32;
    const highlight = Math.pow(Math.max(0, dot(normal, half)), shininess) * light.intensity * 255;
    r += highlight * specular[0];
    g += highlight * specular[1];
    b += highlight * specular[2];
  }
  const emissive = material?.emissive;
  if (emissive) {
    r += emissive[0] * 255;
    g += emissive[1] * 255;
    b += emissive[2] * 255;
  }
  return [clamp255(r), clamp255(g), clamp255(b)];
}
function shadeColor(normal, color, light, surface) {
  const [r, g, b] = shade(normal, color, light, surface);
  return `rgb(${r}, ${g}, ${b})`;
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
      shade(normal, color, surface) {
        return shadeColor(normal, color, this.params, surface);
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
in vec3 aEmissive;
in vec4 aSpecular;
uniform mat4 uViewProj;
uniform mat4 uModel;
out vec3 vNormal;
out vec3 vColor;
out vec3 vEmissive;
out vec4 vSpecular;
out vec3 vWorldPos;
void main() {
  vNormal = mat3(uModel) * aNormal;
  vColor = aColor;
  vEmissive = aEmissive;
  vSpecular = aSpecular;
  vec4 world = uModel * vec4(aPos, 1.0);
  vWorldPos = world.xyz;
  gl_Position = uViewProj * world;
}`;
    FRAGMENT_SHADER = `#version 300 es
precision mediump float;
in vec3 vNormal;
in vec3 vColor;
in vec3 vEmissive;
in vec4 vSpecular;
in vec3 vWorldPos;
uniform vec3 uToLight;
uniform vec3 uEye;
uniform float uIntensity;
uniform float uAmbient;
uniform float uOpacity;
out vec4 fragColor;
void main() {
  vec3 normal = normalize(vNormal);
  vec3 toLight = normalize(uToLight);
  float lambert = max(dot(normal, toLight), 0.0);
  float brightness = clamp(uAmbient + uIntensity * lambert, 0.0, 1.0);
  vec3 lit = vColor * brightness;
  if (lambert > 0.0) {
    vec3 viewDir = normalize(uEye - vWorldPos);
    vec3 halfVec = normalize(toLight + viewDir);
    float highlight = pow(max(dot(normal, halfVec), 0.0), vSpecular.w) * uIntensity;
    lit += highlight * vSpecular.xyz;
  }
  lit += vEmissive;
  fragColor = vec4(lit, uOpacity);
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
          aEmissive: gl.getAttribLocation(this.program, "aEmissive"),
          aSpecular: gl.getAttribLocation(this.program, "aSpecular"),
          uViewProj: gl.getUniformLocation(this.program, "uViewProj"),
          uModel: gl.getUniformLocation(this.program, "uModel"),
          uToLight: gl.getUniformLocation(this.program, "uToLight"),
          uEye: gl.getUniformLocation(this.program, "uEye"),
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
        const attribute = (location, array, size = 3) => {
          if (location < 0) return;
          const buffer = gl.createBuffer();
          gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
          gl.bufferData(gl.ARRAY_BUFFER, array, gl.STATIC_DRAW);
          gl.enableVertexAttribArray(location);
          gl.vertexAttribPointer(location, size, gl.FLOAT, false, 0, 0);
        };
        attribute(loc.aPos, data.positions);
        attribute(loc.aNormal, data.normals);
        attribute(loc.aColor, data.colors);
        attribute(loc.aEmissive, data.emissives);
        attribute(loc.aSpecular, data.speculars, 4);
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
        gl.uniform3f(loc.uEye, frame.eye.x, frame.eye.y, frame.eye.z);
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
            let surface;
            const material = face.material;
            if (material) {
              if (material.specular) {
                let cx = 0;
                let cy = 0;
                let cz = 0;
                for (const i of face.indices) {
                  cx += world[i].x;
                  cy += world[i].y;
                  cz += world[i].z;
                }
                const inv = 1 / face.indices.length;
                const viewDir = normalize(
                  subtract(frame.eye, { x: cx * inv, y: cy * inv, z: cz * inv })
                );
                surface = { material, viewDir };
              } else {
                surface = { material };
              }
            }
            polygons.push({
              points,
              color: shadeColor(normal, face.color, frame.light, surface),
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

// src/animations/object-motion.ts
var object_motion_exports = {};
__export(object_motion_exports, {
  ObjectMotionAnimation: () => ObjectMotionAnimation,
  centerAndScaleMesh: () => centerAndScaleMesh
});
module.exports = __toCommonJS(object_motion_exports);

// src/animation-label.ts
var LABEL_STYLE = [
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
  container.style.cssText = LABEL_STYLE;
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

// src/engines/little-3d-engine/shapes/primitives/spheres/icosphere.ts
init_geometry();
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

// src/engines/little-3d-engine/shapes/primitives/spheres/octa-sphere.ts
init_geometry();

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
function resolveDirection(input, fallback) {
  return normalizeVector(fallback ?? input.direction ?? input.velocity ?? { x: 1, y: 0, z: 0 });
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
function resolveMesh(mesh) {
  return typeof mesh === "function" ? mesh() : mesh;
}
function applyColor(mesh, color) {
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
function clamp012(value) {
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
    const centered = centerAndScaleMesh(resolveMesh(options.mesh), options.size ?? 1);
    const facing = faceForward(centered, options.facing ?? "+x");
    this.mesh = applyColor(facing, options.color);
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
    const delta = transition.durationMs === 0 ? 1 : clamp012(elapsedMs / transition.durationMs);
    const input = this.transitionInput(phase, delta, elapsedMs, transition.durationMs, start);
    const output = transition.transition(input);
    return this.applyTransitionOutput(input, output, phase, t);
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
  applyTransitionOutput(input, output, phase, t) {
    return {
      position: output.position ?? (phase === "intro" ? this.motion.positionAt(t) : input.position),
      size: output.size ?? input.size ?? 1,
      orientation: output.orientation
    };
  }
};
