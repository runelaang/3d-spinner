/**
 * Typed access to the slice of the WebGPU API this engine calls.
 *
 * The official `@webgpu/types` package is not a dependency: the WebGPU
 * renderers expose GPU objects through protected members, so its global types
 * would leak into the published declarations and into every consumer's
 * compile. Instead these types mirror exactly the members and descriptor fields
 * used here, with the spec's value sets and the official `__brand` markers, and
 * `tests/webgpu-types.test.mjs` checks them against `@webgpu/types` (a dev
 * dependency only).
 */
/** `navigator.gpu`, or `undefined` when the browser has no WebGPU. */
export function webgpu() {
    return globalThis.navigator?.gpu;
}
/** The WebGPU flag constants from the browser globals. Call only where WebGPU exists. */
export function gpuFlags() {
    const globals = globalThis;
    return {
        bufferUsage: globals.GPUBufferUsage,
        textureUsage: globals.GPUTextureUsage,
        shaderStage: globals.GPUShaderStage,
    };
}
/** The WebGPU context of `canvas`, or `null` when it cannot provide one. */
export function webgpuContext(canvas) {
    return canvas.getContext.call(canvas, "webgpu");
}
