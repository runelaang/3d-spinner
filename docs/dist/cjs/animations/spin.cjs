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

// src/animations/spin.ts
var spin_exports = {};
__export(spin_exports, {
  SpinAnimation: () => SpinAnimation
});
module.exports = __toCommonJS(spin_exports);

// src/mount-host.ts
function prepareHost(target) {
  const position = getComputedStyle(target).position;
  if (position === "static" || position === "") target.style.position = "relative";
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

// src/engines/little-3d-engine/shapes/primitives/cube.ts
var DEFAULT_COLORS = ["#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#ef4444"];
function cube(size = 1, colors = DEFAULT_COLORS, material) {
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
  return attachMaterial({ vertices, faces }, material);
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

// src/engines/little-tween-engine/core/tweens.ts
function input(value, allowExtrapolation) {
  if (Number.isNaN(value)) return 0;
  if (allowExtrapolation) return value;
  return Math.min(1, Math.max(0, value));
}
function easeInQuad(value, allowExtrapolation = false) {
  const x = input(value, allowExtrapolation);
  return x * x;
}
function easeOutQuad(value, allowExtrapolation = false) {
  const x = input(value, allowExtrapolation);
  return 1 - (1 - x) * (1 - x);
}
function easeOutCubic(value, allowExtrapolation = false) {
  const x = input(value, allowExtrapolation);
  return 1 - Math.pow(1 - x, 3);
}
function easeOutExpo(value, allowExtrapolation = false) {
  const x = input(value, allowExtrapolation);
  return x === 1 ? 1 : 1 - Math.pow(2, -10 * x);
}

// src/progress-animation.ts
function resolveOptions(options = {}) {
  return {
    popDurationMs: options.popDurationMs ?? 500,
    overshootRatio: options.overshootRatio ?? options.overextend ?? 0.2,
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
      overshootRatio,
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
      const peak = this.popTarget * (1 + overshootRatio);
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
      const peak = 1 + overshootRatio;
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
function applyMaterial(mesh, material) {
  if (!material) return mesh;
  return { vertices: mesh.vertices, faces: mesh.faces.map((f) => ({ ...f, material })) };
}
var SpinAnimation = class {
  constructor(options = {}) {
    this.exited = false;
    this.mesh = applyMaterial(
      applyColor(resolveMesh(options.shape), options.color),
      options.material
    );
    this.spinX = options.spinX ?? 7e-4;
    this.spinY = options.spinY ?? 11e-4;
    this.backend = options.backend;
    this.transparency = options.transparency;
    this.progress = options.progressAnimation ? new ProgressAnimation(options.progressAnimation) : void 0;
  }
  mount(target) {
    prepareHost(target);
    const engine = new Little3dEngine({
      backend: this.backend,
      camera: { position: { x: 0, y: 0, z: 2.8 } }
    });
    this.handle = engine.add(this.mesh, { transparency: this.transparency });
    this.engine = engine;
    const mounting = engine.mount(target);
    if (this.progress) {
      const label = document.createElement("div");
      label.style.cssText = LABEL_STYLE;
      label.setAttribute("aria-hidden", "true");
      label.hidden = true;
      target.appendChild(label);
      this.label = label;
    }
    return mounting;
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
