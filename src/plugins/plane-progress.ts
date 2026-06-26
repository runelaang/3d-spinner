import type { SpinnerPlugin, SpinnerPluginState } from "../plugin.js";
import {
  Little3dEngine,
  type Backend,
  type Mesh,
  type MeshHandle,
} from "../engines/little-3d-engine/little-3d-engine.js";
import { easeOutExpo } from "../engines/little-tween-engine/core/tweens.js";

export interface PlaneProgressOptions {
  /** Plane mesh, or a factory that returns one. */
  mesh: Mesh | (() => Mesh);
  /** Face color applied to every triangle. Default `"#cbd5e1"`. */
  color?: string;
  /** Rendering backend. Default `"canvas2d"`. */
  backend?: Backend;
  /** Figure-8 path radius in scene units. Default `0.55`. */
  pathRadius?: number;
  /** Duration of the fly-out at 100% in milliseconds. Default `800`. */
  flyOutDurationMs?: number;
}

const LABEL_STYLE = [
  "position:absolute",
  "inset:0",
  "display:flex",
  "align-items:center",
  "justify-content:center",
  "pointer-events:none",
  "font:700 1.35rem/1 system-ui,sans-serif",
  "letter-spacing:0.02em",
  "color:rgba(255,255,255,0.85)",
  "text-shadow:0 1px 8px rgba(0,0,0,0.55)",
  "z-index:1",
].join(";");

function resolveMesh(mesh: PlaneProgressOptions["mesh"]): Mesh {
  return typeof mesh === "function" ? mesh() : mesh;
}

function applyColor(mesh: Mesh, color: string): Mesh {
  return {
    vertices: mesh.vertices,
    faces: mesh.faces.map((face) => ({ ...face, color })),
  };
}

/** Centers mesh at the origin and scales it to fit within `targetSize`. */
export function centerAndScaleMesh(mesh: Mesh, targetSize: number): Mesh {
  let minX = Infinity;
  let minY = Infinity;
  let minZ = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  let maxZ = -Infinity;

  for (const vertex of mesh.vertices) {
    minX = Math.min(minX, vertex.x);
    minY = Math.min(minY, vertex.y);
    minZ = Math.min(minZ, vertex.z);
    maxX = Math.max(maxX, vertex.x);
    maxY = Math.max(maxY, vertex.y);
    maxZ = Math.max(maxZ, vertex.z);
  }

  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;
  const centerZ = (minZ + maxZ) / 2;
  const extent = Math.max(maxX - minX, maxY - minY, maxZ - minZ) || 1;
  const scale = targetSize / extent;

  return {
    vertices: mesh.vertices.map((vertex) => ({
      x: (vertex.x - centerX) * scale,
      y: (vertex.y - centerY) * scale,
      z: (vertex.z - centerZ) * scale,
    })),
    faces: mesh.faces,
  };
}

/** Point and heading on a horizontal figure-8; `progress` is 0..1 along the lap. */
function figureEight(progress: number, radius: number): {
  x: number;
  y: number;
  heading: number;
} {
  const turns = 0.9;
  const t = progress * turns * Math.PI * 2;
  const x = radius * Math.sin(t);
  const y = radius * Math.sin(t) * Math.cos(t);
  const dx = radius * Math.cos(t);
  const dy = radius * Math.cos(t * 2);
  const heading = Math.atan2(dy, dx);
  return { x, y, heading };
}

/** Plane flies a figure-8; progress drives position along the path and a % label overlay. */
export class PlaneProgressSpinner implements SpinnerPlugin {
  private engine?: Little3dEngine;
  private handle?: MeshHandle;
  private label?: HTMLDivElement;
  private readonly mesh: Mesh;
  private readonly pathRadius: number;
  private readonly flyOutDurationMs: number;
  private readonly backend?: Backend;
  private exitStart = 0;
  private exiting = false;
  private exitDone = false;
  private exitOrigin = { x: 0, y: 0, heading: 0 };

  constructor(options: PlaneProgressOptions) {
    const raw = centerAndScaleMesh(resolveMesh(options.mesh), 0.45);
    this.mesh = applyColor(raw, options.color ?? "#cbd5e1");
    this.pathRadius = options.pathRadius ?? 0.55;
    this.flyOutDurationMs = options.flyOutDurationMs ?? 800;
    this.backend = options.backend;
  }

  mount(target: HTMLElement): void {
    target.style.position = "relative";
    const engine = new Little3dEngine({
      backend: this.backend,
      camera: { position: { x: 0, y: 0, z: 2.8 } },
    });
    this.handle = engine.add(this.mesh);
    this.engine = engine;
    engine.mount(target).catch((error) => {
      target.textContent = error instanceof Error ? error.message : String(error);
    });

    const label = document.createElement("div");
    label.style.cssText = LABEL_STYLE;
    label.setAttribute("role", "status");
    label.textContent = "0%";
    target.appendChild(label);
    this.label = label;
  }

  render(now: number, state: SpinnerPluginState): void {
    if (!this.engine || !this.handle || !this.label) return;

    const progress = state.determinate ? state.progress : 0;
    const percent = Math.round(progress * 100);

    if (this.exitDone) {
      if (progress < 1) {
        this.exitDone = false;
        this.exiting = false;
      } else {
        this.label.hidden = true;
        this.handle.transform.scale = 0;
        this.engine.render();
        return;
      }
    }

    if (progress >= 1 && !this.exiting) {
      this.exiting = true;
      this.exitStart = now;
      const endPath = figureEight(1, this.pathRadius);
      this.exitOrigin = endPath;
    }

    if (this.exiting) {
      const exitT = Math.min(1, (now - this.exitStart) / this.flyOutDurationMs);
      const flyDistance = easeOutExpo(exitT) * 2.8;
      const transform = this.handle.transform;
      transform.position.x = this.exitOrigin.x + Math.cos(this.exitOrigin.heading) * flyDistance;
      transform.position.y = this.exitOrigin.y + Math.sin(this.exitOrigin.heading) * flyDistance;
      transform.position.z = 0;
      transform.rotation.z = this.exitOrigin.heading + Math.PI / 2;
      transform.rotation.y = -0.35;
      transform.scale = 1 - exitT * 0.35;
      this.label.textContent = `${percent}%`;
      this.label.style.opacity = String(1 - exitT);
      this.label.hidden = false;

      if (exitT >= 1) {
        this.exitDone = true;
        this.exiting = false;
      }
    } else {
      const path = figureEight(Math.min(progress, 1), this.pathRadius);
      const transform = this.handle.transform;
      transform.position.x = path.x;
      transform.position.y = path.y;
      transform.position.z = 0;
      transform.rotation.z = path.heading + Math.PI / 2;
      transform.rotation.y = -0.35;
      transform.scale = 1;
      this.label.textContent = `${percent}%`;
      this.label.style.opacity = "1";
      this.label.hidden = false;
    }

    this.engine.render();
  }

  destroy(): void {
    this.label?.remove();
    this.label = undefined;
    this.engine?.destroy();
    this.engine = undefined;
    this.handle = undefined;
  }
}
