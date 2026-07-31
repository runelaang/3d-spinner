import type { SpinnerPlugin, SpinnerPluginState } from "../plugin.js";
import {
  Little3dEngine,
  type Backend,
  type Mesh,
  type MeshHandle,
  type Vec3,
  cross,
  normalize,
} from "../engines/little-3d-engine/little-3d-engine.js";

export interface PlaneProgressOptions {
  /** Plane mesh, or a factory that returns one. */
  mesh: Mesh | (() => Mesh);
  /** Face color applied to every triangle. Default `"#cbd5e1"`. */
  color?: string;
  /** Rendering backend. Default `"canvas2d"`. */
  backend?: Backend;
  /** Uniform mesh size after centering. Default `1.6`. */
  meshSize?: number;
}

const LABEL_STYLE = [
  "position:absolute",
  "inset:0",
  "display:flex",
  "align-items:center",
  "justify-content:center",
  "pointer-events:none",
  "font:700 1.6rem/1 system-ui,sans-serif",
  "letter-spacing:0.02em",
  "color:rgba(255,255,255,0.9)",
  "text-shadow:0 1px 10px rgba(0,0,0,0.6)",
  "z-index:1",
].join(";");

const WORLD_UP: Vec3 = { x: 0, y: 1, z: 0 };

// Flight path tuning. Progress drives a wide corkscrew sweep across the frame:
// the plane enters off-screen on the left (p=0), spirals through depth and
// height across the middle, and exits off-screen on the right (p=1).
const SWEEP_X = 2.7;
const AMP_Y = 0.8;
const AMP_Z = 1.25;
const TURNS = 1.25;
const PHASE = Math.PI;
const BANK_GAIN = 0.85;
/** Milliseconds for one full off-screen-to-off-screen lap. */
const LAP_MS = 3400;

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

/** Point on the flight path; `t` is the lap phase in 0..1 (loops seamlessly off-screen). */
function pathPoint(t: number): Vec3 {
  const a = t * TURNS * Math.PI * 2 + PHASE;
  return {
    x: SWEEP_X * (t * 2 - 1),
    y: AMP_Y * Math.sin(a),
    z: AMP_Z * Math.cos(a),
  };
}

function pathTangent(t: number): Vec3 {
  const e = 0.001;
  const ahead = pathPoint(t + e);
  const behind = pathPoint(t - e);
  return normalize({ x: ahead.x - behind.x, y: ahead.y - behind.y, z: ahead.z - behind.z });
}

/**
 * Orientation (engine Euler, Rz*Ry*Rx) that points the canonical nose (+X)
 * along `forward` and keeps `up` upright, rolled by `bank` radians about the
 * nose so the plane leans into turns.
 */
function orientationFor(forward: Vec3, bank: number): Vec3 {
  const fwd = normalize(forward);
  let right = cross(fwd, WORLD_UP);
  if (Math.hypot(right.x, right.y, right.z) < 1e-4) right = { x: 0, y: 0, z: 1 };
  right = normalize(right);
  const levelUp = cross(right, fwd);
  const up = {
    x: levelUp.x * Math.cos(bank) + right.x * Math.sin(bank),
    y: levelUp.y * Math.cos(bank) + right.y * Math.sin(bank),
    z: levelUp.z * Math.cos(bank) + right.z * Math.sin(bank),
  };
  const w = normalize(cross(fwd, up));
  const realUp = cross(w, fwd);
  return {
    x: Math.atan2(realUp.z, w.z),
    y: Math.asin(Math.max(-1, Math.min(1, -fwd.z))),
    z: Math.atan2(fwd.y, fwd.x),
  };
}

/**
 * Plane flies a wide 3D corkscrew across the frame on a continuous loop. The
 * animation plays only while progress is strictly between 0 and 1 (work in
 * flight) and freezes otherwise; progress does not drive the plane's position,
 * only whether it is moving. The overlaid label shows the progress percentage.
 */
export class PlaneProgressSpinner implements SpinnerPlugin {
  private engine?: Little3dEngine;
  private handle?: MeshHandle;
  private label?: HTMLDivElement;
  private readonly mesh: Mesh;
  private readonly backend?: Backend;
  private phase = 0;
  private lastNow?: number;

  constructor(options: PlaneProgressOptions) {
    const centered = centerAndScaleMesh(resolveMesh(options.mesh), options.meshSize ?? 1.9);
    this.mesh = applyColor(centered, options.color ?? "#cbd5e1");
    this.backend = options.backend;
  }

  mount(target: HTMLElement): void {
    target.style.position = "relative";
    const engine = new Little3dEngine({
      backend: this.backend,
      camera: { position: { x: 0, y: 0, z: 2.5 } },
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

    const progress = state.determinate ? Math.max(0, Math.min(1, state.progress)) : 0;
    // Loop continuously while work is in flight; freeze at the ends.
    const playing = !state.determinate || (progress > 0 && progress < 1);
    const dt = this.lastNow === undefined ? 0 : now - this.lastNow;
    this.lastNow = now;
    if (playing) this.phase = (this.phase + dt / LAP_MS) % 1;

    const transform = this.handle.transform;
    const position = pathPoint(this.phase);
    const tangent = pathTangent(this.phase);
    const turn = pathTangent(this.phase + 0.01);
    const bank = Math.max(-1, Math.min(1, cross(tangent, turn).y * 60)) * BANK_GAIN;
    const orientation = orientationFor(tangent, bank);

    transform.position.x = position.x;
    transform.position.y = position.y;
    transform.position.z = position.z;
    transform.rotation.x = orientation.x;
    transform.rotation.y = orientation.y;
    transform.rotation.z = orientation.z;

    this.label.textContent = `${Math.round(progress * 100)}%`;

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
