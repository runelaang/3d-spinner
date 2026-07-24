/** Best supported backend, in descending order of capability. */
export function chooseBackend(support) {
    if (support.webgpu)
        return "webgpu";
    if (support.webgl)
        return "webgl";
    return "canvas2d";
}
/**
 * Test what the browser supports without loading any backend. The probes are a
 * WebGPU adapter request and a throwaway WebGL2 context, so choosing `"auto"`
 * never downloads or compiles the code for a backend it then rejects.
 */
export async function detectBackendSupport() {
    return { webgpu: await hasWebGPU(), webgl: hasWebGL2() };
}
async function hasWebGPU() {
    const gpu = globalThis.navigator?.gpu;
    if (!gpu)
        return false;
    try {
        return Boolean(await gpu.requestAdapter());
    }
    catch {
        return false;
    }
}
function hasWebGL2() {
    const doc = globalThis.document;
    if (!doc?.createElement)
        return false;
    try {
        const gl = doc.createElement("canvas").getContext("webgl2");
        if (!gl)
            return false;
        // The probe holds a real context and browsers cap how many may be live, so
        // release it rather than waiting for garbage collection.
        gl.getExtension("WEBGL_lose_context")?.loseContext();
        return true;
    }
    catch {
        return false;
    }
}
let supportProbe;
/** Resolve `"auto"` once per page and reuse the answer for later mounts. */
export async function resolveBackend(backend) {
    if (backend !== "auto")
        return backend;
    supportProbe ?? (supportProbe = detectBackendSupport());
    return chooseBackend(await supportProbe);
}
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
 * backends you do not use are never downloaded or compiled. `"auto"` resolves
 * to the best supported backend before anything is imported.
 */
export async function createRenderer(backend, options = {}) {
    if (typeof backend === "function")
        return backend(options);
    switch (await resolveBackend(backend)) {
        case "webgl":
            return new (await import("./renderers/webgl.js")).WebGLRenderer(options);
        case "webgpu":
            return new (await import("./renderers/webgpu.js")).WebGPURenderer(options);
        case "canvas2d":
        default:
            return new (await import("./renderers/canvas2d.js")).Canvas2DRenderer(options);
    }
}
