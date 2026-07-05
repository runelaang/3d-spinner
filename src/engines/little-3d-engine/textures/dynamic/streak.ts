import { canvasTexture } from "./canvas-texture.js";

/**
 * A horizontal streak fading from transparent to white.
 * Head at x=91 (alignToMotion rolls the billboard +x onto the velocity).
 */
export function streakTexture(): HTMLCanvasElement {
  return canvasTexture((ctx) => {
    const gradient = ctx.createLinearGradient(5, 0, 91, 0);
    gradient.addColorStop(0, "rgba(255,255,255,0)");
    gradient.addColorStop(0.7, "rgba(255,255,255,0.4)");
    gradient.addColorStop(1, "rgba(255,255,255,1)");
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 3.5;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(5, 48);
    ctx.lineTo(91, 48);
    ctx.stroke();
  });
}
