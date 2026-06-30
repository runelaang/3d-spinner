import type { LightParams } from "./core/light.js";
import type { Mat4, Vec3 } from "./core/math.js";
import type { Mesh, Transparency, TwoSidedTransparency } from "./core/mesh.js";

/** Rendering backend. Each is loaded on demand; unused ones are never fetched. */
export type Backend = "canvas2d" | "webgl" | "webgpu";

/** A mesh plus its world transform, ready to draw. */
export interface RenderItem {
  mesh: Mesh;
  model: Mat4;
  transparency?: Transparency;
}

export const DEFAULT_ONE_SIDED_OPACITY = 0.35;
export const DEFAULT_BACK_OPACITY = 0.84;
export const DEFAULT_FRONT_OPACITY = 0.56;

/** Clamp an optional opacity to the range accepted by rendering backends. */
export function opacity(value: number | undefined, fallback: number): number {
  return Math.max(0, Math.min(1, value ?? fallback));
}

/** Resolve two-sided defaults, shorthand, and explicit per-side overrides. */
export function resolveTwoSidedOpacity(
  transparency: TwoSidedTransparency,
): { front: number; back: number } {
  const front = opacity(
    transparency.frontOpacity ?? transparency.opacity,
    DEFAULT_FRONT_OPACITY,
  );
  const backFallback = transparency.opacity === undefined
    ? DEFAULT_BACK_OPACITY
    : front * (2 / 3);
  return {
    front,
    back: opacity(transparency.backOpacity, backFallback),
  };
}

/** Draw opaque instances first, then transparent instances from farthest to nearest. */
export function orderRenderItems(
  items: ReadonlyArray<RenderItem>,
  eye: Vec3,
): RenderItem[] {
  const opaque: RenderItem[] = [];
  const transparent: RenderItem[] = [];
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
 * Renderer-specific features can produce intentional visual differences.
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
