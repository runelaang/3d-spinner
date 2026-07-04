import { transformAffine, transformPoint } from "../core/math.js";
import type { Mesh } from "../core/mesh.js";
import { DEFAULT_ONE_SIDED_OPACITY, opacity, type Renderer, type RenderFrame, type RendererOptions } from "../renderer.js";
import { Canvas2DRenderer } from "./canvas2d.js";
import type { TextureSource } from "./textured-helpers.js";

export type { TextureSource } from "./textured-helpers.js";

interface ImageSize {
  width: number;
  height: number;
}

interface Point {
  x: number;
  y: number;
}

function imageSize(source: TexImageSource): ImageSize | undefined {
  if (source instanceof HTMLImageElement) {
    return source.complete && source.naturalWidth > 0
      ? { width: source.naturalWidth, height: source.naturalHeight }
      : undefined;
  }
  if (source instanceof HTMLVideoElement) {
    return source.readyState >= 2
      ? { width: source.videoWidth, height: source.videoHeight }
      : undefined;
  }
  if (source instanceof SVGImageElement) {
    const width = source.width.baseVal.value;
    const height = source.height.baseVal.value;
    return width > 0 && height > 0 ? { width, height } : undefined;
  }
  if (typeof VideoFrame !== "undefined" && source instanceof VideoFrame) {
    return { width: source.displayWidth, height: source.displayHeight };
  }
  const sized = source as HTMLCanvasElement | ImageBitmap | OffscreenCanvas;
  return sized.width > 0 && sized.height > 0 ? { width: sized.width, height: sized.height } : undefined;
}

function drawMappedTriangle(
  ctx: CanvasRenderingContext2D,
  image: CanvasImageSource,
  source: readonly [Point, Point, Point],
  target: readonly [Point, Point, Point],
): void {
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

/** Canvas 2D texture renderer optimized for planar billboard meshes. */
export class Canvas2DTexturedRenderer implements Renderer {
  private readonly inner: Canvas2DRenderer;
  private readonly sources = new Map<Mesh, TextureSource>();
  private readonly loaded = new Map<string, HTMLImageElement>();
  private ctx?: CanvasRenderingContext2D;
  private dpr = 1;

  constructor(options: RendererOptions = {}) {
    this.inner = new Canvas2DRenderer(options);
  }

  /** Texture every instance of `mesh` with `source`. Call any time, also before init. */
  setTexture(mesh: Mesh, source: TextureSource): void {
    this.sources.set(mesh, source);
    if (typeof source === "string" && !this.loaded.has(source)) {
      const image = new Image();
      image.src = source;
      this.loaded.set(source, image);
    }
  }

  init(canvas: HTMLCanvasElement): void {
    this.inner.init(canvas);
    this.ctx = canvas.getContext("2d") ?? undefined;
  }

  resize(cssWidth: number, cssHeight: number, dpr: number): void {
    this.dpr = dpr;
    this.inner.resize(cssWidth, cssHeight, dpr);
  }

  private drawable(mesh: Mesh): TexImageSource | undefined {
    const source = this.sources.get(mesh);
    return typeof source === "string" ? this.loaded.get(source) : source;
  }

  render(frame: RenderFrame): void {
    const plain = frame.items.filter((item) => {
      if (!this.sources.has(item.mesh)) return true;
      const source = this.drawable(item.mesh);
      return !source || !imageSize(source);
    });
    this.inner.render({ ...frame, items: plain });
    const ctx = this.ctx;
    if (!ctx) return;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);

    const tinted = new Map<Mesh, HTMLCanvasElement>();
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
        tint.drawImage(source as CanvasImageSource, 0, 0, size.width, size.height);
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
      ctx.globalAlpha = item.transparency?.mode === "one-sided"
        ? opacity(item.transparency.opacity, DEFAULT_ONE_SIDED_OPACITY)
        : 1;
      drawMappedTriangle(ctx, image, [{ x: 0, y: size.height }, { x: size.width, y: size.height }, { x: size.width, y: 0 }], [a, b, c]);
      drawMappedTriangle(ctx, image, [{ x: 0, y: size.height }, { x: size.width, y: 0 }, { x: 0, y: 0 }], [a, c, d]);
    }
    ctx.globalAlpha = 1;
  }

  destroy(): void {
    this.inner.destroy();
    this.ctx = undefined;
    this.sources.clear();
    this.loaded.clear();
  }
}
