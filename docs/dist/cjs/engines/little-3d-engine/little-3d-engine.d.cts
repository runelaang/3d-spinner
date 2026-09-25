import { type CameraOptions } from "./core/camera.cjs";
import { type LightOptions } from "./core/light.cjs";
import { type Mesh, type Transform, type Transparency } from "./core/mesh.cjs";
import { type Backend, type Renderer, type RendererFactory, type RendererOptions, type ResolvedBackend } from "./renderer.cjs";
/** Options for {@link Little3dEngine}. */
export interface Little3dEngineOptions {
    /**
     * Rendering backend, or a factory building a custom renderer. Loaded on
     * demand. Default `"auto"`: WebGPU, then WebGL, then Canvas 2D.
     */
    backend?: Backend | RendererFactory;
    /**
     * Build the renderer for a named backend instead of the built-in one, for
     * example a textured variant. With `"auto"`, it is called for each backend
     * tried in turn, so fallback still applies. Unused when `backend` is a factory.
     */
    rendererFor?: (backend: ResolvedBackend, options: RendererOptions) => Renderer | Promise<Renderer>;
    camera?: Partial<CameraOptions>;
    light?: Partial<LightOptions>;
    /** Solid background color; omit for a transparent canvas (overlay use). */
    background?: string;
}
/**
 * A live mesh in the scene. Mutate `transform` to move or rotate it. The mesh
 * itself is treated as immutable once drawn; add a new one to change its shape.
 */
export interface MeshHandle {
    readonly mesh: Mesh;
    readonly transform: Transform;
    /** Optional per-instance transparency. Mutate or replace it between frames. */
    transparency?: Transparency;
    /** Remove this instance; GPU buffers are freed with the mesh's last instance. */
    remove(): void;
}
/** Initial state for one mesh instance. */
export interface MeshInstanceOptions extends Partial<Transform> {
    transparency?: Transparency;
}
/**
 * A minimal software/hardware 3D engine. It projects colored meshes with flat
 * directional lighting through a swappable {@link Backend} renderer. Mount it
 * into any element to render in a component, or into a transparent positioned
 * element to overlay a page.
 */
export declare class Little3dEngine {
    private readonly camera;
    private readonly light;
    private readonly backend;
    private readonly rendererFor?;
    private readonly background?;
    private readonly scene;
    /** The mounted surface: its renderer is initialized and sized. */
    private surface?;
    /** The surface of the backend attempt in progress, if any. */
    private attempt?;
    /** The candidates after the mounted one, to switch to if its renderer is lost. */
    private fallbacks;
    private state;
    private generation;
    private cancelMount?;
    private rafId;
    private running;
    constructor(options?: Little3dEngineOptions);
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
    mount(target: HTMLElement): Promise<void>;
    /** The backends to try, best first: every supported one for `"auto"`, else the chosen one. */
    private candidates;
    /** Mount the first candidate that starts, or reject with every candidate's error. */
    private startRenderer;
    /**
     * Replace a mounted renderer that stopped working with the next backend
     * `"auto"` would have tried. `mount()` has resolved by then, so there is no
     * promise left to reject: when no backend is left or none starts, the canvas
     * stays removed and a console warning says why.
     */
    private recover;
    /**
     * Start `candidate` on a fresh canvas and size it. Resolves with the started
     * surface, or `undefined` when the engine was destroyed meanwhile. On failure
     * or cancellation, everything the attempt created is released first.
     */
    private startSurface;
    /** Construct the renderer for `candidate`, through `rendererFor` when it is set. */
    private createRenderer;
    /** Append a fresh full-size canvas to `target` and start tracking its size. */
    private openSurface;
    /** Add a mesh to the scene and return a handle for animating it. */
    add(mesh: Mesh, init?: MeshInstanceOptions): MeshHandle;
    /** Match the canvas's pixel size to its CSS size, and tell a started renderer. */
    private resize;
    /** Draw a single frame from the current scene state. */
    render(): void;
    /** Start an internal animation loop that calls {@link render} each frame. */
    start(): void;
    /** Stop the internal animation loop started by {@link start}. */
    stop(): void;
    /** Stop animating, release the renderer, and remove the canvas. */
    destroy(): void;
}
export { Camera, type CameraOptions } from "./core/camera.cjs";
export { Light, type LightOptions, type LightParams } from "./core/light.cjs";
export { cube } from "./shapes/primitives/cube.cjs";
export { quad } from "./shapes/primitives/quad.cjs";
export { tetrahedron } from "./shapes/primitives/tetrahedron.cjs";
export { octahedron } from "./shapes/primitives/octahedron.cjs";
export { pyramid } from "./shapes/primitives/pyramid.cjs";
export { uvSphere } from "./shapes/primitives/spheres/uv-sphere.cjs";
export { icosphere } from "./shapes/primitives/spheres/icosphere.cjs";
export { octaSphere } from "./shapes/primitives/spheres/octa-sphere.cjs";
export { cubeSphere } from "./shapes/primitives/spheres/cube-sphere.cjs";
export { planeMesh } from "./shapes/complex/plane.cjs";
export { starTexture } from "./textures/dynamic/star.cjs";
export { shineTexture } from "./textures/dynamic/shine.cjs";
export { streakTexture } from "./textures/dynamic/streak.cjs";
export { expandToTriangles } from "./core/geometry.cjs";
export type { Mesh, Face, Material, Transform, Transparency, OneSidedTransparency, TwoSidedTransparency, } from "./core/mesh.cjs";
export { transform, attachMaterial } from "./core/mesh.cjs";
export type { Backend, BackendSupport, ResolvedBackend, Renderer, RendererFactory, RenderFrame, RenderItem, RendererOptions, } from "./renderer.cjs";
export { orderRenderItems, chooseBackend, autoBackendCandidates, detectBackendSupport, resolveBackend, } from "./renderer.cjs";
export { type Vec3, vec3, subtract, cross, dot, scale, normalize } from "./core/math.cjs";
