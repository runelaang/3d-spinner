import { type CameraOptions } from "./core/camera.js";
import { type LightOptions } from "./core/light.js";
import { type Mesh, type Transform, type Transparency } from "./core/mesh.js";
import { type Backend, type RendererFactory } from "./renderer.js";
/** Options for {@link Little3dEngine}. */
export interface Little3dEngineOptions {
    /**
     * Rendering backend, or a factory building a custom renderer. Loaded on
     * demand. Default `"auto"`: WebGPU, then WebGL, then Canvas 2D.
     */
    backend?: Backend | RendererFactory;
    camera?: Partial<CameraOptions>;
    light?: Partial<LightOptions>;
    /** Solid background color; omit for a transparent canvas (overlay use). */
    background?: string;
}
/** A live mesh in the scene. Mutate `transform` to move or rotate it. */
export interface MeshHandle {
    readonly mesh: Mesh;
    readonly transform: Transform;
    /** Optional per-instance transparency. Mutate or replace it between frames. */
    transparency?: Transparency;
    /** Remove this mesh from the scene. */
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
    private readonly background?;
    private readonly scene;
    private canvas?;
    private observer?;
    private renderer?;
    private cssWidth;
    private cssHeight;
    private ready;
    private generation;
    private rafId;
    private running;
    constructor(options?: Little3dEngineOptions);
    /**
     * Create the canvas inside `target`, load the selected backend, and start
     * tracking size. Resolves once the renderer is ready; rejects if the backend
     * is unavailable. Drawing is a no-op until it resolves.
     */
    mount(target: HTMLElement): Promise<void>;
    /** Add a mesh to the scene and return a handle for animating it. */
    add(mesh: Mesh, init?: MeshInstanceOptions): MeshHandle;
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
export { Camera, type CameraOptions } from "./core/camera.js";
export { Light, type LightOptions, type LightParams } from "./core/light.js";
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
export type { Mesh, Face, Material, Transform, Transparency, OneSidedTransparency, TwoSidedTransparency, } from "./core/mesh.js";
export { transform, attachMaterial } from "./core/mesh.js";
export type { Backend, BackendSupport, ResolvedBackend, Renderer, RendererFactory, RenderFrame, RenderItem, RendererOptions, } from "./renderer.js";
export { orderRenderItems, chooseBackend, detectBackendSupport, resolveBackend, } from "./renderer.js";
export { type Vec3, vec3, subtract, cross, dot, scale, normalize, } from "./core/math.js";
