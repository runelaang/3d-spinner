import { canvasTexture } from "./canvas-texture.js";
/** A soft radial glow for particle billboards. */
export function shineTexture() {
    return canvasTexture((ctx) => {
        const halo = ctx.createRadialGradient(48, 48, 1, 48, 48, 46);
        halo.addColorStop(0, "rgba(255,255,255,1)");
        halo.addColorStop(0.08, "rgba(255,255,255,1)");
        halo.addColorStop(0.22, "rgba(210,240,255,0.7)");
        halo.addColorStop(0.55, "rgba(120,200,255,0.22)");
        halo.addColorStop(1, "rgba(80,160,255,0)");
        ctx.fillStyle = halo;
        ctx.fillRect(0, 0, 96, 96);
    });
}
