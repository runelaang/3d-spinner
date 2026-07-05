export const DEFAULT_ONE_SIDED_OPACITY = 0.35;
export const DEFAULT_BACK_OPACITY = 0.84;
export const DEFAULT_FRONT_OPACITY = 0.56;
/** Clamp an optional opacity to the range accepted by rendering backends. */
export function opacity(value, fallback) {
    return Math.max(0, Math.min(1, value ?? fallback));
}
/** Resolve two-sided defaults, shorthand, and explicit per-side overrides. */
export function resolveTwoSidedOpacity(transparency) {
    const front = opacity(transparency.frontOpacity ?? transparency.opacity, DEFAULT_FRONT_OPACITY);
    const backFallback = transparency.opacity === undefined
        ? DEFAULT_BACK_OPACITY
        : front * (2 / 3);
    return {
        front,
        back: opacity(transparency.backOpacity, backFallback),
    };
}
/** Draw opaque instances first, then transparent instances from farthest to nearest. */
export function orderRenderItems(items, eye) {
    const opaque = [];
    const transparent = [];
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
/**
 * Load and construct a renderer for `backend`. Each backend lives in its own
 * module and is pulled in with a dynamic `import()`, so the bytes for the
 * backends you do not use are never downloaded or compiled.
 */
export async function createRenderer(backend, options = {}) {
    if (typeof backend === "function")
        return backend(options);
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
