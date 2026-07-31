import type { LightParams } from "./core/light.js";
import type { Mat4, Vec3 } from "./core/math.js";
import type { Mesh } from "./core/mesh.js";

/** Rendering backend. Each is loaded on demand; unused ones are never fetched. */
export type Backend = "canvas2d" | "webgl" | "webgpu";

/** A mesh plus its world transform, ready to draw. */
export interface RenderItem {
  mesh: Mesh;
  model: Mat4;
}

/** Everything a renderer needs to draw one frame. */
export interface RenderFrame {
  items: ReadonlyArray<RenderItem>;
  /** Combined view-projection (OpenGL clip space, z in -1..1). */
  viewProjection: Mat4;
  /** Camera position, for backface culling. */
  eye: Vec3;
  light: LightParams;
  /** Logical (CSS pixel) viewport size. */
  width: number;
  height: number;
}

/** Construction-time options shared by all backends. */
export interface RendererOptions {
  /** Solid background; omit for a transparent canvas (overlay use). */
  background?: string;
}

/**
 * A pluggable drawing backend. The engine owns the canvas and sizing; a
 * renderer only initializes its context, reacts to resizes, and draws frames.
 */
export interface Renderer {
  init(canvas: HTMLCanvasElement): void | Promise<void>;
  resize(cssWidth: number, cssHeight: number, dpr: number): void;
  render(frame: RenderFrame): void;
  destroy(): void;
}

/**
 * Load and construct a renderer for `backend`. Each backend lives in its own
 * module and is pulled in with a dynamic `import()`, so the bytes for the
 * backends you do not use are never downloaded or compiled.
 */
export async function createRenderer(
  backend: Backend,
  options: RendererOptions = {},
): Promise<Renderer> {
  switch (backend) {
    case "webgl":
      return new (await import("./renderers/webgl.js")).WebGLRenderer(options);
    case "webgpu":
      return new (await import("./renderers/webgpu.js")).WebGPURenderer(options);
    case "canvas2d":
    default:
      return new (await import("./renderers/canvas2d.js")).Canvas2DRenderer(options);
  }
}
