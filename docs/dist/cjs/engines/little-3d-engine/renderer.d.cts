import type { LightParams } from "./core/light.cjs";
import type { Mat4, Vec3 } from "./core/math.cjs";
import type { Mesh, Transparency, TwoSidedTransparency } from "./core/mesh.cjs";
/**
 * Rendering backend. Each is loaded on demand; unused ones are never fetched.
 * `"auto"` picks the best one the browser supports - WebGPU, then WebGL, then
 * Canvas 2D - and is the default.
 */
export type Backend = "auto" | "canvas2d" | "webgl" | "webgpu";
/** A backend that can be constructed directly, with `"auto"` already resolved. */
export type ResolvedBackend = Exclude<Backend, "auto">;
/** Which hardware backends the current browser can actually run. */
export interface BackendSupport {
    webgpu: boolean;
    webgl: boolean;
}
/** Best supported backend, in descending order of capability. */
export declare function chooseBackend(support: BackendSupport): ResolvedBackend;
/**
 * Test what the browser supports without loading any backend. The probes are a
 * WebGPU adapter request and a throwaway WebGL2 context, so choosing `"auto"`
 * never downloads or compiles the code for a backend it then rejects.
 */
export declare function detectBackendSupport(): Promise<BackendSupport>;
/** Resolve `"auto"` once per page and reuse the answer for later mounts. */
export declare function resolveBackend(backend: Backend): Promise<ResolvedBackend>;
/**
 * Every backend `"auto"` may try, best first. Canvas 2D is always last, so a
 * GPU backend that passes the probe but fails to start still has a fallback.
 */
export declare function autoBackendCandidates(support: BackendSupport): ResolvedBackend[];
/** {@link autoBackendCandidates} for this browser, using the cached probe. */
export declare function resolveAutoCandidates(): Promise<ResolvedBackend[]>;
/** A mesh plus its world transform, ready to draw. */
export interface RenderItem {
    mesh: Mesh;
    model: Mat4;
    transparency?: Transparency;
}
export declare const DEFAULT_ONE_SIDED_OPACITY = 0.35;
export declare const DEFAULT_BACK_OPACITY = 0.84;
export declare const DEFAULT_FRONT_OPACITY = 0.56;
/** Clamp an optional opacity to the range accepted by rendering backends. */
export declare function opacity(value: number | undefined, fallback: number): number;
/** Resolve two-sided defaults, shorthand, and explicit per-side overrides. */
export declare function resolveTwoSidedOpacity(transparency: TwoSidedTransparency): {
    front: number;
    back: number;
};
/** Draw opaque instances first, then transparent instances from farthest to nearest. */
export declare function orderRenderItems(items: ReadonlyArray<RenderItem>, eye: Vec3): RenderItem[];
/** Everything a renderer needs to draw one frame. */
export interface RenderFrame {
    items: ReadonlyArray<RenderItem>;
    /** Combined view-projection (OpenGL clip space, z in -1..1). */
    viewProjection: Mat4;
    /** Camera position, for backface culling. */
    eye: Vec3;
    light: LightParams;
    /** Logical (CSS pixel) viewport size. */
    width: number;
    height: number;
}
/** Construction-time options shared by all backends. */
export interface RendererOptions {
    /** Solid background; omit for a transparent canvas (overlay use). */
    background?: string;
}
/**
 * Builds a custom {@link Renderer}; an alternative to naming a built-in
 * backend. Load the renderer module inside the factory with a dynamic
 * `import()` to keep it out of the bundle until it is used.
 */
export type RendererFactory = (options: RendererOptions) => Renderer | Promise<Renderer>;
/**
 * A pluggable drawing backend. The engine owns the canvas and sizing; a
 * renderer only initializes its context, reacts to resizes, and draws frames.
 * Renderer-specific features can produce intentional visual differences.
 *
 * A mesh is treated as immutable once drawn: GPU backends upload it once and
 * cache the buffers per `Mesh` object. To change geometry or colors, add a new
 * `Mesh` instead of editing one in place.
 */
export interface Renderer {
    init(canvas: HTMLCanvasElement): void | Promise<void>;
    resize(cssWidth: number, cssHeight: number, dpr: number): void;
    render(frame: RenderFrame): void;
    /**
     * Free whatever is cached for `mesh`. Optional. The engine calls it when the
     * last scene instance of that mesh is removed.
     */
    releaseMesh?(mesh: Mesh): void;
    /**
     * Optional. The engine calls it once `init` succeeded, with a listener to call
     * if the renderer stops working later, for example when the GPU device or the
     * WebGL context is lost. The engine then switches to the next backend `"auto"`
     * would have tried. Do not call it for a loss caused by `destroy()`.
     */
    onLost?(listener: (reason: string) => void): void;
    destroy(): void;
}
/**
 * Load and construct a renderer for `backend`. Each backend lives in its own
 * module and is pulled in with a dynamic `import()`, so the bytes for the
 * backends you do not use are never downloaded or compiled. `"auto"` resolves
 * to the best supported backend before anything is imported.
 */
export declare function createRenderer(backend: Backend | RendererFactory, options?: RendererOptions): Promise<Renderer>;
