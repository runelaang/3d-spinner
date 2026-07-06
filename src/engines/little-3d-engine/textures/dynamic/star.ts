import { canvasTexture } from "./canvas-texture.js";

/** Options for {@link starTexture}. */
export interface StarTextureOptions {
  /**
   * Radius of a soft glow drawn around the star, in canvas pixels. A blurred
   * copy of the star is composited underneath the crisp one, so the glow takes
   * the particle's tint. Default `0` (no glow).
   */
  glow?: number;
}

function drawStar(ctx: CanvasRenderingContext2D): void {
  ctx.save();
  ctx.translate(48, 48);
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  for (let index = 0; index < 10; index++) {
    const radius = index % 2 === 0 ? 43 : 16;
    const angle = (index * Math.PI) / 5 - Math.PI / 2;
    ctx.lineTo(radius * Math.cos(angle), radius * Math.sin(angle));
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

/**
 * A white five-point star on a transparent square canvas. With `glow`, a
 * blurred copy is composited beneath the crisp star for a soft halo.
 */
export function starTexture(options: StarTextureOptions = {}): HTMLCanvasElement {
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
