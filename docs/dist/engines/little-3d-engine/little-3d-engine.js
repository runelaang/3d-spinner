import { Camera } from "./camera.js";
import { Light } from "./light.js";
import { multiply, rotationX, rotationY, rotationZ, translation, } from "./math.js";
import { transform as makeTransform } from "./mesh.js";
import { createRenderer } from "./renderer.js";
function modelMatrix(t) {
    const rotation = multiply(rotationZ(t.rotation.z), multiply(rotationY(t.rotation.y), rotationX(t.rotation.x)));
    return multiply(translation(t.position.x, t.position.y, t.position.z), rotation);
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
        this.cssWidth = 0;
        this.cssHeight = 0;
        this.ready = false;
        this.generation = 0;
        this.rafId = 0;
        this.running = false;
        this.camera = new Camera(options.camera);
        this.light = new Light(options.light);
        this.backend = options.backend ?? "canvas2d";
        this.background = options.background;
    }
    /**
     * Create the canvas inside `target`, load the selected backend, and start
     * tracking size. Resolves once the renderer is ready; rejects if the backend
     * is unavailable. Drawing is a no-op until it resolves.
     */
    async mount(target) {
        const canvas = document.createElement("canvas");
        canvas.style.display = "block";
        canvas.style.width = "100%";
        canvas.style.height = "100%";
        target.appendChild(canvas);
        this.canvas = canvas;
        this.observer = new ResizeObserver(() => this.resize());
        this.observer.observe(canvas);
        this.resize();
        const generation = this.generation;
        const renderer = await createRenderer(this.backend, { background: this.background });
        if (generation !== this.generation) {
            renderer.destroy();
            return;
        }
        await renderer.init(canvas);
        if (generation !== this.generation) {
            renderer.destroy();
            return;
        }
        this.renderer = renderer;
        this.resize();
        this.ready = true;
    }
    /** Add a mesh to the scene and return a handle for animating it. */
    add(mesh, init) {
        const entry = { mesh, transform: makeTransform(init) };
        this.scene.push(entry);
        return {
            mesh,
            transform: entry.transform,
            remove: () => {
                const i = this.scene.indexOf(entry);
                if (i >= 0)
                    this.scene.splice(i, 1);
            },
        };
    }
    resize() {
        const canvas = this.canvas;
        if (!canvas)
            return;
        const dpr = window.devicePixelRatio || 1;
        this.cssWidth = canvas.clientWidth || canvas.parentElement?.clientWidth || 0;
        this.cssHeight = canvas.clientHeight || canvas.parentElement?.clientHeight || 0;
        canvas.width = Math.max(1, Math.round(this.cssWidth * dpr));
        canvas.height = Math.max(1, Math.round(this.cssHeight * dpr));
        this.renderer?.resize(this.cssWidth, this.cssHeight, dpr);
    }
    /** Draw a single frame from the current scene state. */
    render() {
        if (!this.ready || !this.renderer)
            return;
        const width = this.cssWidth;
        const height = this.cssHeight;
        if (width === 0 || height === 0)
            return;
        const items = this.scene.map((entry) => ({
            mesh: entry.mesh,
            model: modelMatrix(entry.transform),
        }));
        this.renderer.render({
            items,
            viewProjection: this.camera.viewProjection(width / height),
            eye: this.camera.options.position,
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
        this.ready = false;
        this.stop();
        this.observer?.disconnect();
        this.observer = undefined;
        this.renderer?.destroy();
        this.renderer = undefined;
        this.canvas?.remove();
        this.canvas = undefined;
    }
}
export { Camera } from "./camera.js";
export { Light } from "./light.js";
export { cube } from "./shapes/cube.js";
export { tetrahedron } from "./shapes/tetrahedron.js";
export { octahedron } from "./shapes/octahedron.js";
export { pyramid } from "./shapes/pyramid.js";
export { uvSphere } from "./shapes/uv-sphere.js";
export { icosphere } from "./shapes/icosphere.js";
export { octaSphere } from "./shapes/octa-sphere.js";
export { cubeSphere } from "./shapes/cube-sphere.js";
export { expandToTriangles } from "./geometry.js";
export { transform } from "./mesh.js";
export { vec3, subtract, cross, dot, scale, normalize, } from "./math.js";
