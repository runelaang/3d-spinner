import { expandToTriangles } from "../core/geometry.js";
import type { Mesh, Transparency } from "../core/mesh.js";
import {
  DEFAULT_ONE_SIDED_OPACITY,
  opacity,
  resolveTwoSidedOpacity,
  type Renderer,
  type RenderFrame,
  type RendererOptions,
  type RenderItem,
} from "../renderer.js";
import { planarUVs, type TextureSource } from "./textured-helpers.js";
import { WebGLRenderer } from "./webgl.js";

const VERTEX_SHADER = `#version 300 es
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

const FRAGMENT_SHADER = `#version 300 es
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

export type { TextureSource } from "./textured-helpers.js";

interface TexturedBuffers {
  vao: WebGLVertexArrayObject;
  count: number;
}

interface Locations {
  aPos: number;
  aUV: number;
  aColor: number;
  uViewProj: WebGLUniformLocation | null;
  uModel: WebGLUniformLocation | null;
  uTexture: WebGLUniformLocation | null;
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

function itemOpacity(transparency: Transparency | undefined): number {
  if (!transparency) return 1;
  if (transparency.mode === "two-sided") return resolveTwoSidedOpacity(transparency).front;
  return opacity(transparency.opacity, DEFAULT_ONE_SIDED_OPACITY);
}

/**
 * WebGL renderer with image textures on registered meshes; unregistered
 * meshes render exactly as in the plain WebGL backend. Made for billboard
 * quads: UVs are a planar projection of the mesh's XY extent, textured faces
 * render unlit with the texture tinted by the face color, and textured
 * instances draw after the other transparent instances. Until an image URL
 * finishes loading its mesh renders with a plain white texture.
 *
 * Pass it to the engine (or an animation) as a `backend` factory so the
 * module is only fetched when used:
 *
 * ```js
 * backend: async (options) => {
 *   const { WebGLTexturedRenderer } =
 *     await import("3d-spinner/engines/little-3d-engine/renderers/webgl-textured");
 *   const renderer = new WebGLTexturedRenderer(options);
 *   renderer.setTexture(mesh, "/sprite.png");
 *   return renderer;
 * }
 * ```
 */
export class WebGLTexturedRenderer implements Renderer {
  private readonly inner: WebGLRenderer;
  private gl?: WebGL2RenderingContext;
  private program?: WebGLProgram;
  private locations?: Locations;
  private readonly sources = new Map<Mesh, TextureSource>();
  private readonly textures = new Map<Mesh, WebGLTexture>();
  private readonly buffers = new Map<Mesh, TexturedBuffers>();

  constructor(options: RendererOptions = {}) {
    this.inner = new WebGLRenderer(options);
  }

  /** Texture every instance of `mesh` with `source`. Call any time, also before init. */
  setTexture(mesh: Mesh, source: TextureSource): void {
    this.sources.set(mesh, source);
  }

  init(canvas: HTMLCanvasElement): void {
    this.inner.init(canvas);
    const gl = canvas.getContext("webgl2")!;
    this.gl = gl;
    this.program = link(gl);
    this.locations = {
      aPos: gl.getAttribLocation(this.program, "aPos"),
      aUV: gl.getAttribLocation(this.program, "aUV"),
      aColor: gl.getAttribLocation(this.program, "aColor"),
      uViewProj: gl.getUniformLocation(this.program, "uViewProj"),
      uModel: gl.getUniformLocation(this.program, "uModel"),
      uTexture: gl.getUniformLocation(this.program, "uTexture"),
      uOpacity: gl.getUniformLocation(this.program, "uOpacity"),
    };
  }

  resize(): void {
    this.inner.resize();
  }

  private textureFor(mesh: Mesh): WebGLTexture {
    const cached = this.textures.get(mesh);
    if (cached) return cached;
    const gl = this.gl!;
    const texture = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(
      gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
      new Uint8Array([255, 255, 255, 255]),
    );
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    this.textures.set(mesh, texture);

    const upload = (image: TexImageSource) => {
      if (!this.gl || this.textures.get(mesh) !== texture) return;
      this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
      this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, image);
    };
    const source = this.sources.get(mesh)!;
    if (typeof source === "string") {
      const image = new Image();
      image.onload = () => upload(image);
      image.src = source;
    } else {
      upload(source);
    }
    return texture;
  }

  private buffersFor(mesh: Mesh): TexturedBuffers {
    const cached = this.buffers.get(mesh);
    if (cached) return cached;
    const gl = this.gl!;
    const loc = this.locations!;
    const data = expandToTriangles(mesh);
    const vao = gl.createVertexArray()!;
    gl.bindVertexArray(vao);
    const attribute = (location: number, array: Float32Array, size: number) => {
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

  render(frame: RenderFrame): void {
    const plain: RenderItem[] = [];
    const textured: RenderItem[] = [];
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
      gl.uniform1f(loc.uOpacity, itemOpacity(item.transparency));
      gl.bindVertexArray(buffers.vao);
      gl.drawArrays(gl.TRIANGLES, 0, buffers.count);
    }
    gl.depthMask(true);
    gl.disable(gl.BLEND);
    gl.bindVertexArray(null);
  }

  destroy(): void {
    const gl = this.gl;
    if (gl) {
      for (const texture of this.textures.values()) gl.deleteTexture(texture);
      for (const buffers of this.buffers.values()) gl.deleteVertexArray(buffers.vao);
      if (this.program) gl.deleteProgram(this.program);
    }
    this.textures.clear();
    this.buffers.clear();
    this.sources.clear();
    this.gl = undefined;
    this.program = undefined;
    this.locations = undefined;
    this.inner.destroy();
  }
}
