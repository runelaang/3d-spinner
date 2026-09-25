import { Camera } from "./core/camera.js";
import { Light } from "./core/light.js";
import { multiply, rotationFromEuler, scaleMatrix, translation } from "./core/math.js";
import { transform as makeTransform, } from "./core/mesh.js";
import { createRenderer, orderRenderItems, resolveAutoCandidates, } from "./renderer.js";
function modelMatrix(t) {
    const rotation = rotationFromEuler(t.rotation.x, t.rotation.y, t.rotation.z);
    return multiply(translation(t.position.x, t.position.y, t.position.z), multiply(rotation, scaleMatrix(t.scale)));
}
/** Stop observing the surface's canvas and remove it. Safe to call more than once. */
function detach(surface) {
    surface.observer.disconnect();
    surface.canvas.remove();
}
/** Destroy the surface's renderer, then remove its canvas even if the renderer throws. */
function release(surface) {
    const renderer = surface.renderer;
    surface.renderer = undefined;
    try {
        renderer?.destroy();
    }
    finally {
        detach(surface);
    }
}
/** One line of the combined "no renderer could start" error. */
function failure(candidate, error) {
    const name = typeof candidate === "string" ? candidate : "custom";
    return `${name}: ${error instanceof Error ? error.message : String(error)}`;
}
/**
 * A minimal software/hardware 3D engine. It projects colored meshes with flat
 * directional lighting through a swappable {@link Backend} renderer. Mount it
 * into any element to render in a component, or into a transparent positioned
 * element to overlay a page.
 */
export class Little3dEngine {
    constructor(options = {}) {
        this.scene = [];
        /** The candidates after the mounted one, to switch to if its renderer is lost. */
        this.fallbacks = [];
        this.state = "idle";
        this.generation = 0;
        this.rafId = 0;
        this.running = false;
        this.camera = new Camera(options.camera);
        this.light = new Light(options.light);
        this.backend = options.backend ?? "auto";
        this.rendererFor = options.rendererFor;
        this.background = options.background;
    }
    /**
     * Create the canvas inside `target`, load the selected backend, and start
     * tracking size. Resolves once the renderer is ready; rejects if the backend
     * is unavailable. With `"auto"`, a backend that fails to load or initialize
     * is replaced by the next one (WebGPU, WebGL, Canvas 2D), and the promise
     * rejects only when all of them fail. Drawing is a no-op until it resolves.
     * If the GPU device or WebGL context is lost later, `"auto"` switches to the
     * next backend in the same order.
     *
     * An engine mounts into one element at a time: mounting again while mounting or
     * mounted rejects. {@link destroy} keeps the scene, so a destroyed engine can be
     * mounted again, for example into another element. Destroying while mounting
     * resolves the pending mount at once, even if a backend is still starting.
     */
    async mount(target) {
        if (this.state !== "idle") {
            throw new Error("3d-spinner: this engine is already mounted. Call destroy() before mounting it again.");
        }
        this.state = "mounting";
        const generation = this.generation;
        const cancelled = new Promise((resolve) => {
            this.cancelMount = resolve;
        });
        const starting = this.candidates().then((candidates) => this.startRenderer(target, generation, candidates));
        try {
            // A backend that never finishes starting must not keep the mount pending after destroy().
            // A renderer that arrives late is still cleaned up by the generation checks.
            await Promise.race([starting, cancelled]);
        }
        catch (error) {
            if (generation === this.generation)
                this.state = "idle";
            throw error;
        }
        finally {
            if (generation === this.generation)
                this.cancelMount = undefined;
        }
    }
    /** The backends to try, best first: every supported one for `"auto"`, else the chosen one. */
    async candidates() {
        return this.backend === "auto" ? resolveAutoCandidates() : [this.backend];
    }
    /** Mount the first candidate that starts, or reject with every candidate's error. */
    async startRenderer(target, generation, candidates) {
        const failures = [];
        for (const [index, candidate] of candidates.entries()) {
            if (generation !== this.generation)
                return;
            try {
                const surface = await this.startSurface(target, generation, candidate);
                if (!surface)
                    return;
                this.surface = surface;
                this.fallbacks = candidates.slice(index + 1);
                this.state = "mounted";
                surface.renderer?.onLost?.((reason) => this.recover(surface, target, reason));
                return;
            }
            catch (error) {
                if (generation !== this.generation)
                    return;
                if (candidates.length === 1)
                    throw error;
                failures.push(failure(candidate, error));
            }
        }
        throw new Error(`3d-spinner: no renderer could start (${failures.join("; ")})`);
    }
    /**
     * Replace a mounted renderer that stopped working with the next backend
     * `"auto"` would have tried. `mount()` has resolved by then, so there is no
     * promise left to reject: when no backend is left or none starts, the canvas
     * stays removed and a console warning says why.
     */
    recover(surface, target, reason) {
        if (this.surface !== surface)
            return;
        this.surface = undefined;
        try {
            release(surface);
        }
        catch {
            // A renderer that lost its GPU may fail to clean up; the next backend still gets its turn.
        }
        const warn = (detail) => console.warn(`3d-spinner: the renderer stopped working (${reason}); ${detail}`);
        if (this.fallbacks.length === 0) {
            warn("no other backend is left.");
            return;
        }
        this.startRenderer(target, this.generation, this.fallbacks).catch((error) => {
            warn(`switching failed: ${error instanceof Error ? error.message : String(error)}`);
        });
    }
    /**
     * Start `candidate` on a fresh canvas and size it. Resolves with the started
     * surface, or `undefined` when the engine was destroyed meanwhile. On failure
     * or cancellation, everything the attempt created is released first.
     */
    async startSurface(target, generation, candidate) {
        const surface = this.openSurface(target);
        this.attempt = surface;
        try {
            surface.renderer = await this.createRenderer(candidate);
            if (generation === this.generation) {
                await surface.renderer.init(surface.canvas);
                surface.started = true;
                this.resize(surface);
            }
        }
        catch (error) {
            try {
                release(surface);
            }
            catch {
                // A half-initialized renderer may fail to clean up; the next candidate still gets its turn.
            }
            throw error;
        }
        finally {
            if (this.attempt === surface)
                this.attempt = undefined;
        }
        if (generation === this.generation)
            return surface;
        release(surface);
        return undefined;
    }
    /** Construct the renderer for `candidate`, through `rendererFor` when it is set. */
    async createRenderer(candidate) {
        const options = { background: this.background };
        return typeof candidate === "string" && this.rendererFor
            ? this.rendererFor(candidate, options)
            : createRenderer(candidate, options);
    }
    /** Append a fresh full-size canvas to `target` and start tracking its size. */
    openSurface(target) {
        const canvas = document.createElement("canvas");
        canvas.style.display = "block";
        canvas.style.width = "100%";
        canvas.style.height = "100%";
        target.appendChild(canvas);
        const surface = {
            canvas,
            observer: new ResizeObserver(() => this.resize(surface)),
            cssWidth: 0,
            cssHeight: 0,
            started: false,
        };
        surface.observer.observe(canvas);
        this.resize(surface);
        return surface;
    }
    /** Add a mesh to the scene and return a handle for animating it. */
    add(mesh, init) {
        const entry = {
            mesh,
            transform: makeTransform(init),
            transparency: init?.transparency,
            remove: () => {
                const i = this.scene.indexOf(entry);
                if (i < 0)
                    return;
                this.scene.splice(i, 1);
                if (!this.scene.some((other) => other.mesh === mesh)) {
                    this.surface?.renderer?.releaseMesh?.(mesh);
                }
            },
        };
        this.scene.push(entry);
        return entry;
    }
    /** Match the canvas's pixel size to its CSS size, and tell a started renderer. */
    resize(surface) {
        const { canvas } = surface;
        const dpr = window.devicePixelRatio || 1;
        surface.cssWidth = canvas.clientWidth || canvas.parentElement?.clientWidth || 0;
        surface.cssHeight = canvas.clientHeight || canvas.parentElement?.clientHeight || 0;
        canvas.width = Math.max(1, Math.round(surface.cssWidth * dpr));
        canvas.height = Math.max(1, Math.round(surface.cssHeight * dpr));
        if (surface.started)
            surface.renderer?.resize(surface.cssWidth, surface.cssHeight, dpr);
    }
    /** Draw a single frame from the current scene state. */
    render() {
        const surface = this.surface;
        const renderer = surface?.renderer;
        if (!surface || !renderer)
            return;
        const width = surface.cssWidth;
        const height = surface.cssHeight;
        if (width === 0 || height === 0)
            return;
        const items = this.scene.map((entry) => ({
            mesh: entry.mesh,
            model: modelMatrix(entry.transform),
            transparency: entry.transparency,
        }));
        const eye = this.camera.options.position;
        renderer.render({
            items: orderRenderItems(items, eye),
            viewProjection: this.camera.viewProjection(width / height),
            eye,
            light: this.light.params,
            width,
            height,
        });
    }
    /** Start an internal animation loop that calls {@link render} each frame. */
    start() {
        if (this.running)
            return;
        this.running = true;
        const loop = () => {
            if (!this.running)
                return;
            this.render();
            this.rafId = requestAnimationFrame(loop);
        };
        this.rafId = requestAnimationFrame(loop);
    }
    /** Stop the internal animation loop started by {@link start}. */
    stop() {
        this.running = false;
        if (this.rafId)
            cancelAnimationFrame(this.rafId);
        this.rafId = 0;
    }
    /** Stop animating, release the renderer, and remove the canvas. */
    destroy() {
        this.generation++;
        this.cancelMount?.();
        this.cancelMount = undefined;
        this.state = "idle";
        this.stop();
        const { surface, attempt } = this;
        this.surface = undefined;
        this.attempt = undefined;
        this.fallbacks = [];
        // A renderer that is still starting is never destroyed mid-init; its attempt
        // releases it as soon as init settles.
        if (attempt)
            detach(attempt);
        if (surface)
            release(surface);
    }
}
export { Camera } from "./core/camera.js";
export { Light } from "./core/light.js";
export { cube } from "./shapes/primitives/cube.js";
export { quad } from "./shapes/primitives/quad.js";
export { tetrahedron } from "./shapes/primitives/tetrahedron.js";
export { octahedron } from "./shapes/primitives/octahedron.js";
export { pyramid } from "./shapes/primitives/pyramid.js";
export { uvSphere } from "./shapes/primitives/spheres/uv-sphere.js";
export { icosphere } from "./shapes/primitives/spheres/icosphere.js";
export { octaSphere } from "./shapes/primitives/spheres/octa-sphere.js";
export { cubeSphere } from "./shapes/primitives/spheres/cube-sphere.js";
export { planeMesh } from "./shapes/complex/plane.js";
export { starTexture } from "./textures/dynamic/star.js";
export { shineTexture } from "./textures/dynamic/shine.js";
export { streakTexture } from "./textures/dynamic/streak.js";
export { expandToTriangles } from "./core/geometry.js";
export { transform, attachMaterial } from "./core/mesh.js";
export { orderRenderItems, chooseBackend, autoBackendCandidates, detectBackendSupport, resolveBackend, } from "./renderer.js";
export { vec3, subtract, cross, dot, scale, normalize } from "./core/math.js";
