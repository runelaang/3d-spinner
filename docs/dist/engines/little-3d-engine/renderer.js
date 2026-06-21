/**
 * Load and construct a renderer for `backend`. Each backend lives in its own
 * module and is pulled in with a dynamic `import()`, so the bytes for the
 * backends you do not use are never downloaded or compiled.
 */
export async function createRenderer(backend, options = {}) {
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
