import { type CameraOptions } from "./camera.js";
import { type LightOptions } from "./light.js";
import { type Mesh, type Transform } from "./mesh.js";
import { type Backend } from "./renderer.js";
/** Options for {@link Little3dEngine}. */
export interface Little3dEngineOptions {
    /** Rendering backend. Loaded on demand. Default `"canvas2d"`. */
    backend?: Backend;
    camera?: Partial<CameraOptions>;
    light?: Partial<LightOptions>;
    /** Solid background color; omit for a transparent canvas (overlay use). */
    background?: string;
}
/** A live mesh in the scene. Mutate `transform` to move or rotate it. */
export interface MeshHandle {
    readonly mesh: Mesh;
    readonly transform: Transform;
    /** Remove this mesh from the scene. */
    remove(): void;
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
    add(mesh: Mesh, init?: Partial<Transform>): MeshHandle;
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
export { Camera, type CameraOptions } from "./camera.js";
export { Light, type LightOptions, type LightParams } from "./light.js";
export { cube } from "./shapes/cube.js";
export { tetrahedron } from "./shapes/tetrahedron.js";
export { octahedron } from "./shapes/octahedron.js";
export { pyramid } from "./shapes/pyramid.js";
export { uvSphere } from "./shapes/uv-sphere.js";
export { icosphere } from "./shapes/icosphere.js";
export { octaSphere } from "./shapes/octa-sphere.js";
export { cubeSphere } from "./shapes/cube-sphere.js";
export { expandToTriangles } from "./geometry.js";
export type { Mesh, Face, Transform } from "./mesh.js";
export { transform } from "./mesh.js";
export type { Backend, Renderer, RenderFrame, RenderItem, RendererOptions } from "./renderer.js";
export { type Vec3, vec3, subtract, cross, dot, scale, normalize, } from "./math.js";
