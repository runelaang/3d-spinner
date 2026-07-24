import { expandToTriangles, parseColor } from "../core/geometry.js";
import type { Mesh } from "../core/mesh.js";
import {
  DEFAULT_ONE_SIDED_OPACITY,
  opacity,
  resolveTwoSidedOpacity,
  type Renderer,
  type RenderFrame,
  type RendererOptions,
} from "../renderer.js";

const VERTEX_SHADER = `#version 300 es
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

const FRAGMENT_SHADER = `#version 300 es
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

interface MeshBuffers {
  vao: WebGLVertexArrayObject;
  buffers: WebGLBuffer[];
  count: number;
}

interface Locations {
  aPos: number;
  aNormal: number;
  aColor: number;
  aEmissive: number;
  aSpecular: number;
  uViewProj: WebGLUniformLocation | null;
  uModel: WebGLUniformLocation | null;
  uToLight: WebGLUniformLocation | null;
  uEye: WebGLUniformLocation | null;
  uIntensity: WebGLUniformLocation | null;
  uAmbient: WebGLUniformLocation | null;
  uOpacity: WebGLUniformLocation | null;
}

function compile(gl: WebGL2RenderingContext, type: number, source: string): WebGLShader {
  const shader = gl.createShader(type)!;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    throw new Error(`3d-spinner: shader compile failed: ${gl.getShaderInfoLog(shader)}`);
  }
  return shader;
}

function link(gl: WebGL2RenderingContext): WebGLProgram {
  const program = gl.createProgram()!;
  gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, VERTEX_SHADER));
  gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER));
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new Error(`3d-spinner: program link failed: ${gl.getProgramInfoLog(program)}`);
  }
  return program;
}

/** Hardware renderer using WebGL2: GPU transforms with a real depth buffer. */
export class WebGLRenderer implements Renderer {
  private gl?: WebGL2RenderingContext;
  private program?: WebGLProgram;
  private locations?: Locations;
  private readonly cache = new Map<Mesh, MeshBuffers>();
  private readonly clearColor: [number, number, number, number];

  constructor(options: RendererOptions = {}) {
    if (options.background) {
      const [r, g, b] = parseColor(options.background);
      this.clearColor = [r / 255, g / 255, b / 255, 1];
    } else {
      this.clearColor = [0, 0, 0, 0];
    }
  }

  init(canvas: HTMLCanvasElement): void {
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
      uOpacity: gl.getUniformLocation(this.program, "uOpacity"),
    };
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);
    gl.frontFace(gl.CCW);
  }

  resize(): void {
    const gl = this.gl;
    if (!gl) return;
    const canvas = gl.canvas as HTMLCanvasElement;
    gl.viewport(0, 0, canvas.width, canvas.height);
  }

  private buffers(mesh: Mesh): MeshBuffers {
    const cached = this.cache.get(mesh);
    if (cached) return cached;
    const gl = this.gl!;
    const loc = this.locations!;
    const data = expandToTriangles(mesh);
    const vao = gl.createVertexArray()!;
    gl.bindVertexArray(vao);
    const buffers: WebGLBuffer[] = [];
    const attribute = (location: number, array: Float32Array, size = 3) => {
      if (location < 0) return;
      const buffer = gl.createBuffer()!;
      buffers.push(buffer);
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
    const result = { vao, buffers, count: data.count };
    this.cache.set(mesh, result);
    return result;
  }

  render(frame: RenderFrame): void {
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

  destroy(): void {
    const gl = this.gl;
    if (gl) {
      for (const mesh of this.cache.values()) {
        gl.deleteVertexArray(mesh.vao);
        for (const buffer of mesh.buffers) gl.deleteBuffer(buffer);
      }
      if (this.program) gl.deleteProgram(this.program);
      // Browsers cap how many WebGL contexts may be live at once and only reclaim a dropped one
      // on garbage collection, so a page that mounts and unmounts spinners can exhaust the cap
      // before that happens. Losing the context releases it immediately.
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    }
    this.cache.clear();
    this.gl = undefined;
    this.program = undefined;
    this.locations = undefined;
  }
}
