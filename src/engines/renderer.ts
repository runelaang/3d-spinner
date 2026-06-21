/**
 * Owns the `<canvas>` and 2D context: handles HiDPI sizing, clearing, and
 * filling screen-space polygons. It knows nothing about 3D - the engine
 * projects geometry down to 2D and hands polygons here.
 */
export class CanvasRenderer {
  private canvas?: HTMLCanvasElement;
  private ctx?: CanvasRenderingContext2D;
  private observer?: ResizeObserver;
  private cssWidth = 0;
  private cssHeight = 0;

  /** Optional solid background; omit for a transparent canvas (overlay use). */
  constructor(private readonly background?: string) {}

  mount(target: HTMLElement): void {
    const canvas = document.createElement("canvas");
    canvas.style.display = "block";
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    target.appendChild(canvas);
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d") ?? undefined;

    this.resize();
    this.observer = new ResizeObserver(() => this.resize());
    this.observer.observe(canvas);
  }

  /** Logical (CSS pixel) width of the drawing surface. */
  get width(): number {
    return this.cssWidth;
  }

  /** Logical (CSS pixel) height of the drawing surface. */
  get height(): number {
    return this.cssHeight;
  }

  private resize(): void {
    const canvas = this.canvas;
    const ctx = this.ctx;
    if (!canvas || !ctx) return;
    const dpr = window.devicePixelRatio || 1;
    this.cssWidth = canvas.clientWidth || canvas.parentElement?.clientWidth || 0;
    this.cssHeight = canvas.clientHeight || canvas.parentElement?.clientHeight || 0;
    canvas.width = Math.max(1, Math.round(this.cssWidth * dpr));
    canvas.height = Math.max(1, Math.round(this.cssHeight * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  clear(): void {
    const ctx = this.ctx;
    if (!ctx) return;
    if (this.background) {
      ctx.fillStyle = this.background;
      ctx.fillRect(0, 0, this.cssWidth, this.cssHeight);
    } else {
      ctx.clearRect(0, 0, this.cssWidth, this.cssHeight);
    }
  }

  fillPolygon(points: { x: number; y: number }[], color: string): void {
    const ctx = this.ctx;
    if (!ctx || points.length < 3) return;
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.fill();
    ctx.stroke();
  }

  destroy(): void {
    this.observer?.disconnect();
    this.observer = undefined;
    this.canvas?.remove();
    this.canvas = undefined;
    this.ctx = undefined;
  }
}
