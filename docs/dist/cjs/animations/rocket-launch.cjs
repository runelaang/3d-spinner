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
function rotationFromEuler(x, y, z) {
  return multiply(rotationZ(z), multiply(rotationY(y), rotationX(x)));
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
  const ambients = new Float32Array(triangles * 9);
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
    const ambient = face.material?.ambient;
    const ar = ambient ? ambient[0] : 1;
    const ag = ambient ? ambient[1] : 1;
    const ab = ambient ? ambient[2] : 1;
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
        ambients[o] = ar;
        ambients[o + 1] = ag;
        ambients[o + 2] = ab;
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
  return {
    positions,
    normals,
    colors,
    ambients,
    emissives,
    speculars,
    count: positions.length / 3
  };
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
  const material = surface?.material;
  const ambient = material?.ambient;
  const kaR = ambient ? ambient[0] : 1;
  const kaG = ambient ? ambient[1] : 1;
  const kaB = ambient ? ambient[2] : 1;
  const [baseR, baseG, baseB] = parseColor(color);
  let r = baseR * clamp01(light.ambient * kaR + light.intensity * lambert);
  let g = baseG * clamp01(light.ambient * kaG + light.intensity * lambert);
  let b = baseB * clamp01(light.ambient * kaB + light.intensity * lambert);
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

// src/engines/little-3d-engine/core/webgpu-api.ts
function webgpu() {
  return globalThis.navigator?.gpu;
}
function gpuFlags() {
  const globals = globalThis;
  return {
    bufferUsage: globals.GPUBufferUsage,
    textureUsage: globals.GPUTextureUsage,
    shaderStage: globals.GPUShaderStage
  };
}
function webgpuContext(canvas) {
  return canvas.getContext.call(canvas, "webgpu");
}
var init_webgpu_api = __esm({
  "src/engines/little-3d-engine/core/webgpu-api.ts"() {
    "use strict";
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
in vec3 aAmbient;
in vec3 aEmissive;
in vec4 aSpecular;
uniform mat4 uViewProj;
uniform mat4 uModel;
out vec3 vNormal;
out vec3 vColor;
out vec3 vAmbient;
out vec3 vEmissive;
out vec4 vSpecular;
out vec3 vWorldPos;
void main() {
  vNormal = mat3(uModel) * aNormal;
  vColor = aColor;
  vAmbient = aAmbient;
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
in vec3 vAmbient;
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
  vec3 brightness = clamp(uAmbient * vAmbient + uIntensity * lambert, 0.0, 1.0);
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
        this.destroyed = false;
        this.cache = /* @__PURE__ */ new Map();
        this.modelScratch = new Float32Array(16);
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
        this.canvas = canvas;
        this.program = link(gl);
        this.locations = {
          aPos: gl.getAttribLocation(this.program, "aPos"),
          aNormal: gl.getAttribLocation(this.program, "aNormal"),
          aColor: gl.getAttribLocation(this.program, "aColor"),
          aAmbient: gl.getAttribLocation(this.program, "aAmbient"),
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
      getOrCreateMeshBuffers(mesh) {
        const cached = this.cache.get(mesh);
        if (cached) return cached;
        const gl = this.gl;
        const loc = this.locations;
        const data = expandToTriangles(mesh);
        const vao = gl.createVertexArray();
        gl.bindVertexArray(vao);
        const buffers = [];
        const attribute = (location, array, size = 3) => {
          if (location < 0) return;
          const buffer = gl.createBuffer();
          buffers.push(buffer);
          gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
          gl.bufferData(gl.ARRAY_BUFFER, array, gl.STATIC_DRAW);
          gl.enableVertexAttribArray(location);
          gl.vertexAttribPointer(location, size, gl.FLOAT, false, 0, 0);
        };
        attribute(loc.aPos, data.positions);
        attribute(loc.aNormal, data.normals);
        attribute(loc.aColor, data.colors);
        attribute(loc.aAmbient, data.ambients);
        attribute(loc.aEmissive, data.emissives);
        attribute(loc.aSpecular, data.speculars, 4);
        gl.bindVertexArray(null);
        const result = { vao, buffers, count: data.count };
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
          const mesh = this.getOrCreateMeshBuffers(item.mesh);
          this.modelScratch.set(item.model);
          gl.uniformMatrix4fv(loc.uModel, false, this.modelScratch);
          gl.uniform1f(loc.uOpacity, 1);
          gl.bindVertexArray(mesh.vao);
          gl.drawArrays(gl.TRIANGLES, 0, mesh.count);
        }
        gl.enable(gl.BLEND);
        gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
        gl.depthMask(false);
        for (const item of frame.items) {
          const transparency = item.transparency;
          if (!transparency) continue;
          const mesh = this.getOrCreateMeshBuffers(item.mesh);
          this.modelScratch.set(item.model);
          gl.uniformMatrix4fv(loc.uModel, false, this.modelScratch);
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
      /** Delete the vertex array and buffers cached for `mesh`. */
      releaseMesh(mesh) {
        const cached = this.cache.get(mesh);
        if (!cached) return;
        this.cache.delete(mesh);
        const gl = this.gl;
        if (!gl) return;
        gl.deleteVertexArray(cached.vao);
        for (const buffer of cached.buffers) gl.deleteBuffer(buffer);
      }
      /** Tell `listener` when the WebGL context is lost, unless this renderer lost it on purpose. */
      onLost(listener) {
        this.canvas?.addEventListener(
          "webglcontextlost",
          () => {
            if (!this.destroyed) listener("WebGL context lost");
          },
          { once: true }
        );
      }
      destroy() {
        this.destroyed = true;
        const gl = this.gl;
        if (gl) {
          for (const mesh of [...this.cache.keys()]) this.releaseMesh(mesh);
          if (this.program) gl.deleteProgram(this.program);
          gl.getExtension("WEBGL_lose_context")?.loseContext();
        }
        this.cache.clear();
        this.gl = void 0;
        this.canvas = void 0;
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
    init_webgpu_api();
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
  @location(2) ambient: vec3<f32>,
  @location(3) emissive: vec3<f32>,
  @location(4) specular: vec4<f32>,
  @location(5) worldPos: vec3<f32>,
};

@vertex
fn vs(@location(0) pos: vec3<f32>, @location(1) normal: vec3<f32>, @location(2) color: vec3<f32>, @location(3) ambient: vec3<f32>, @location(4) emissive: vec3<f32>, @location(5) specular: vec4<f32>) -> VSOut {
  var out: VSOut;
  let m = mat3x3<f32>(u.model[0].xyz, u.model[1].xyz, u.model[2].xyz);
  out.normal = m * normal;
  out.color = color;
  out.ambient = ambient;
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
  let brightness = clamp(u.params.y * in.ambient + vec3<f32>(u.params.x * lambert), vec3<f32>(0.0), vec3<f32>(1.0));
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
        this.uniformScratch = new Float32Array(UNIFORM_STRIDE / 4);
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
        const gpu = webgpu();
        if (!gpu) throw new Error("3d-spinner: WebGPU is not supported in this browser.");
        const adapter = await gpu.requestAdapter();
        if (!adapter) throw new Error("3d-spinner: no WebGPU adapter is available.");
        const device = await adapter.requestDevice();
        if (this.destroyed) {
          device.destroy();
          return;
        }
        this.device = device;
        this.canvas = canvas;
        const context = webgpuContext(canvas);
        if (!context) throw new Error("3d-spinner: could not get a WebGPU canvas context.");
        this.context = context;
        const format = gpu.getPreferredCanvasFormat();
        this.format = format;
        const pipelines = await this.validated(
          device,
          () => this.createPipelines(device, context, format)
        );
        if (this.destroyed) return;
        this.pipelines = pipelines;
      }
      /** Configure the canvas for `device` and build the opaque and transparent pipelines. */
      async createPipelines(device, context, format) {
        context.configure({ device, format, alphaMode: this.alphaMode });
        const module2 = device.createShaderModule({ code: WGSL });
        const stage = gpuFlags().shaderStage;
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
          attributes: [{ shaderLocation: location, offset: 0, format: `float32x${components}` }]
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
        const pipeline = (cullMode, transparent) => device.createRenderPipelineAsync({
          layout: pipelineLayout,
          vertex: {
            module: module2,
            entryPoint: "vs",
            buffers: [
              vertexBuffer(0),
              vertexBuffer(1),
              vertexBuffer(2),
              vertexBuffer(3),
              vertexBuffer(4),
              vertexBuffer(5, 4)
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
        const [opaque, transparentBack, transparentFront] = await Promise.all([
          pipeline("back", false),
          pipeline("front", true),
          pipeline("back", true)
        ]);
        return { opaque, transparentBack, transparentFront };
      }
      /**
       * Run `setup` inside a WebGPU validation error scope and throw if it reported
       * an error. Most WebGPU calls report mistakes that way instead of throwing, so
       * without the scope a broken setup would look like success and `"auto"` would
       * not fall back. `setup` must make its GPU calls before its first `await`.
       */
      async validated(device, setup) {
        device.pushErrorScope("validation");
        const [result, error] = await Promise.all([setup(), device.popErrorScope()]);
        if (error) throw new Error(`3d-spinner: WebGPU setup failed: ${error.message}`);
        return result;
      }
      resize() {
        this.ensureDepth();
      }
      /** The depth texture for the current canvas size, recreated when the size changes. */
      ensureDepth() {
        const canvas = this.canvas;
        const device = this.device;
        if (!device || !canvas) return void 0;
        const width = Math.max(1, canvas.width);
        const height = Math.max(1, canvas.height);
        const key = `${width}x${height}`;
        if (key === this.depthSize && this.depthTexture) return this.depthTexture;
        this.depthTexture?.destroy();
        this.depthTexture = device.createTexture({
          size: { width, height },
          format: "depth24plus",
          usage: gpuFlags().textureUsage.RENDER_ATTACHMENT
        });
        this.depthSize = key;
        return this.depthTexture;
      }
      getOrCreateMeshBuffers(device, mesh) {
        const cached = this.cache.get(mesh);
        if (cached) return cached;
        const data = expandToTriangles(mesh);
        const flags = gpuFlags().bufferUsage;
        const usage = flags.VERTEX | flags.COPY_DST;
        const upload = (array) => {
          const buffer = device.createBuffer({ size: array.byteLength, usage });
          device.queue.writeBuffer(buffer, 0, array);
          return buffer;
        };
        const result = {
          position: upload(data.positions),
          normal: upload(data.normals),
          color: upload(data.colors),
          ambient: upload(data.ambients),
          emissive: upload(data.emissives),
          specular: upload(data.speculars),
          count: data.count
        };
        this.cache.set(mesh, result);
        return result;
      }
      /** The uniform buffer, grown to hold at least `draws` uniform blocks. */
      ensureUniformCapacity(device, draws) {
        if (draws <= this.uniformCapacity && this.uniformBuffer) return this.uniformBuffer;
        this.uniformBuffer?.destroy();
        const flags = gpuFlags().bufferUsage;
        this.uniformBuffer = device.createBuffer({
          size: Math.max(1, draws) * UNIFORM_STRIDE,
          usage: flags.UNIFORM | flags.COPY_DST
        });
        this.uniformCapacity = draws;
        return this.uniformBuffer;
      }
      render(frame) {
        const device = this.device;
        const context = this.context;
        const pipelines = this.pipelines;
        if (this.destroyed || !device || !context || !pipelines) return;
        if (frame.width === 0 || frame.height === 0 || frame.items.length === 0) return;
        const depth = this.ensureDepth();
        if (!depth) return;
        const draws = [];
        for (const item of frame.items) {
          if (!item.transparency) draws.push({ item, opacity: 1, pipeline: pipelines.opaque });
        }
        for (const item of frame.items) {
          const transparency = item.transparency;
          if (!transparency) continue;
          if (transparency.mode === "two-sided") {
            const resolved = resolveTwoSidedOpacity(transparency);
            draws.push({
              item,
              opacity: resolved.back,
              pipeline: pipelines.transparentBack
            });
            draws.push({
              item,
              opacity: resolved.front,
              pipeline: pipelines.transparentFront
            });
          } else {
            draws.push({
              item,
              opacity: opacity(transparency.opacity, DEFAULT_ONE_SIDED_OPACITY),
              pipeline: pipelines.transparentFront
            });
          }
        }
        const uniforms = this.ensureUniformCapacity(device, draws.length);
        const viewProj = multiply(CLIP_Z_FIX, frame.viewProjection);
        const bindGroup = device.createBindGroup({
          layout: pipelines.opaque.getBindGroupLayout(0),
          entries: [{ binding: 0, resource: { buffer: uniforms, offset: 0, size: 176 } }]
        });
        draws.forEach((draw, i) => {
          const data = this.uniformScratch;
          data.set(viewProj, 0);
          data.set(draw.item.model, 16);
          data.set([frame.light.toLight.x, frame.light.toLight.y, frame.light.toLight.z, 0], 32);
          data.set([frame.light.intensity, frame.light.ambient, draw.opacity, 0], 36);
          data.set([frame.eye.x, frame.eye.y, frame.eye.z, 0], 40);
          device.queue.writeBuffer(uniforms, i * UNIFORM_STRIDE, data);
        });
        const encoder = device.createCommandEncoder();
        const pass = encoder.beginRenderPass({
          colorAttachments: [
            {
              view: context.getCurrentTexture().createView(),
              clearValue: this.clearValue,
              loadOp: "clear",
              storeOp: "store"
            }
          ],
          depthStencilAttachment: {
            view: depth.createView(),
            depthClearValue: 1,
            depthLoadOp: "clear",
            depthStoreOp: "store"
          }
        });
        draws.forEach((draw, i) => {
          const mesh = this.getOrCreateMeshBuffers(device, draw.item.mesh);
          pass.setPipeline(draw.pipeline);
          pass.setBindGroup(0, bindGroup, [i * UNIFORM_STRIDE]);
          pass.setVertexBuffer(0, mesh.position);
          pass.setVertexBuffer(1, mesh.normal);
          pass.setVertexBuffer(2, mesh.color);
          pass.setVertexBuffer(3, mesh.ambient);
          pass.setVertexBuffer(4, mesh.emissive);
          pass.setVertexBuffer(5, mesh.specular);
          pass.draw(mesh.count);
        });
        pass.end();
        device.queue.submit([encoder.finish()]);
      }
      /** Destroy the vertex buffers cached for `mesh`. */
      releaseMesh(mesh) {
        const cached = this.cache.get(mesh);
        if (!cached) return;
        this.cache.delete(mesh);
        cached.position.destroy();
        cached.normal.destroy();
        cached.color.destroy();
        cached.ambient.destroy();
        cached.emissive.destroy();
        cached.specular.destroy();
      }
      /** Tell `listener` when the GPU device is lost, unless this renderer destroyed it. */
      onLost(listener) {
        void this.device?.lost.then((info) => {
          if (!this.destroyed) listener(info.message || `WebGPU device ${info.reason}`);
        });
      }
      destroy() {
        this.destroyed = true;
        for (const mesh of [...this.cache.keys()]) this.releaseMesh(mesh);
        this.uniformBuffer?.destroy();
        this.depthTexture?.destroy();
        this.device?.destroy();
        this.device = void 0;
        this.context = void 0;
        this.pipelines = void 0;
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
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("3d-spinner: could not create a Canvas 2D rendering context.");
        this.ctx = ctx;
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
            if (face.material?.opacity != null) faceOpacity *= face.material.opacity;
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
function chooseBackend(support) {
  if (support.webgpu) return "webgpu";
  if (support.webgl) return "webgl";
  return "canvas2d";
}
async function detectBackendSupport() {
  return { webgpu: await hasWebGPU(), webgl: hasWebGL2() };
}
async function hasWebGPU() {
  const gpu = webgpu();
  if (!gpu) return false;
  try {
    return Boolean(await gpu.requestAdapter());
  } catch {
    return false;
  }
}
function hasWebGL2() {
  const doc = globalThis.document;
  if (!doc?.createElement) return false;
  try {
    const gl = doc.createElement("canvas").getContext("webgl2");
    if (!gl) return false;
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return true;
  } catch {
    return false;
  }
}
async function resolveBackend(backend) {
  if (backend !== "auto") return backend;
  supportProbe ?? (supportProbe = detectBackendSupport());
  return chooseBackend(await supportProbe);
}
function autoBackendCandidates(support) {
  const candidates = [];
  if (support.webgpu) candidates.push("webgpu");
  if (support.webgl) candidates.push("webgl");
  candidates.push("canvas2d");
  return candidates;
}
async function resolveAutoCandidates() {
  supportProbe ?? (supportProbe = detectBackendSupport());
  return autoBackendCandidates(await supportProbe);
}
function opacity(value, fallback) {
  return Math.max(0, Math.min(1, value ?? fallback));
}
function resolveTwoSidedOpacity(transparency) {
  const front = opacity(transparency.frontOpacity ?? transparency.opacity, DEFAULT_FRONT_OPACITY);
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
  switch (await resolveBackend(backend)) {
    case "webgl":
      return new (await Promise.resolve().then(() => (init_webgl(), webgl_exports))).WebGLRenderer(options);
    case "webgpu":
      return new (await Promise.resolve().then(() => (init_webgpu(), webgpu_exports))).WebGPURenderer(options);
    case "canvas2d":
    default:
      return new (await Promise.resolve().then(() => (init_canvas2d(), canvas2d_exports))).Canvas2DRenderer(options);
  }
}
var supportProbe, DEFAULT_ONE_SIDED_OPACITY, DEFAULT_BACK_OPACITY, DEFAULT_FRONT_OPACITY;
var init_renderer = __esm({
  "src/engines/little-3d-engine/renderer.ts"() {
    "use strict";
    init_webgpu_api();
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
    init_webgpu_api();
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
        this.texturedScratch = new Float32Array(UNIFORM_STRIDE2 / 4);
      }
      /**
       * Texture every instance of `mesh` with `source`. Call any time, also before
       * init; a new source replaces the one already uploaded.
       */
      setTexture(mesh, source) {
        if (this.sources.get(mesh) === source) return;
        this.sources.set(mesh, source);
        const texture = this.textures.get(mesh);
        if (!texture) return;
        this.textures.delete(mesh);
        this.retired.push(texture);
      }
      async init(canvas) {
        await super.init(canvas);
        const device = this.device;
        const format = this.format;
        if (!device || !format || this.destroyed) return;
        const textured = await this.validated(
          device,
          () => this.createTexturedPipeline(device, format)
        );
        if (this.destroyed) return;
        this.textured = textured;
      }
      /** Build the pipeline and sampler for textured meshes. */
      async createTexturedPipeline(device, format) {
        const module2 = device.createShaderModule({ code: WGSL2 });
        const stage = gpuFlags().shaderStage;
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
        const sampler = device.createSampler({ magFilter: "linear", minFilter: "linear" });
        const pipeline = await device.createRenderPipelineAsync({
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
        return { pipeline, sampler };
      }
      /** The texture for `mesh`: a white placeholder until its source has been uploaded. */
      textureFor(device, mesh) {
        const cached = this.textures.get(mesh);
        if (cached) return cached;
        const usage = gpuFlags().textureUsage;
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
          const current = this.device;
          if (this.destroyed || !current || this.textures.get(mesh) !== white) return;
          const size = image;
          const width = size.width || 1;
          const height = size.height || 1;
          const texture = current.createTexture({
            size: { width, height },
            format: "rgba8unorm",
            usage: usage.TEXTURE_BINDING | usage.COPY_DST | usage.RENDER_ATTACHMENT
          });
          current.queue.copyExternalImageToTexture({ source: image }, { texture }, { width, height });
          this.retired.push(white);
          this.textures.set(mesh, texture);
          this.bindGroups.delete(mesh);
        };
        const source = this.sources.get(mesh);
        if (typeof source === "string") {
          const image = new Image();
          image.onload = () => void upload(image);
          image.src = source;
        } else if (source) {
          void upload(source);
        }
        return this.textures.get(mesh) ?? white;
      }
      getOrCreateTexturedBuffers(device, mesh) {
        const cached = this.texturedBuffers.get(mesh);
        if (cached) return cached;
        const data = expandToTriangles(mesh);
        const flags = gpuFlags().bufferUsage;
        const usage = flags.VERTEX | flags.COPY_DST;
        const upload = (array) => {
          const buffer = device.createBuffer({ size: array.byteLength, usage });
          device.queue.writeBuffer(buffer, 0, array);
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
      /** The bind group for `mesh`, rebuilt when its texture or the uniform buffer changes. */
      bindGroupFor(device, textured, uniforms, mesh) {
        const texture = this.textureFor(device, mesh);
        const cached = this.bindGroups.get(mesh);
        if (cached && cached.buffer === uniforms && cached.texture === texture) {
          return cached.group;
        }
        const group = device.createBindGroup({
          layout: textured.pipeline.getBindGroupLayout(0),
          entries: [
            { binding: 0, resource: { buffer: uniforms, offset: 0, size: 144 } },
            { binding: 1, resource: texture.createView() },
            { binding: 2, resource: textured.sampler }
          ]
        });
        this.bindGroups.set(mesh, { group, buffer: uniforms, texture });
        return group;
      }
      /** The textured uniform buffer, grown to hold at least `draws` uniform blocks. */
      ensureTexturedCapacity(device, draws) {
        if (draws <= this.texturedCapacity && this.texturedUniforms) return this.texturedUniforms;
        this.texturedUniforms?.destroy();
        const flags = gpuFlags().bufferUsage;
        this.texturedUniforms = device.createBuffer({
          size: draws * UNIFORM_STRIDE2,
          usage: flags.UNIFORM | flags.COPY_DST
        });
        this.texturedCapacity = draws;
        return this.texturedUniforms;
      }
      render(frame) {
        const plain = [];
        const texturedItems = [];
        for (const item of frame.items) {
          (this.sources.has(item.mesh) ? texturedItems : plain).push(item);
        }
        super.render(texturedItems.length ? { ...frame, items: plain } : frame);
        if (!texturedItems.length) return;
        const device = this.device;
        const context = this.context;
        const textured = this.textured;
        if (this.destroyed || !device || !context || !textured) return;
        if (frame.width === 0 || frame.height === 0) return;
        const depth = this.ensureDepth();
        if (!depth) return;
        const uniforms = this.ensureTexturedCapacity(device, texturedItems.length);
        const viewProj = multiply(CLIP_Z_FIX2, frame.viewProjection);
        texturedItems.forEach((item, i) => {
          const data = this.texturedScratch;
          data.set(viewProj, 0);
          data.set(item.model, 16);
          data.set([itemOpacity(item.transparency), 0, 0, 0], 32);
          device.queue.writeBuffer(uniforms, i * UNIFORM_STRIDE2, data);
        });
        const cleared = plain.length > 0;
        const encoder = device.createCommandEncoder();
        const pass = encoder.beginRenderPass({
          colorAttachments: [
            {
              view: context.getCurrentTexture().createView(),
              clearValue: this.clearValue,
              loadOp: cleared ? "load" : "clear",
              storeOp: "store"
            }
          ],
          depthStencilAttachment: {
            view: depth.createView(),
            depthClearValue: 1,
            depthLoadOp: cleared ? "load" : "clear",
            depthStoreOp: "store"
          }
        });
        pass.setPipeline(textured.pipeline);
        texturedItems.forEach((item, i) => {
          const mesh = this.getOrCreateTexturedBuffers(device, item.mesh);
          pass.setBindGroup(0, this.bindGroupFor(device, textured, uniforms, item.mesh), [
            i * UNIFORM_STRIDE2
          ]);
          pass.setVertexBuffer(0, mesh.position);
          pass.setVertexBuffer(1, mesh.uv);
          pass.setVertexBuffer(2, mesh.color);
          pass.draw(mesh.count);
        });
        pass.end();
        device.queue.submit([encoder.finish()]);
      }
      /** Free the buffers cached for `mesh`, textured or plain. Its texture stays registered. */
      releaseMesh(mesh) {
        super.releaseMesh(mesh);
        const cached = this.texturedBuffers.get(mesh);
        if (!cached) return;
        this.texturedBuffers.delete(mesh);
        cached.position.destroy();
        cached.uv.destroy();
        cached.color.destroy();
      }
      destroy() {
        for (const texture of this.textures.values()) texture.destroy();
        for (const texture of this.retired.splice(0)) texture.destroy();
        for (const mesh of [...this.texturedBuffers.keys()]) this.releaseMesh(mesh);
        this.textures.clear();
        this.bindGroups.clear();
        this.sources.clear();
        this.texturedUniforms?.destroy();
        this.texturedUniforms = void 0;
        this.textured = void 0;
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
        this.modelScratch = new Float32Array(16);
        this.inner = new WebGLRenderer(options);
      }
      /**
       * Texture every instance of `mesh` with `source`. Call any time, also before
       * init; a new source replaces the one already uploaded.
       */
      setTexture(mesh, source) {
        if (this.sources.get(mesh) === source) return;
        this.sources.set(mesh, source);
        const texture = this.textures.get(mesh);
        if (!texture) return;
        this.textures.delete(mesh);
        this.gl?.deleteTexture(texture);
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
          this.gl.texImage2D(
            this.gl.TEXTURE_2D,
            0,
            this.gl.RGBA,
            this.gl.RGBA,
            this.gl.UNSIGNED_BYTE,
            image
          );
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
      getOrCreateTexturedBuffers(mesh) {
        const cached = this.buffers.get(mesh);
        if (cached) return cached;
        const gl = this.gl;
        const loc = this.locations;
        const data = expandToTriangles(mesh);
        const vao = gl.createVertexArray();
        gl.bindVertexArray(vao);
        const buffers = [];
        const attribute = (location, array, size) => {
          if (location < 0) return;
          const buffer = gl.createBuffer();
          buffers.push(buffer);
          gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
          gl.bufferData(gl.ARRAY_BUFFER, array, gl.STATIC_DRAW);
          gl.enableVertexAttribArray(location);
          gl.vertexAttribPointer(location, size, gl.FLOAT, false, 0, 0);
        };
        attribute(loc.aPos, data.positions, 3);
        attribute(loc.aColor, data.colors, 3);
        attribute(loc.aUV, planarUVs(mesh), 2);
        gl.bindVertexArray(null);
        const result = { vao, buffers, count: data.count };
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
        gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
        gl.depthMask(false);
        for (const item of textured) {
          const buffers = this.getOrCreateTexturedBuffers(item.mesh);
          gl.bindTexture(gl.TEXTURE_2D, this.textureFor(item.mesh));
          this.modelScratch.set(item.model);
          gl.uniformMatrix4fv(loc.uModel, false, this.modelScratch);
          gl.uniform1f(loc.uOpacity, itemOpacity2(item.transparency));
          gl.bindVertexArray(buffers.vao);
          gl.drawArrays(gl.TRIANGLES, 0, buffers.count);
        }
        gl.depthMask(true);
        gl.disable(gl.BLEND);
        gl.bindVertexArray(null);
      }
      /** Free the buffers cached for `mesh`, textured or plain. Its texture stays registered. */
      releaseMesh(mesh) {
        this.inner.releaseMesh(mesh);
        const cached = this.buffers.get(mesh);
        if (!cached) return;
        this.buffers.delete(mesh);
        const gl = this.gl;
        if (!gl) return;
        gl.deleteVertexArray(cached.vao);
        for (const buffer of cached.buffers) gl.deleteBuffer(buffer);
      }
      /** Tell `listener` when the WebGL context is lost, unless this renderer lost it on purpose. */
      onLost(listener) {
        this.inner.onLost(listener);
      }
      destroy() {
        const gl = this.gl;
        if (gl) {
          for (const texture of this.textures.values()) gl.deleteTexture(texture);
          for (const mesh of [...this.buffers.keys()]) this.releaseMesh(mesh);
          if (this.program) gl.deleteProgram(this.program);
        }
        this.textures.clear();
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
        this.ctx = canvas.getContext("2d");
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
            return {
              x: (ndc.x * 0.5 + 0.5) * frame.width,
              y: (1 - (ndc.y * 0.5 + 0.5)) * frame.height
            };
          });
          const face = item.mesh.faces[0];
          if (!face || face.indices.length !== 4) continue;
          const [a, b, c, d] = face.indices.map((index) => projected[index]);
          ctx.globalAlpha = item.transparency?.mode === "one-sided" ? opacity(item.transparency.opacity, DEFAULT_ONE_SIDED_OPACITY) : 1;
          drawMappedTriangle(
            ctx,
            image,
            [
              { x: 0, y: size.height },
              { x: size.width, y: size.height },
              { x: size.width, y: 0 }
            ],
            [a, b, c]
          );
          drawMappedTriangle(
            ctx,
            image,
            [
              { x: 0, y: size.height },
              { x: size.width, y: 0 },
              { x: 0, y: 0 }
            ],
            [a, c, d]
          );
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

// src/animations/rocket-launch.ts
var rocket_launch_exports = {};
__export(rocket_launch_exports, {
  RocketLaunchAnimation: () => RocketLaunchAnimation
});
module.exports = __toCommonJS(rocket_launch_exports);

// src/mount-host.ts
function prepareHost(target) {
  const position = getComputedStyle(target).position;
  if (position === "static" || position === "") target.style.position = "relative";
}

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
  let text = "";
  if (typeof content === "object") {
    (_a = content.style).pointerEvents || (_a.pointerEvents = "auto");
    container.appendChild(content);
  } else {
    container.setAttribute("aria-hidden", "true");
    if (content) container.textContent = text = content;
  }
  target.appendChild(container);
  return {
    container,
    setText(value) {
      if (typeof content === "object" || value === text) return;
      text = value;
      container.textContent = value;
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
    this.options = {
      ...DEFAULTS,
      ...options,
      position: { ...options?.position ?? DEFAULTS.position }
    };
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
  /**
   * How far a sphere of `radius` centered at `point` has to travel along the
   * unit vector `direction` until it is entirely out of view for a viewport of
   * `aspect` (width / height). Returns 0 when it is already out of view.
   */
  distanceToLeaveView(point, direction, radius, aspect) {
    const { position, fov, near, far } = this.options;
    const q = { x: point.x - position.x, y: point.y - position.y, z: point.z - position.z };
    const tanY = Math.tan(fov / 2);
    const tanX = tanY * aspect;
    const hx = Math.hypot(1, tanX);
    const hy = Math.hypot(1, tanY);
    const planes = [
      [{ x: 1 / hx, y: 0, z: tanX / hx }, 0],
      [{ x: -1 / hx, y: 0, z: tanX / hx }, 0],
      [{ x: 0, y: 1 / hy, z: tanY / hy }, 0],
      [{ x: 0, y: -1 / hy, z: tanY / hy }, 0],
      [{ x: 0, y: 0, z: 1 }, near],
      [{ x: 0, y: 0, z: -1 }, -far]
    ];
    let closest = Infinity;
    for (const [normal, offset] of planes) {
      const outside = normal.x * q.x + normal.y * q.y + normal.z * q.z + offset;
      if (outside >= radius) return 0;
      const rate = normal.x * direction.x + normal.y * direction.y + normal.z * direction.z;
      if (rate > 1e-12) closest = Math.min(closest, (radius - outside) / rate);
    }
    return Number.isFinite(closest) ? closest : 0;
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
function attachMaterial(mesh, material) {
  if (material) {
    for (const face of mesh.faces) face.material = material;
  }
  return mesh;
}
function transform(init) {
  return {
    position: init?.position ?? { x: 0, y: 0, z: 0 },
    rotation: init?.rotation ?? { x: 0, y: 0, z: 0 },
    scale: init?.scale ?? 1
  };
}

// src/engines/little-3d-engine/little-3d-engine.ts
init_renderer();

// src/engines/little-3d-engine/shapes/primitives/quad.ts
var DEFAULT_COLORS = ["#3b82f6"];
function quad(size = 1, colors = DEFAULT_COLORS, material) {
  const s = size / 2;
  const vertices = [
    { x: -s, y: -s, z: 0 },
    { x: s, y: -s, z: 0 },
    { x: s, y: s, z: 0 },
    { x: -s, y: s, z: 0 }
  ];
  return attachMaterial(
    { vertices, faces: [{ indices: [0, 1, 2, 3], color: colors[0 % colors.length] }] },
    material
  );
}

// src/engines/little-3d-engine/shapes/primitives/pyramid.ts
var DEFAULT_COLORS2 = ["#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981"];
function pyramid(size = 1, colors = DEFAULT_COLORS2, material) {
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
  return attachMaterial({ vertices, faces }, material);
}

// src/engines/little-3d-engine/textures/dynamic/canvas-texture.ts
function canvasTexture(draw, size = 96) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (ctx) draw(ctx);
  return canvas;
}

// src/engines/little-3d-engine/little-3d-engine.ts
function modelMatrix(t) {
  const rotation = rotationFromEuler(t.rotation.x, t.rotation.y, t.rotation.z);
  return multiply(
    translation(t.position.x, t.position.y, t.position.z),
    multiply(rotation, scaleMatrix(t.scale))
  );
}
function detach(surface) {
  surface.observer.disconnect();
  surface.canvas.remove();
}
function release(surface) {
  const renderer = surface.renderer;
  surface.renderer = void 0;
  try {
    renderer?.destroy();
  } finally {
    detach(surface);
  }
}
function failure(candidate, error) {
  const name = typeof candidate === "string" ? candidate : "custom";
  return `${name}: ${error instanceof Error ? error.message : String(error)}`;
}
var Little3dEngine = class {
  constructor(options = {}) {
    this.scene = [];
    /** The candidates after the mounted one, to switch to if its renderer is lost. */
    this.fallbacks = [];
    this.state = "idle";
    this.generation = 0;
    this.rafId = 0;
    this.running = false;
    this.camera = new Camera(options.camera);
    this.light = new Light(options.light);
    this.backend = options.backend ?? "auto";
    this.rendererFor = options.rendererFor;
    this.background = options.background;
  }
  /**
   * Create the canvas inside `target`, load the selected backend, and start
   * tracking size. Resolves once the renderer is ready; rejects if the backend
   * is unavailable. With `"auto"`, a backend that fails to load or initialize
   * is replaced by the next one (WebGPU, WebGL, Canvas 2D), and the promise
   * rejects only when all of them fail. Drawing is a no-op until it resolves.
   * If the GPU device or WebGL context is lost later, `"auto"` switches to the
   * next backend in the same order.
   *
   * An engine mounts into one element at a time: mounting again while mounting or
   * mounted rejects. {@link destroy} keeps the scene, so a destroyed engine can be
   * mounted again, for example into another element. Destroying while mounting
   * resolves the pending mount at once, even if a backend is still starting.
   */
  async mount(target) {
    if (this.state !== "idle") {
      throw new Error(
        "3d-spinner: this engine is already mounted. Call destroy() before mounting it again."
      );
    }
    this.state = "mounting";
    const generation = this.generation;
    const cancelled = new Promise((resolve) => {
      this.cancelMount = resolve;
    });
    const starting = this.candidates().then(
      (candidates) => this.startRenderer(target, generation, candidates)
    );
    try {
      await Promise.race([starting, cancelled]);
    } catch (error) {
      if (generation === this.generation) this.state = "idle";
      throw error;
    } finally {
      if (generation === this.generation) this.cancelMount = void 0;
    }
  }
  /** The backends to try, best first: every supported one for `"auto"`, else the chosen one. */
  async candidates() {
    return this.backend === "auto" ? resolveAutoCandidates() : [this.backend];
  }
  /** Mount the first candidate that starts, or reject with every candidate's error. */
  async startRenderer(target, generation, candidates) {
    const failures = [];
    for (const [index, candidate] of candidates.entries()) {
      if (generation !== this.generation) return;
      try {
        const surface = await this.startSurface(target, generation, candidate);
        if (!surface) return;
        this.surface = surface;
        this.fallbacks = candidates.slice(index + 1);
        this.state = "mounted";
        surface.renderer?.onLost?.((reason) => this.recover(surface, target, reason));
        return;
      } catch (error) {
        if (generation !== this.generation) return;
        if (candidates.length === 1) throw error;
        failures.push(failure(candidate, error));
      }
    }
    throw new Error(`3d-spinner: no renderer could start (${failures.join("; ")})`);
  }
  /**
   * Replace a mounted renderer that stopped working with the next backend
   * `"auto"` would have tried. `mount()` has resolved by then, so there is no
   * promise left to reject: when no backend is left or none starts, the canvas
   * stays removed and a console warning says why.
   */
  recover(surface, target, reason) {
    if (this.surface !== surface) return;
    this.surface = void 0;
    try {
      release(surface);
    } catch {
    }
    const warn = (detail) => console.warn(`3d-spinner: the renderer stopped working (${reason}); ${detail}`);
    if (this.fallbacks.length === 0) {
      warn("no other backend is left.");
      return;
    }
    this.startRenderer(target, this.generation, this.fallbacks).catch((error) => {
      warn(`switching failed: ${error instanceof Error ? error.message : String(error)}`);
    });
  }
  /**
   * Start `candidate` on a fresh canvas and size it. Resolves with the started
   * surface, or `undefined` when the engine was destroyed meanwhile. On failure
   * or cancellation, everything the attempt created is released first.
   */
  async startSurface(target, generation, candidate) {
    const surface = this.openSurface(target);
    this.attempt = surface;
    try {
      surface.renderer = await this.createRenderer(candidate);
      if (generation === this.generation) {
        await surface.renderer.init(surface.canvas);
        surface.started = true;
        this.resize(surface);
      }
    } catch (error) {
      try {
        release(surface);
      } catch {
      }
      throw error;
    } finally {
      if (this.attempt === surface) this.attempt = void 0;
    }
    if (generation === this.generation) return surface;
    release(surface);
    return void 0;
  }
  /** Construct the renderer for `candidate`, through `rendererFor` when it is set. */
  async createRenderer(candidate) {
    const options = { background: this.background };
    return typeof candidate === "string" && this.rendererFor ? this.rendererFor(candidate, options) : createRenderer(candidate, options);
  }
  /** Append a fresh full-size canvas to `target` and start tracking its size. */
  openSurface(target) {
    const canvas = document.createElement("canvas");
    canvas.style.display = "block";
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    target.appendChild(canvas);
    const surface = {
      canvas,
      observer: new ResizeObserver(() => this.resize(surface)),
      cssWidth: 0,
      cssHeight: 0,
      started: false
    };
    surface.observer.observe(canvas);
    this.resize(surface);
    return surface;
  }
  /** Add a mesh to the scene and return a handle for animating it. */
  add(mesh, init) {
    const entry = {
      mesh,
      transform: transform(init),
      transparency: init?.transparency,
      remove: () => {
        const i = this.scene.indexOf(entry);
        if (i < 0) return;
        this.scene.splice(i, 1);
        if (!this.scene.some((other) => other.mesh === mesh)) {
          this.surface?.renderer?.releaseMesh?.(mesh);
        }
      }
    };
    this.scene.push(entry);
    return entry;
  }
  /** Match the canvas's pixel size to its CSS size, and tell a started renderer. */
  resize(surface) {
    const { canvas } = surface;
    const dpr = window.devicePixelRatio || 1;
    surface.cssWidth = canvas.clientWidth || canvas.parentElement?.clientWidth || 0;
    surface.cssHeight = canvas.clientHeight || canvas.parentElement?.clientHeight || 0;
    canvas.width = Math.max(1, Math.round(surface.cssWidth * dpr));
    canvas.height = Math.max(1, Math.round(surface.cssHeight * dpr));
    if (surface.started) surface.renderer?.resize(surface.cssWidth, surface.cssHeight, dpr);
  }
  /** Draw a single frame from the current scene state. */
  render() {
    const surface = this.surface;
    const renderer = surface?.renderer;
    if (!surface || !renderer) return;
    const width = surface.cssWidth;
    const height = surface.cssHeight;
    if (width === 0 || height === 0) return;
    const items = this.scene.map((entry) => ({
      mesh: entry.mesh,
      model: modelMatrix(entry.transform),
      transparency: entry.transparency
    }));
    const eye = this.camera.options.position;
    renderer.render({
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
    this.cancelMount?.();
    this.cancelMount = void 0;
    this.state = "idle";
    this.stop();
    const { surface, attempt } = this;
    this.surface = void 0;
    this.attempt = void 0;
    this.fallbacks = [];
    if (attempt) detach(attempt);
    if (surface) release(surface);
  }
};

// src/engines/little-3d-engine/textured-renderer.ts
async function createTexturedRenderer(backend, options, textures) {
  const renderer = backend === "webgpu" ? new (await Promise.resolve().then(() => (init_webgpu_textured(), webgpu_textured_exports))).WebGPUTexturedRenderer(options) : backend === "webgl" ? new (await Promise.resolve().then(() => (init_webgl_textured(), webgl_textured_exports))).WebGLTexturedRenderer(options) : new (await Promise.resolve().then(() => (init_canvas2d_textured(), canvas2d_textured_exports))).Canvas2DTexturedRenderer(options);
  for (const [mesh, source] of textures) renderer.setTexture(mesh, source);
  return renderer;
}

// src/engines/little-tween-engine/core/tweens.ts
function input(value, allowExtrapolation) {
  if (Number.isNaN(value)) return 0;
  if (allowExtrapolation) return value;
  return Math.min(1, Math.max(0, value));
}
function easeOutBack(value, allowExtrapolation = false) {
  const x = input(value, allowExtrapolation);
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
}

// src/animations/rocket-launch.ts
var ROCKETS = 20;
var CAMERA_Z = 3;
var FOV = 55 * Math.PI / 180;
var HALF_HEIGHT = Math.tan(FOV / 2) * CAMERA_Z;
var SIZE = 0.12;
var ROW_Y = -0.5;
var PARTICLE_Z = 0.3;
var SLIDE_MS = 460;
var SLIDE_GATE = 0.45;
var EXIT_HURRY = 2.5;
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
function clamp012(value) {
  return Math.max(0, Math.min(1, value));
}
function smoothstep(edge0, edge1, value) {
  const x = clamp012((value - edge0) / (edge1 - edge0));
  return x * x * (3 - 2 * x);
}
function hash01(index, salt) {
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
      this.stagger[i] = hash01(i, 7) * LAUNCH_SPREAD_MS;
    }
    const order = Array.from({ length: ROCKETS }, (_, i) => i).sort(
      (a, b) => hash01(a, 11) - hash01(b, 11)
    );
    for (const i of order.slice(0, TURNERS)) {
      const height = TURN_MIN_Y + hash01(i, 12) * (TURN_MAX_Y - TURN_MIN_Y);
      const angle = (TURN_MIN_DEG + hash01(i, 13) * (TURN_MAX_DEG - TURN_MIN_DEG)) * DEG;
      const sign = hash01(i, 14) < 0.5 ? -1 : 1;
      this.turnS[i] = height - ROW_Y;
      this.turnDir[i] = { x: sign * Math.sin(angle), y: Math.cos(angle) };
      this.turnRoll[i] = -sign * angle;
    }
  }
  mount(target) {
    prepareHost(target);
    const smokeMeshes = SMOKE_COLORS.map((color) => quad(1, [color]));
    const fireMeshes = FIRE_COLORS.map((color) => quad(1, [color]));
    const smokeTexture = puffTexture(0.85, 0.5);
    const fireTexture = puffTexture(1, 0.32);
    const textures = new Map([
      ...smokeMeshes.map((mesh) => [mesh, smokeTexture]),
      ...fireMeshes.map((mesh) => [mesh, fireTexture])
    ]);
    const engine = new Little3dEngine({
      backend: this.backend,
      rendererFor: (backend, options) => createTexturedRenderer(backend, options, textures),
      camera: { position: { x: 0, y: 0, z: CAMERA_Z }, fov: FOV }
    });
    const rocketMesh = pyramid(1, ROCKET_COLORS);
    for (let i = 0; i < ROCKETS; i++) this.rockets.push(engine.add(rocketMesh, { scale: 0 }));
    for (let s = 0; s < SMOKE_POOL; s++) {
      const fade = { mode: "one-sided", opacity: 0 };
      this.smokeFades.push(fade);
      this.smoke.push(
        engine.add(smokeMeshes[s % smokeMeshes.length], { scale: 0, transparency: fade })
      );
    }
    for (let f = 0; f < FIRE_POOL; f++) {
      const fade = { mode: "one-sided", opacity: 0 };
      this.fireFades.push(fade);
      this.fire.push(
        engine.add(fireMeshes[f % fireMeshes.length], { scale: 0, transparency: fade })
      );
    }
    this.engine = engine;
    const mounting = engine.mount(target);
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
    return mounting;
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
    const halfWidth = HALF_HEIGHT * this.aspect;
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
      transform2.scale = SIZE * smoothstep(0, 0.6, blend);
      if (this.groundedAt[i] !== Infinity) {
        smokeCursor = this.emitSmoke(i, homeX, now, launchAt, smokeCursor);
      }
    }
    this.label.setText(
      frame.indeterminate ? typeof this.labelContent === "string" ? this.labelContent : "" : `${Math.round(frame.progress * 100)}%`
    );
    if (this.fadeLabel) {
      this.label.setOpacity(
        animationLabelOpacity(now, this.enterAt, SLIDE_MS, this.launchedAt, LAUNCH_SPREAD_MS)
      );
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
    const rate = dt / SLIDE_MS * (exiting ? EXIT_HURRY : 1);
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
    if (pos.y > HALF_HEIGHT + 0.4 || Math.abs(pos.x) > halfWidth + 0.4) return;
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
      const lat = (hash01(i * 97 + n, 1) - 0.5) * FIRE_SPREAD;
      const baseX = pose.pos.x + back.x * SIZE * 0.5;
      const baseY = pose.pos.y + back.y * SIZE * 0.5;
      const transform2 = this.fire[cursor].transform;
      transform2.position.x = baseX + back.x * FIRE_TRAIL * seconds + perp.x * lat;
      transform2.position.y = baseY + back.y * FIRE_TRAIL * seconds + perp.y * lat - 0.12 * seconds * seconds;
      transform2.position.z = PARTICLE_Z;
      transform2.rotation.z = hash01(i * 97 + n, 2) * Math.PI * 2;
      transform2.scale = FIRE_SIZE * (0.7 + 0.5 * hash01(i * 97 + n, 3)) * (1 - 0.55 * life);
      this.fireFades[cursor].opacity = FIRE_PEAK * smoothstep(0, 0.15, life) * (1 - smoothstep(0.55, 1, life));
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
      const drift = (hash01(i * 131 + n, 1) - 0.5) * 0.14;
      const transform2 = this.smoke[cursor].transform;
      transform2.position.x = homeX + drift * life;
      transform2.position.y = baseY + SMOKE_RISE * life;
      transform2.position.z = PARTICLE_Z;
      transform2.rotation.z = hash01(i * 131 + n, 2) * Math.PI * 2;
      transform2.scale = SMOKE_SIZE * (0.5 + 0.8 * life) * (0.7 + 0.6 * hash01(i * 131 + n, 3));
      this.smokeFades[cursor].opacity = SMOKE_PEAK * smoothstep(0, 0.25, life) * (1 - smoothstep(0.5, 1, life));
      cursor++;
    }
    return cursor;
  }
};
