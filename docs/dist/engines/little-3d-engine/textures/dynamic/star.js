import { canvasTexture } from "./canvas-texture.js";
/** A white five-point star on a transparent square canvas. */
export function starTexture() {
    return canvasTexture((ctx) => {
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
    });
}
