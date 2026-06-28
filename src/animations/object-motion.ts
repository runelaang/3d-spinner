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
import {
  type Mat4,
  multiply,
  rotationX,
  rotationY,
  rotationZ,
} from "../engines/little-3d-engine/core/math.js";
import type { MotionController } from "../motion/controller.js";
import { centerAndScaleMesh } from "./object-flight.js";

/** Which local axis the object's nose points down, used to correct a model that moves backwards or sideways. */
export type Facing = "+x" | "-x" | "+y" | "-y" | "+z" | "-z";

/** Trailing copies that chase the lead object in single file. */
export interface ObjectMotionTail {
  /** Number of trailing copies. */
  count: number;
  /** Time each copy lags the one ahead of it, in milliseconds. */
  gapMs: number;
}

/** Extra local-space orientation on top of path following. */
export interface ObjectMotionRotation {
  /** Fixed local-space Euler offset, radians. */
  x?: number;
  y?: number;
  z?: number;
  /** Continuous spin around local X/Y/Z, radians per millisecond. */
  spinX?: number;
  spinY?: number;
  spinZ?: number;
}

export interface ObjectMotionOptions {
  /** Object mesh (an OBJ import or an engine primitive), or a factory returning one. */
  mesh: Mesh | (() => Mesh);
  /** How the object moves: a circle, square, figure-8, wander, or any custom controller. */
  motion: MotionController;
  /** Face color applied to every triangle. Default `"#cbd5e1"`. */
  color?: string;
  /** Rendering backend. Default `"canvas2d"`. */
  backend?: Backend;
  /** Uniform object size after centering. Default `1`. */
  size?: number;
  /** The object's nose axis. Set this to correct a model that moves backwards or sideways. Default `"+x"`. */
  facing?: Facing;
  /** Additional local-space rotation on top of path orientation. */
  rotation?: ObjectMotionRotation;
  /** Trailing copies that chase the lead in single file. Omit for a single object. */
  tail?: ObjectMotionTail;
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

const POP_IN_MS = 450;
const POP_OUT_MS = 400;

const BANK_GAIN = 26;
const BANK_LIMIT = 0.7;
const BANK_SMOOTH = 0.12;
const SAMPLE_MS = 8;

// Rotation (proper, winding-preserving) that maps each `facing` axis onto +X.
const FACE_FORWARD: Record<Facing, (v: Vec3) => Vec3> = {
  "+x": (v) => v,
  "-x": (v) => ({ x: -v.x, y: v.y, z: -v.z }),
  "+z": (v) => ({ x: v.z, y: v.y, z: -v.x }),
  "-z": (v) => ({ x: -v.z, y: v.y, z: v.x }),
  "+y": (v) => ({ x: v.y, y: -v.x, z: v.z }),
  "-y": (v) => ({ x: -v.y, y: v.x, z: v.z }),
};

function add(a: Vec3, b: Vec3): Vec3 {
  return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z };
}

function resolveMesh(mesh: ObjectMotionOptions["mesh"]): Mesh {
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
  return {
    x: Math.atan2(cross(w, fwd).z, w.z),
    y: Math.asin(Math.max(-1, Math.min(1, -fwd.z))),
    z: Math.atan2(fwd.y, fwd.x),
  };
}

/** Engine rotation matrix from Euler angles (Rz * Ry * Rx). */
function rotationMatrix(x: number, y: number, z: number): Mat4 {
  return multiply(rotationZ(z), multiply(rotationY(y), rotationX(x)));
}

/** Inverse of {@link rotationMatrix} for the engine's Rz * Ry * Rx order. */
function eulerFromRotationMatrix(matrix: Mat4): Vec3 {
  const sy = Math.hypot(matrix[0], matrix[1]);
  if (sy > 1e-6) {
    return {
      x: Math.atan2(matrix[9], matrix[10]),
      y: Math.asin(Math.max(-1, Math.min(1, -matrix[8]))),
      z: Math.atan2(matrix[4], matrix[0]),
    };
  }
  return {
    x: Math.atan2(-matrix[6], matrix[5]),
    y: Math.asin(Math.max(-1, Math.min(1, -matrix[8]))),
    z: 0,
  };
}

/** Compose path orientation with a local-space offset/spin rotation. */
function combineLocalRotation(path: Vec3, extra: Vec3): Vec3 {
  return eulerFromRotationMatrix(
    multiply(rotationMatrix(path.x, path.y, path.z), rotationMatrix(extra.x, extra.y, extra.z)),
  );
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

/** Ease-out-back: overshoots slightly then settles, for a lively pop-in. */
function easeOutBack(t: number): number {
  const c = 1.70158;
  const u = t - 1;
  return 1 + (c + 1) * u * u * u + c * u * u;
}

/**
 * An object that moves along a {@link MotionController}'s path (a circle, a
 * square, a figure-8, a smooth wander, or any custom controller) with its nose
 * following the path tangent. The runner triggers the lifecycle: {@link enter}
 * pops it in, {@link exit} pops it out. Any mesh works (OBJ imports or engine
 * primitives); `facing` corrects a model that points the wrong way, and
 * `rotation` adds local spin or tilt on top of path following.
 */
export class ObjectMotionAnimation implements SpinnerAnimation {
  private engine?: Little3dEngine;
  private label?: HTMLDivElement;
  private readonly handles: MeshHandle[] = [];
  private readonly banks: number[] = [];
  private readonly headings: Vec3[] = [];
  private readonly mesh: Mesh;
  private readonly motion: MotionController;
  private readonly backend?: Backend;
  private readonly labelText?: string;
  private readonly tailCount: number;
  private readonly tailGap: number;
  private readonly rotationOffset: Vec3;
  private readonly rotationSpin: Vec3;
  private readonly hasExtraRotation: boolean;

  private started = false;
  private finished = false;
  private introStart = 0;
  private outroStart = Infinity;

  constructor(options: ObjectMotionOptions) {
    const centered = centerAndScaleMesh(resolveMesh(options.mesh), options.size ?? 1);
    const facing = faceForward(centered, options.facing ?? "+x");
    this.mesh = applyColor(facing, options.color ?? "#cbd5e1");
    this.motion = options.motion;
    this.backend = options.backend;
    this.labelText = options.label;
    this.tailCount = Math.max(0, Math.floor(options.tail?.count ?? 0));
    this.tailGap = Math.max(0, options.tail?.gapMs ?? 0);

    const rotation = options.rotation;
    this.rotationOffset = { x: rotation?.x ?? 0, y: rotation?.y ?? 0, z: rotation?.z ?? 0 };
    this.rotationSpin = {
      x: rotation?.spinX ?? 0,
      y: rotation?.spinY ?? 0,
      z: rotation?.spinZ ?? 0,
    };
    this.hasExtraRotation =
      this.rotationOffset.x !== 0 ||
      this.rotationOffset.y !== 0 ||
      this.rotationOffset.z !== 0 ||
      this.rotationSpin.x !== 0 ||
      this.rotationSpin.y !== 0 ||
      this.rotationSpin.z !== 0;
  }

  mount(target: HTMLElement): void {
    target.style.position = "relative";
    const engine = new Little3dEngine({
      backend: this.backend,
      camera: { position: { x: 0, y: 0, z: 3 } },
    });
    for (let i = 0; i <= this.tailCount; i++) {
      this.handles.push(engine.add(this.mesh));
      this.banks.push(0);
      this.headings.push({ x: 1, y: 0, z: 0 });
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
  }

  exit(now: number): void {
    if (!this.started || this.outroStart !== Infinity) return;
    this.outroStart = now;
  }

  isFinished(): boolean {
    return this.finished;
  }

  render(now: number, frame: AnimationFrame): void {
    if (!this.engine || !this.label) return;

    // The last copy finishes its pop-out `tailCount * gap` after the lead does.
    if (this.outroStart !== Infinity && now >= this.outroStart + POP_OUT_MS + this.tailCount * this.tailGap) {
      this.finished = true;
    }

    for (let k = 0; k < this.handles.length; k++) {
      const transform = this.handles[k].transform;
      const t = now - k * this.tailGap;
      if (!this.started) {
        transform.scale = 0;
        continue;
      }
      transform.scale = this.scaleAt(t);
      const here = this.motion.positionAt(t);
      const heading = subtract(this.motion.positionAt(t + SAMPLE_MS), here);
      if (Math.hypot(heading.x, heading.y, heading.z) > 1e-5) {
        this.headings[k] = normalize(heading);
      }
      const ahead = normalize(
        subtract(this.motion.positionAt(t + 2 * SAMPLE_MS), this.motion.positionAt(t + SAMPLE_MS)),
      );
      const targetBank = Math.max(
        -BANK_LIMIT,
        Math.min(BANK_LIMIT, cross(this.headings[k], ahead).y * BANK_GAIN),
      );
      this.banks[k] += (targetBank - this.banks[k]) * BANK_SMOOTH;
      let euler = orientationFor(this.headings[k], this.banks[k]);
      if (this.hasExtraRotation) {
        euler = combineLocalRotation(euler, {
          x: this.rotationOffset.x + this.rotationSpin.x * t,
          y: this.rotationOffset.y + this.rotationSpin.y * t,
          z: this.rotationOffset.z + this.rotationSpin.z * t,
        });
      }
      transform.position.x = here.x;
      transform.position.y = here.y;
      transform.position.z = here.z;
      transform.rotation.x = euler.x;
      transform.rotation.y = euler.y;
      transform.rotation.z = euler.z;
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
    this.handles.length = 0;
  }

  /** Scale pop: eases up on enter, eases down on exit, full size in between. */
  private scaleAt(now: number): number {
    if (this.outroStart !== Infinity) {
      const u = clamp01((now - this.outroStart) / POP_OUT_MS);
      return 1 - u * u;
    }
    return easeOutBack(clamp01((now - this.introStart) / POP_IN_MS));
  }
}
