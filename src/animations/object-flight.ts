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

/** Which local axis the object's nose points down, used to correct a model that flies backwards or sideways. */
export type Facing = "+x" | "-x" | "+y" | "-y" | "+z" | "-z";

/** Trailing copies that chase the lead object in single file. */
export interface ObjectFlightTail {
  /** Number of trailing copies. */
  count: number;
  /** Spacing between consecutive objects along the path, in scene units. */
  distance: number;
}

export interface ObjectFlightOptions {
  /** Object mesh (an OBJ import or an engine primitive), or a factory returning one. */
  mesh: Mesh | (() => Mesh);
  /** Face color applied to every triangle. Default `"#cbd5e1"`. */
  color?: string;
  /** Rendering backend. Default `"canvas2d"`. */
  backend?: Backend;
  /** Uniform object size after centering. Default `1.5`. */
  size?: number;
  /** The object's nose axis. Set this to correct a model that flies backwards or sideways. Default `"+x"`. */
  facing?: Facing;
  /** Flight speed multiplier (`1` = default, `2` = twice as fast). Default `1`. */
  speed?: number;
  /** Trailing copies that chase the lead. Omit for a single object. */
  tail?: ObjectFlightTail;
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

const BASE_INTRO_MS = 1300;
const BASE_LAP_MS = 3600;
const BASE_OUTRO_MS = 1100;

const BANK_GAIN = 26;
const BANK_LIMIT = 0.7;
const BANK_SMOOTH = 0.12;
const SAMPLE_MS = 8;

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

/** Approximate arc length of one full lap, for converting tail spacing to a time delay. */
function loopPerimeter(): number {
  let length = 0;
  let prev = loopPoint(0);
  for (let i = 1; i <= 96; i++) {
    const next = loopPoint(i / 96);
    length += Math.hypot(next.x - prev.x, next.y - prev.y, next.z - prev.z);
    prev = next;
  }
  return length;
}

const INTRO_JOIN = scale(loopVelocity(0), BASE_INTRO_MS / BASE_LAP_MS);
const LOOP_PERIMETER = loopPerimeter();

// Rotation (proper, winding-preserving) that maps each `facing` axis onto +X.
const FACE_FORWARD: Record<Facing, (v: Vec3) => Vec3> = {
  "+x": (v) => v,
  "-x": (v) => ({ x: -v.x, y: v.y, z: -v.z }),
  "+z": (v) => ({ x: v.z, y: v.y, z: -v.x }),
  "-z": (v) => ({ x: -v.z, y: v.y, z: v.x }),
  "+y": (v) => ({ x: v.y, y: -v.x, z: v.z }),
  "-y": (v) => ({ x: -v.y, y: v.x, z: v.z }),
};

function resolveMesh(mesh: ObjectFlightOptions["mesh"]): Mesh {
  return typeof mesh === "function" ? mesh() : mesh;
}

function applyColor(mesh: Mesh, color: string): Mesh {
  return { vertices: mesh.vertices, faces: mesh.faces.map((face) => ({ ...face, color })) };
}

function faceForward(mesh: Mesh, facing: Facing): Mesh {
  if (facing === "+x") return mesh;
  const turn = FACE_FORWARD[facing];
  return { vertices: mesh.vertices.map(turn), faces: mesh.faces };
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
 * An object that flies a continuous, seamless 3D figure-8. The runner triggers
 * the lifecycle: {@link enter} flies it in from off-screen into the loop;
 * {@link exit} lets it fly straight off-screen. Any mesh works (OBJ imports or
 * engine primitives); `facing` corrects a model that points the wrong way, and
 * `tail` adds copies that chase the lead in single file.
 */
export class ObjectFlightAnimation implements SpinnerAnimation {
  private engine?: Little3dEngine;
  private label?: HTMLDivElement;
  private readonly handles: MeshHandle[] = [];
  private readonly banks: number[] = [];
  private readonly mesh: Mesh;
  private readonly backend?: Backend;
  private readonly labelText?: string;

  private readonly introMs: number;
  private readonly lapMs: number;
  private readonly outroMs: number;
  private readonly tailCount: number;
  private readonly tailDelay: number;

  private started = false;
  private finished = false;
  private introStart = 0;
  private loopStart = 0;
  private outroStart = Infinity;
  private outroFrom: Vec3 = ZERO;
  private outroHeading = 0;
  private outroSpeed = 0;

  constructor(options: ObjectFlightOptions) {
    const centered = centerAndScaleMesh(resolveMesh(options.mesh), options.size ?? 1.5);
    const facing = faceForward(centered, options.facing ?? "+x");
    this.mesh = applyColor(facing, options.color ?? "#cbd5e1");
    this.backend = options.backend;
    this.labelText = options.label;

    const speed = Math.max(0.05, options.speed ?? 1);
    this.introMs = BASE_INTRO_MS / speed;
    this.lapMs = BASE_LAP_MS / speed;
    this.outroMs = BASE_OUTRO_MS / speed;

    this.tailCount = Math.max(0, Math.floor(options.tail?.count ?? 0));
    const distance = Math.max(0, options.tail?.distance ?? 0);
    const avgSpeed = LOOP_PERIMETER / this.lapMs; // scene units per ms
    this.tailDelay = avgSpeed > 0 ? distance / avgSpeed : 0;
  }

  mount(target: HTMLElement): void {
    target.style.position = "relative";
    const engine = new Little3dEngine({
      backend: this.backend,
      camera: { position: { x: 0, y: 0, z: 2.5 } },
    });
    for (let i = 0; i <= this.tailCount; i++) {
      this.handles.push(engine.add(this.mesh));
      this.banks.push(0);
    }
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
    if (this.started) return;
    this.started = true;
    this.introStart = now;
    this.loopStart = now + this.introMs;
  }

  exit(now: number): void {
    if (!this.started || this.outroStart !== Infinity) return;
    const from = this.pathAt(now);
    let velocity = scale(subtract(this.pathAt(now + 1), this.pathAt(now - 1)), 0.5);
    if (Math.hypot(velocity.x, velocity.y, velocity.z) < 1e-4) velocity = loopVelocity(0);
    // Just fly off along the current heading (projected to the screen plane so
    // it never departs into depth and vanishes); no forced turn.
    this.outroHeading = Math.atan2(velocity.y, velocity.x);
    this.outroSpeed = Math.max(Math.hypot(velocity.x, velocity.y), OUTRO_DISTANCE / this.outroMs);
    this.outroFrom = from;
    this.outroStart = now;
  }

  isFinished(): boolean {
    return this.finished;
  }

  render(now: number, frame: AnimationFrame): void {
    if (!this.engine || !this.label) return;

    if (this.started && this.outroStart !== Infinity) {
      const lastDone = now - this.tailCount * this.tailDelay >= this.outroStart + this.outroMs;
      if (lastDone) this.finished = true;
    }

    for (let k = 0; k < this.handles.length; k++) {
      const transform = this.handles[k].transform;
      const t = now - k * this.tailDelay;
      if (!this.started || !this.visible(t)) {
        transform.scale = 0;
        continue;
      }
      transform.scale = 1;
      const here = this.pathAt(t);
      const heading = normalize(subtract(this.pathAt(t + SAMPLE_MS), here));
      const ahead = normalize(
        subtract(this.pathAt(t + 2 * SAMPLE_MS), this.pathAt(t + SAMPLE_MS)),
      );
      const targetBank = Math.max(
        -BANK_LIMIT,
        Math.min(BANK_LIMIT, cross(heading, ahead).y * BANK_GAIN),
      );
      this.banks[k] += (targetBank - this.banks[k]) * BANK_SMOOTH;
      const orientation = orientationFor(heading, this.banks[k]);
      transform.position.x = here.x;
      transform.position.y = here.y;
      transform.position.z = here.z;
      transform.rotation.x = orientation.x;
      transform.rotation.y = orientation.y;
      transform.rotation.z = orientation.z;
    }

    this.label.textContent = frame.indeterminate ? (this.labelText ?? "") : `${Math.round(frame.progress * 100)}%`;
    this.engine.render();
  }

  destroy(): void {
    this.label?.remove();
    this.label = undefined;
    this.engine?.destroy();
    this.engine = undefined;
    this.handles.length = 0;
  }

  /** Whether an object sampled at time `t` is on its way in/around/out (not pre-entry or done). */
  private visible(t: number): boolean {
    if (t < this.introStart) return false;
    if (this.outroStart === Infinity) return true;
    return t <= this.outroStart + this.outroMs;
  }

  /** Position on the path at lead-clock time `t`; intro/loop/outro joins are smooth. */
  private pathAt(t: number): Vec3 {
    if (t < this.loopStart) {
      const u = clamp01((t - this.introStart) / this.introMs);
      return hermite(OFFSCREEN_FROM, ZERO, loopPoint(0), INTRO_JOIN, u);
    }
    if (t >= this.outroStart) {
      const p = clamp01((t - this.outroStart) / this.outroMs);
      const dist = this.outroSpeed * p * this.outroMs;
      return {
        x: this.outroFrom.x + Math.cos(this.outroHeading) * dist,
        y: this.outroFrom.y + Math.sin(this.outroHeading) * dist,
        z: this.outroFrom.z,
      };
    }
    const phase = ((t - this.loopStart) / this.lapMs) % 1;
    return loopPoint(phase < 0 ? phase + 1 : phase);
  }
}
