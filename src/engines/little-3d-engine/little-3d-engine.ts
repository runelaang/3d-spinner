import { Camera, type CameraOptions } from "./core/camera.js";
import { Light, type LightOptions } from "./core/light.js";
import {
  type Mat4,
  multiply,
  rotationX,
  rotationY,
  rotationZ,
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
  const rotation = multiply(
    rotationZ(t.rotation.z),
    multiply(rotationY(t.rotation.y), rotationX(t.rotation.x)),
  );
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
   * is unavailable. Drawing is a no-op until it resolves.
   */
  async mount(target: HTMLElement): Promise<void> {
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
      if (this.canvas !== canvas) return;
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
    } catch (error) {
      dropCanvas();
      throw error;
    }
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
