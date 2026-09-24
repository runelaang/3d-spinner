import { Camera, type CameraOptions } from "./core/camera.js";
import { Light, type LightOptions } from "./core/light.js";
import {
  type Mat4,
  multiply,
  rotationFromEuler,
  scaleMatrix,
  translation,
} from "./core/math.js";
import {
  type Mesh,
  type Transform,
  type Transparency,
  transform as makeTransform,
} from "./core/mesh.js";
import {
  type Backend,
  type Renderer,
  type RendererFactory,
  type RenderItem,
  createRenderer,
  orderRenderItems,
  resolveAutoCandidates,
} from "./renderer.js";

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

function modelMatrix(t: Transform): Mat4 {
  const rotation = rotationFromEuler(t.rotation.x, t.rotation.y, t.rotation.z);
  return multiply(
    translation(t.position.x, t.position.y, t.position.z),
    multiply(rotation, scaleMatrix(t.scale)),
  );
}

/**
 * A minimal software/hardware 3D engine. It projects colored meshes with flat
 * directional lighting through a swappable {@link Backend} renderer. Mount it
 * into any element to render in a component, or into a transparent positioned
 * element to overlay a page.
 */
export class Little3dEngine {
  private readonly camera: Camera;
  private readonly light: Light;
  private readonly backend: Backend | RendererFactory;
  private readonly background?: string;
  private readonly scene: MeshHandle[] = [];

  private canvas?: HTMLCanvasElement;
  private observer?: ResizeObserver;
  private renderer?: Renderer;
  private cssWidth = 0;
  private cssHeight = 0;
  private ready = false;
  private state: "idle" | "mounting" | "mounted" = "idle";
  private generation = 0;
  private rafId = 0;
  private running = false;

  constructor(options: Little3dEngineOptions = {}) {
    this.camera = new Camera(options.camera);
    this.light = new Light(options.light);
    this.backend = options.backend ?? "auto";
    this.background = options.background;
  }

  /**
   * Create the canvas inside `target`, load the selected backend, and start
   * tracking size. Resolves once the renderer is ready; rejects if the backend
   * is unavailable. With `"auto"`, a backend that fails to load or initialize
   * is replaced by the next one (WebGPU, WebGL, Canvas 2D), and the promise
   * rejects only when all of them fail. Drawing is a no-op until it resolves.
   *
   * An engine mounts into one element at a time: mounting again while mounting or
   * mounted rejects. {@link destroy} keeps the scene, so a destroyed engine can be
   * mounted again, for example into another element.
   */
  async mount(target: HTMLElement): Promise<void> {
    if (this.state !== "idle") {
      throw new Error("3d-spinner: this engine is already mounted. Call destroy() before mounting it again.");
    }
    this.state = "mounting";
    const generation = this.generation;
    try {
      await this.startRenderer(target, generation);
    } catch (error) {
      if (generation === this.generation) this.state = "idle";
      throw error;
    }
  }

  /** Try each backend candidate in order until one initializes on a fresh canvas. */
  private async startRenderer(target: HTMLElement, generation: number): Promise<void> {
    const candidates: Array<Backend | RendererFactory> =
      this.backend === "auto" ? await resolveAutoCandidates() : [this.backend];
    if (generation !== this.generation) return;

    const failures: string[] = [];
    for (const candidate of candidates) {
      const canvas = this.attachCanvas(target);
      let renderer: Renderer | undefined;
      try {
        renderer = await createRenderer(candidate, { background: this.background });
        if (generation === this.generation) await renderer.init(canvas);
        if (generation !== this.generation) {
          renderer.destroy();
          this.dropCanvas(canvas);
          return;
        }
        this.renderer = renderer;
        this.resize();
        this.ready = true;
        this.state = "mounted";
        return;
      } catch (error) {
        try {
          renderer?.destroy();
        } catch {}
        this.dropCanvas(canvas);
        if (generation !== this.generation) return;
        if (candidates.length === 1) throw error;
        const name = typeof candidate === "string" ? candidate : "custom";
        failures.push(`${name}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
    throw new Error(`3d-spinner: no renderer could start (${failures.join("; ")})`);
  }

  /** Append a fresh full-size canvas to `target` and track its size. */
  private attachCanvas(target: HTMLElement): HTMLCanvasElement {
    const canvas = document.createElement("canvas");
    canvas.style.display = "block";
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    target.appendChild(canvas);
    this.canvas = canvas;
    this.observer = new ResizeObserver(() => this.resize());
    this.observer.observe(canvas);
    this.resize();
    return canvas;
  }

  /** Remove `canvas` and its size observer, if it is still the current canvas. */
  private dropCanvas(canvas: HTMLCanvasElement): void {
    if (this.canvas !== canvas) return;
    this.observer?.disconnect();
    this.observer = undefined;
    canvas.remove();
    this.canvas = undefined;
  }

  /** Add a mesh to the scene and return a handle for animating it. */
  add(mesh: Mesh, init?: MeshInstanceOptions): MeshHandle {
    const entry: MeshHandle = {
      mesh,
      transform: makeTransform(init),
      transparency: init?.transparency,
      remove: () => {
        const i = this.scene.indexOf(entry);
        if (i >= 0) this.scene.splice(i, 1);
      },
    };
    this.scene.push(entry);
    return entry;
  }

  private resize(): void {
    const canvas = this.canvas;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    this.cssWidth = canvas.clientWidth || canvas.parentElement?.clientWidth || 0;
    this.cssHeight = canvas.clientHeight || canvas.parentElement?.clientHeight || 0;
    canvas.width = Math.max(1, Math.round(this.cssWidth * dpr));
    canvas.height = Math.max(1, Math.round(this.cssHeight * dpr));
    this.renderer?.resize(this.cssWidth, this.cssHeight, dpr);
  }

  /** Draw a single frame from the current scene state. */
  render(): void {
    if (!this.ready || !this.renderer) return;
    const width = this.cssWidth;
    const height = this.cssHeight;
    if (width === 0 || height === 0) return;

    const items: RenderItem[] = this.scene.map((entry) => ({
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
  start(): void {
    if (this.running) return;
    this.running = true;
    const loop = () => {
      if (!this.running) return;
      this.render();
      this.rafId = requestAnimationFrame(loop);
    };
    this.rafId = requestAnimationFrame(loop);
  }

  /** Stop the internal animation loop started by {@link start}. */
  stop(): void {
    this.running = false;
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.rafId = 0;
  }

  /** Stop animating, release the renderer, and remove the canvas. */
  destroy(): void {
    this.generation++;
    this.ready = false;
    this.state = "idle";
    this.stop();
    this.observer?.disconnect();
    this.observer = undefined;
    this.renderer?.destroy();
    this.renderer = undefined;
    this.canvas?.remove();
    this.canvas = undefined;
  }
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
export type {
  Mesh,
  Face,
  Material,
  Transform,
  Transparency,
  OneSidedTransparency,
  TwoSidedTransparency,
} from "./core/mesh.js";
export { transform, attachMaterial } from "./core/mesh.js";
export type {
  Backend,
  BackendSupport,
  ResolvedBackend,
  Renderer,
  RendererFactory,
  RenderFrame,
  RenderItem,
  RendererOptions,
} from "./renderer.js";
export {
  orderRenderItems,
  chooseBackend,
  autoBackendCandidates,
  detectBackendSupport,
  resolveBackend,
} from "./renderer.js";
export {
  type Vec3,
  vec3,
  subtract,
  cross,
  dot,
  scale,
  normalize,
} from "./core/math.js";
