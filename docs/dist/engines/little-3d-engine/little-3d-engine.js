import { Camera } from "./core/camera.js";
import { Light } from "./core/light.js";
import { multiply, rotationX, rotationY, rotationZ, scaleMatrix, translation, } from "./core/math.js";
import { transform as makeTransform, } from "./core/mesh.js";
import { createRenderer, orderRenderItems, } from "./renderer.js";
function modelMatrix(t) {
    const rotation = multiply(rotationZ(t.rotation.z), multiply(rotationY(t.rotation.y), rotationX(t.rotation.x)));
    return multiply(translation(t.position.x, t.position.y, t.position.z), multiply(rotation, scaleMatrix(t.scale)));
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
        const dropCanvas = () => {
            if (this.canvas !== canvas)
                return;
            this.observer?.disconnect();
            this.observer = undefined;
            canvas.remove();
            this.canvas = undefined;
        };
        try {
            const renderer = await createRenderer(this.backend, { background: this.background });
            if (generation !== this.generation) {
                renderer.destroy();
                dropCanvas();
                return;
            }
            await renderer.init(canvas);
            if (generation !== this.generation) {
                renderer.destroy();
                dropCanvas();
                return;
            }
            this.renderer = renderer;
            this.resize();
            this.ready = true;
        }
        catch (error) {
            dropCanvas();
            throw error;
        }
    }
    /** Add a mesh to the scene and return a handle for animating it. */
    add(mesh, init) {
        const entry = {
            mesh,
            transform: makeTransform(init),
            transparency: init?.transparency,
            remove: () => {
                const i = this.scene.indexOf(entry);
                if (i >= 0)
                    this.scene.splice(i, 1);
            },
        };
        this.scene.push(entry);
        return entry;
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
            transparency: entry.transparency,
        }));
        const eye = this.camera.options.position;
        this.renderer.render({
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
export { transform } from "./core/mesh.js";
export { orderRenderItems } from "./renderer.js";
export { vec3, subtract, cross, dot, scale, normalize, } from "./core/math.js";
