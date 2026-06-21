import { shadeColor } from "../light.js";
import { dot, cross, normalize, subtract, transformAffine, transformPoint } from "../math.js";
/** Software renderer: projects geometry on the CPU and fills 2D polygons. */
export class Canvas2DRenderer {
    constructor(options = {}) {
        this.options = options;
        this.dpr = 1;
    }
    init(canvas) {
        this.ctx = canvas.getContext("2d") ?? undefined;
    }
    resize(_cssWidth, _cssHeight, dpr) {
        this.dpr = dpr;
        this.ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    render(frame) {
        const ctx = this.ctx;
        if (!ctx)
            return;
        if (this.options.background) {
            ctx.fillStyle = this.options.background;
            ctx.fillRect(0, 0, frame.width, frame.height);
        }
        else {
            ctx.clearRect(0, 0, frame.width, frame.height);
        }
        const polygons = [];
        for (const item of frame.items) {
            const world = item.mesh.vertices.map((v) => transformAffine(item.model, v));
            for (const face of item.mesh.faces) {
                const a = world[face.indices[0]];
                const b = world[face.indices[1]];
                const c = world[face.indices[2]];
                const normal = normalize(cross(subtract(b, a), subtract(c, a)));
                if (dot(normal, subtract(frame.eye, a)) <= 0)
                    continue;
                const points = face.indices.map((i) => {
                    const ndc = transformPoint(frame.viewProjection, world[i]);
                    return {
                        x: (ndc.x * 0.5 + 0.5) * frame.width,
                        y: (1 - (ndc.y * 0.5 + 0.5)) * frame.height,
                    };
                });
                let depth = 0;
                for (const i of face.indices) {
                    const d = subtract(world[i], frame.eye);
                    depth += dot(d, d);
                }
                depth /= face.indices.length;
                polygons.push({ points, color: shadeColor(normal, face.color, frame.light), depth });
            }
        }
        polygons.sort((p, q) => q.depth - p.depth);
        for (const poly of polygons) {
            if (poly.points.length < 3)
                continue;
            ctx.beginPath();
            ctx.moveTo(poly.points[0].x, poly.points[0].y);
            for (let i = 1; i < poly.points.length; i++) {
                ctx.lineTo(poly.points[i].x, poly.points[i].y);
            }
            ctx.closePath();
            ctx.fillStyle = poly.color;
            ctx.strokeStyle = poly.color;
            ctx.lineWidth = 1;
            ctx.fill();
            ctx.stroke();
        }
    }
    destroy() {
        this.ctx = undefined;
    }
}
