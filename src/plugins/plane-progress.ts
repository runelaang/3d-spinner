import type { SpinnerPlugin, SpinnerPluginState } from "../plugin.js";
import {
  Little3dEngine,
  type Backend,
  type Mesh,
  type MeshHandle,
  type Vec3,
  cross,
  normalize,
  scale,
  subtract,
} from "../engines/little-3d-engine/little-3d-engine.js";

export interface PlaneProgressOptions {
  /** Plane mesh, or a factory that returns one. */
  mesh: Mesh | (() => Mesh);
  /** Face color applied to every triangle. Default `"#cbd5e1"`. */
  color?: string;
  /** Rendering backend. Default `"canvas2d"`. */
  backend?: Backend;
  /** Uniform mesh size after centering. Default `1.5`. */
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
const ZERO: Vec3 = { x: 0, y: 0, z: 0 };

// Figure-8 loop amplitudes (scene units). The loop is a closed, periodic curve
// so it repeats seamlessly. Depth (z) makes it read as 3D rather than flat.
const LOOP_X = 1.5;
const LOOP_Y = 1.0;
const LOOP_Z = 1.05;

// Where the plane starts (off-screen) before flying into the intro.
const OFFSCREEN_FROM: Vec3 = { x: -3.3, y: -1.3, z: LOOP_Z };
const OUTRO_DISTANCE = 5.5;

// Phase durations in milliseconds.
const INTRO_MS = 1300;
const LAP_MS = 3600;
const OUTRO_MS = 1100;

// Bank (roll into turns): target from path curvature, eased for smoothness.
const BANK_GAIN = 26;
const BANK_LIMIT = 0.7;
const BANK_SMOOTH = 0.12;

type Phase = "idle" | "intro" | "loop" | "outro" | "done";

function add(a: Vec3, b: Vec3): Vec3 {
  return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z };
}

/** Cubic Hermite interpolation between `p0` (tangent `m0`) and `p1` (tangent `m1`). */
function hermite(p0: Vec3, m0: Vec3, p1: Vec3, m1: Vec3, u: number): Vec3 {
  const u2 = u * u;
  const u3 = u2 * u;
  const h00 = 2 * u3 - 3 * u2 + 1;
  const h10 = u3 - 2 * u2 + u;
  const h01 = -2 * u3 + 3 * u2;
  const h11 = u3 - u2;
  return add(
    add(scale(p0, h00), scale(m0, h10)),
    add(scale(p1, h01), scale(m1, h11)),
  );
}

/** Point on the seamless figure-8; `phase` in 0..1 is one full lap. */
function loopPoint(phase: number): Vec3 {
  const a = phase * Math.PI * 2;
  return {
    x: LOOP_X * Math.sin(a),
    y: LOOP_Y * Math.sin(a) * Math.cos(a),
    z: LOOP_Z * Math.cos(a),
  };
}

/** Raw per-phase velocity of the loop at `phase` (central difference). */
function loopVelocity(phase: number): Vec3 {
  const e = 1e-3;
  return scale(subtract(loopPoint(phase + e), loopPoint(phase - e)), 1 / (2 * e));
}

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
  const factor = targetSize / extent;

  return {
    vertices: mesh.vertices.map((vertex) => ({
      x: (vertex.x - centerX) * factor,
      y: (vertex.y - centerY) * factor,
      z: (vertex.z - centerZ) * factor,
    })),
    faces: mesh.faces,
  };
}

/**
 * Orientation (engine Euler, Rz*Ry*Rx) that points the nose (+X) along
 * `forward` and keeps `up` upright, rolled by `bank` radians about the nose.
 */
function orientationFor(forward: Vec3, bank: number): Vec3 {
  const fwd = normalize(forward);
  let right = cross(fwd, WORLD_UP);
  if (Math.hypot(right.x, right.y, right.z) < 1e-4) right = { x: 0, y: 0, z: 1 };
  right = normalize(right);
  const levelUp = cross(right, fwd);
  const up = add(scale(levelUp, Math.cos(bank)), scale(right, Math.sin(bank)));
  const w = normalize(cross(fwd, up));
  const realUp = cross(w, fwd);
  return {
    x: Math.atan2(realUp.z, w.z),
    y: Math.asin(Math.max(-1, Math.min(1, -fwd.z))),
    z: Math.atan2(fwd.y, fwd.x),
  };
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

/**
 * A plane that flies a continuous, seamless 3D figure-8. Progress only drives
 * three phases - it does not position the plane:
 * - **intro**: the first time progress rises above 0, the plane flies in from
 *   off-screen and eases into the loop.
 * - **loop**: while progress is between 0 and 1, the figure-8 repeats forever.
 * - **outro**: when progress reaches 1, the plane peels out of the loop and
 *   flies off-screen.
 * An overlaid label shows the progress percentage.
 */
export class PlaneProgressSpinner implements SpinnerPlugin {
  private engine?: Little3dEngine;
  private handle?: MeshHandle;
  private label?: HTMLDivElement;
  private readonly mesh: Mesh;
  private readonly backend?: Backend;

  private phase: Phase = "idle";
  private introU = 0;
  private loopPhase = 0;
  private outroU = 0;
  private outroFromPhase = 0;
  private bank = 0;
  private lastNow?: number;

  constructor(options: PlaneProgressOptions) {
    const centered = centerAndScaleMesh(resolveMesh(options.mesh), options.meshSize ?? 1.5);
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

    // Indeterminate spinners have no progress, so treat them as always "in
    // flight": they intro once and loop forever, never reaching the outro.
    const progress = state.determinate ? clamp01(state.progress) : 0.5;
    const dt = this.lastNow === undefined ? 0 : now - this.lastNow;
    this.lastNow = now;

    const visible = this.advance(progress, dt);
    const transform = this.handle.transform;

    if (visible) {
      transform.scale = 1;
      const here = this.sample(0);
      const heading = normalize(subtract(this.sample(1), here));
      const turn = cross(heading, normalize(subtract(this.sample(2), this.sample(1))));
      const targetBank = Math.max(-BANK_LIMIT, Math.min(BANK_LIMIT, turn.y * BANK_GAIN));
      this.bank += (targetBank - this.bank) * BANK_SMOOTH;

      const orientation = orientationFor(heading, this.bank);
      transform.position.x = here.x;
      transform.position.y = here.y;
      transform.position.z = here.z;
      transform.rotation.x = orientation.x;
      transform.rotation.y = orientation.y;
      transform.rotation.z = orientation.z;
    } else {
      transform.scale = 0;
    }

    this.label.textContent = state.determinate ? `${Math.round(progress * 100)}%` : "";
    this.engine.render();
  }

  /** Advance the phase state machine by `dt`; returns whether the plane is on-screen. */
  private advance(progress: number, dt: number): boolean {
    if (progress <= 0) {
      this.phase = "idle";
      return false;
    }
    if (this.phase === "idle" || (this.phase === "done" && progress < 1)) {
      this.phase = "intro";
      this.introU = 0;
    }
    if (this.phase === "intro") {
      this.introU += dt / INTRO_MS;
      if (this.introU >= 1) {
        this.phase = "loop";
        this.loopPhase = 0;
      }
    }
    if (this.phase === "loop") {
      this.loopPhase = (this.loopPhase + dt / LAP_MS) % 1;
      if (progress >= 1) {
        this.phase = "outro";
        this.outroFromPhase = this.loopPhase;
        this.outroU = 0;
      }
    }
    if (this.phase === "outro") {
      this.outroU += dt / OUTRO_MS;
      if (this.outroU >= 1) {
        this.phase = "done";
        return false;
      }
    }
    return this.phase === "intro" || this.phase === "loop" || this.phase === "outro";
  }

  /**
   * Position of the active phase, offset by `step` small ticks of its own
   * parameter (used to sample a look-ahead for heading and bank). Intro and
   * outro are Hermite curves: the intro starts at rest off-screen and arrives
   * with the loop's velocity; the outro leaves with the loop's velocity. Both
   * endpoints match the loop in position and velocity, so the joins are smooth
   * with no change in speed.
   */
  private sample(step: number): Vec3 {
    const e = 4e-3;
    if (this.phase === "intro") {
      const u = clamp01(this.introU + step * e);
      const joinVelocity = scale(loopVelocity(0), INTRO_MS / LAP_MS);
      return hermite(OFFSCREEN_FROM, ZERO, loopPoint(0), joinVelocity, u);
    }
    if (this.phase === "outro") {
      const u = clamp01(this.outroU + step * e);
      const from = loopPoint(this.outroFromPhase);
      const outward = normalize(loopVelocity(this.outroFromPhase));
      const leaveVelocity = scale(loopVelocity(this.outroFromPhase), OUTRO_MS / LAP_MS);
      const exit = add(from, scale(outward, OUTRO_DISTANCE));
      return hermite(from, leaveVelocity, exit, scale(outward, OUTRO_DISTANCE), u);
    }
    return loopPoint(this.loopPhase + step * e);
  }

  destroy(): void {
    this.label?.remove();
    this.label = undefined;
    this.engine?.destroy();
    this.engine = undefined;
    this.handle = undefined;
  }
}
