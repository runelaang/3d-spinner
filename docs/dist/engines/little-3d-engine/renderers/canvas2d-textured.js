import { transformAffine, transformPoint } from "../core/math.js";
import { DEFAULT_ONE_SIDED_OPACITY, opacity } from "../renderer.js";
import { Canvas2DRenderer } from "./canvas2d.js";
function imageSize(source) {
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
    const sized = source;
    return sized.width > 0 && sized.height > 0 ? { width: sized.width, height: sized.height } : undefined;
}
function drawMappedTriangle(ctx, image, source, target) {
    const [s0, s1, s2] = source;
    const [d0, d1, d2] = target;
    const determinant = s0.x * (s1.y - s2.y) + s1.x * (s2.y - s0.y) + s2.x * (s0.y - s1.y);
    if (Math.abs(determinant) < 1e-8)
        return;
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
export class Canvas2DTexturedRenderer {
    constructor(options = {}) {
        this.sources = new Map();
        this.loaded = new Map();
        this.dpr = 1;
        this.inner = new Canvas2DRenderer(options);
    }
    /** Texture every instance of `mesh` with `source`. Call any time, also before init. */
    setTexture(mesh, source) {
        this.sources.set(mesh, source);
        if (typeof source === "string" && !this.loaded.has(source)) {
            const image = new Image();
            image.src = source;
            this.loaded.set(source, image);
        }
    }
    init(canvas) {
        this.inner.init(canvas);
        this.ctx = canvas.getContext("2d") ?? undefined;
    }
    resize(cssWidth, cssHeight, dpr) {
        this.dpr = dpr;
        this.inner.resize(cssWidth, cssHeight, dpr);
    }
    drawable(mesh) {
        const source = this.sources.get(mesh);
        return typeof source === "string" ? this.loaded.get(source) : source;
    }
    render(frame) {
        const plain = frame.items.filter((item) => {
            if (!this.sources.has(item.mesh))
                return true;
            const source = this.drawable(item.mesh);
            return !source || !imageSize(source);
        });
        this.inner.render({ ...frame, items: plain });
        const ctx = this.ctx;
        if (!ctx)
            return;
        ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
        const tinted = new Map();
        for (const item of frame.items) {
            const source = this.drawable(item.mesh);
            if (!source)
                continue;
            const size = imageSize(source);
            if (!size)
                continue;
            let image = tinted.get(item.mesh);
            if (!image) {
                image = document.createElement("canvas");
                image.width = size.width;
                image.height = size.height;
                const tint = image.getContext("2d");
                if (!tint)
                    continue;
                tint.drawImage(source, 0, 0, size.width, size.height);
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
            if (!face || face.indices.length !== 4)
                continue;
            const [a, b, c, d] = face.indices.map((index) => projected[index]);
            ctx.globalAlpha = item.transparency?.mode === "one-sided"
                ? opacity(item.transparency.opacity, DEFAULT_ONE_SIDED_OPACITY)
                : 1;
            drawMappedTriangle(ctx, image, [{ x: 0, y: size.height }, { x: size.width, y: size.height }, { x: size.width, y: 0 }], [a, b, c]);
            drawMappedTriangle(ctx, image, [{ x: 0, y: size.height }, { x: size.width, y: 0 }, { x: 0, y: 0 }], [a, c, d]);
        }
        ctx.globalAlpha = 1;
    }
    destroy() {
        this.inner.destroy();
        this.ctx = undefined;
        this.sources.clear();
        this.loaded.clear();
    }
}
