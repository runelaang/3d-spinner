import type { AnimationFrame, SpinnerAnimation } from "../animation.js";
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

export interface PlaneAnimationOptions {
  /** Plane mesh, or a factory that returns one. */
  mesh: Mesh | (() => Mesh);
  /** Face color applied to every triangle. Default `"#cbd5e1"`. */
  color?: string;
  /** Rendering backend. Default `"canvas2d"`. */
  backend?: Backend;
  /** Uniform mesh size after centering. Default `1.5`. */
  meshSize?: number;
  /** Overlay label shown in indeterminate mode (no value to show). Hidden if omitted. */
  label?: string;
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

const OFFSCREEN_FROM: Vec3 = { x: -3.3, y: -1.3, z: LOOP_Z };
const OUTRO_DISTANCE = 5.5;

const INTRO_MS = 1300;
const LAP_MS = 3600;
const OUTRO_MS = 1100;

const BANK_GAIN = 26;
const BANK_LIMIT = 0.7;
const BANK_SMOOTH = 0.12;
const SAMPLE_MS = 8;

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
  return add(add(scale(p0, h00), scale(m0, h10)), add(scale(p1, h01), scale(m1, h11)));
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

const INTRO_JOIN = scale(loopVelocity(0), INTRO_MS / LAP_MS);

function resolveMesh(mesh: PlaneAnimationOptions["mesh"]): Mesh {
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

/**
 * A plane that flies a continuous, seamless 3D figure-8. The spinner runner
 * triggers the lifecycle: {@link enter} flies it in from off-screen and into
 * the loop; {@link exit} peels it out of the loop and off-screen. The loop runs
 * on time, independent of the progress value.
 */
export class PlaneAnimation implements SpinnerAnimation {
  private engine?: Little3dEngine;
  private handle?: MeshHandle;
  private label?: HTMLDivElement;
  private readonly mesh: Mesh;
  private readonly backend?: Backend;
  private readonly labelText?: string;

  private phase: Phase = "idle";
  private introStart = 0;
  private loopStart = 0;
  private outroStart = 0;
  private outroFrom: Vec3 = ZERO;
  private outroM0: Vec3 = ZERO;
  private outroExit: Vec3 = ZERO;
  private outroM1: Vec3 = ZERO;
  private bank = 0;

  constructor(options: PlaneAnimationOptions) {
    const centered = centerAndScaleMesh(resolveMesh(options.mesh), options.meshSize ?? 1.5);
    this.mesh = applyColor(centered, options.color ?? "#cbd5e1");
    this.backend = options.backend;
    this.labelText = options.label;
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
    target.appendChild(label);
    this.label = label;
  }

  enter(now: number): void {
    if (this.phase !== "idle") return;
    this.phase = "intro";
    this.introStart = now;
  }

  exit(now: number): void {
    if (this.phase !== "intro" && this.phase !== "loop") return;
    const from = this.positionAt(now);
    let velocity = scale(subtract(this.positionAt(now + 1), this.positionAt(now - 1)), 0.5);
    if (Math.hypot(velocity.x, velocity.y, velocity.z) < 1e-4) velocity = loopVelocity(0);
    // Always leave toward the nearest horizontal edge (left/right), never into
    // depth: a plane exiting toward or away from the camera shrinks to nothing
    // mid-frame instead of flying off-screen.
    const outward: Vec3 = { x: from.x >= 0 ? 1 : -1, y: 0, z: 0 };
    this.outroFrom = from;
    this.outroM0 = scale(velocity, OUTRO_MS); // smooth C1 start from the current heading
    this.outroExit = add(from, scale(outward, OUTRO_DISTANCE));
    this.outroM1 = scale(outward, OUTRO_DISTANCE);
    this.phase = "outro";
    this.outroStart = now;
  }

  isFinished(): boolean {
    return this.phase === "done";
  }

  render(now: number, frame: AnimationFrame): void {
    if (!this.engine || !this.handle || !this.label) return;
    this.advancePhase(now);

    const transform = this.handle.transform;
    if (this.phase === "idle" || this.phase === "done") {
      transform.scale = 0;
    } else {
      transform.scale = 1;
      const here = this.positionAt(now);
      const heading = normalize(subtract(this.positionAt(now + SAMPLE_MS), here));
      const ahead = normalize(subtract(this.positionAt(now + 2 * SAMPLE_MS), this.positionAt(now + SAMPLE_MS)));
      const targetBank = Math.max(-BANK_LIMIT, Math.min(BANK_LIMIT, cross(heading, ahead).y * BANK_GAIN));
      this.bank += (targetBank - this.bank) * BANK_SMOOTH;
      const orientation = orientationFor(heading, this.bank);
      transform.position.x = here.x;
      transform.position.y = here.y;
      transform.position.z = here.z;
      transform.rotation.x = orientation.x;
      transform.rotation.y = orientation.y;
      transform.rotation.z = orientation.z;
    }

    this.label.textContent = frame.indeterminate
      ? (this.labelText ?? "")
      : `${Math.round(frame.progress * 100)}%`;
    this.engine.render();
  }

  destroy(): void {
    this.label?.remove();
    this.label = undefined;
    this.engine?.destroy();
    this.engine = undefined;
    this.handle = undefined;
  }

  private advancePhase(now: number): void {
    if (this.phase === "intro" && now - this.introStart >= INTRO_MS) {
      this.phase = "loop";
      this.loopStart = this.introStart + INTRO_MS;
    }
    if (this.phase === "outro" && now - this.outroStart >= OUTRO_MS) {
      this.phase = "done";
    }
  }

  /** Position of the active phase at `now`. Joins are smooth in position and velocity. */
  private positionAt(now: number): Vec3 {
    if (this.phase === "intro") {
      const u = Math.max(0, Math.min(1, (now - this.introStart) / INTRO_MS));
      return hermite(OFFSCREEN_FROM, ZERO, loopPoint(0), INTRO_JOIN, u);
    }
    if (this.phase === "outro") {
      const u = Math.max(0, Math.min(1, (now - this.outroStart) / OUTRO_MS));
      return hermite(this.outroFrom, this.outroM0, this.outroExit, this.outroM1, u);
    }
    const phase = ((now - this.loopStart) / LAP_MS) % 1;
    return loopPoint(phase < 0 ? phase + 1 : phase);
  }
}
