import { Camera, type CameraOptions } from "./camera.js";
import { Light, type LightOptions } from "./light.js";
import {
  cross,
  dot,
  multiply,
  normalize,
  rotationX,
  rotationY,
  rotationZ,
  subtract,
  transformAffine,
  transformPoint,
  translation,
  type Mat4,
} from "./math.js";
import { type Mesh, type Transform, transform as makeTransform } from "./mesh.js";
import { CanvasRenderer } from "./renderer.js";

/** Options for {@link ThreeDEngine}. */
export interface ThreeDEngineOptions {
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

interface Projected {
  points: { x: number; y: number }[];
  color: string;
  depth: number;
}

function modelMatrix(t: Transform): Mat4 {
  const r = multiply(
    rotationZ(t.rotation.z),
    multiply(rotationY(t.rotation.y), rotationX(t.rotation.x)),
  );
  return multiply(translation(t.position.x, t.position.y, t.position.z), r);
}

/**
 * A minimal software 3D engine: it projects colored meshes onto a 2D canvas
 * with flat directional lighting. Mount it into any element to render in a
 * component, or into a transparent positioned element to overlay a page.
 */
export class ThreeDEngine {
  private readonly camera: Camera;
  private readonly light: Light;
  private readonly renderer: CanvasRenderer;
  private readonly scene: { mesh: Mesh; transform: Transform }[] = [];
  private rafId = 0;
  private running = false;

  constructor(options: ThreeDEngineOptions = {}) {
    this.camera = new Camera(options.camera);
    this.light = new Light(options.light);
    this.renderer = new CanvasRenderer(options.background);
  }

  /** Create the canvas inside `target` and start tracking its size. */
  mount(target: HTMLElement): void {
    this.renderer.mount(target);
  }

  /** Add a mesh to the scene and return a handle for animating it. */
  add(mesh: Mesh, init?: Partial<Transform>): MeshHandle {
    const entry = { mesh, transform: makeTransform(init) };
    this.scene.push(entry);
    return {
      mesh,
      transform: entry.transform,
      remove: () => {
        const i = this.scene.indexOf(entry);
        if (i >= 0) this.scene.splice(i, 1);
      },
    };
  }

  /** Draw a single frame from the current scene state. */
  render(): void {
    const width = this.renderer.width;
    const height = this.renderer.height;
    this.renderer.clear();
    if (width === 0 || height === 0) return;

    const vp = this.camera.viewProjection(width / height);
    const eye = this.camera.options.position;
    const polygons: Projected[] = [];

    for (const { mesh, transform } of this.scene) {
      const model = modelMatrix(transform);
      const world = mesh.vertices.map((v) => transformAffine(model, v));

      for (const face of mesh.faces) {
        const a = world[face.indices[0]];
        const b = world[face.indices[1]];
        const c = world[face.indices[2]];
        const normal = normalize(cross(subtract(b, a), subtract(c, a)));

        if (dot(normal, subtract(eye, a)) <= 0) continue;

        const points = face.indices.map((i) => {
          const ndc = transformPoint(vp, world[i]);
          return this.camera.toScreen(ndc, width, height);
        });

        let depth = 0;
        for (const i of face.indices) depth += this.camera.toView(world[i]).z;
        depth /= face.indices.length;

        polygons.push({ points, color: this.light.shade(normal, face.color), depth });
      }
    }

    polygons.sort((p, q) => p.depth - q.depth);
    for (const poly of polygons) this.renderer.fillPolygon(poly.points, poly.color);
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

  /** Stop animating and remove the canvas. */
  destroy(): void {
    this.stop();
    this.renderer.destroy();
  }
}

export { Camera, type CameraOptions } from "./camera.js";
export { Light, type LightOptions } from "./light.js";
export { cube } from "./shapes.js";
export type { Mesh, Face, Transform } from "./mesh.js";
export { transform } from "./mesh.js";
export {
  type Vec3,
  vec3,
  subtract,
  cross,
  dot,
  scale,
  normalize,
} from "./math.js";
