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
import {
  grow,
  shrink,
  type ObjectMotionTransition,
  type ObjectMotionTransitionConfig,
  type ObjectMotionTransitionInput,
  type ObjectMotionTransitionOutput,
  type ObjectMotionTransitionPhase,
} from "../motion/transitions.js";

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
  /** Intro transition. Defaults to `grow()`. */
  intro?: ObjectMotionTransitionConfig;
  /** Outro transition. Defaults to `shrink()`. */
  outro?: ObjectMotionTransitionConfig;
  /** Trailing copies that chase the lead in single file. Omit for a single object. */
  tail?: ObjectMotionTail;
  /** Overlay label shown in indeterminate mode (no value to show). Hidden if omitted. */
  label?: string;
}

interface ResolvedObjectMotionTransition {
  transition: ObjectMotionTransition;
  durationMs: number;
}

interface ObjectMotionSample {
  position: Vec3;
  size: number;
  orientation?: Vec3;
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

const DEFAULT_INTRO_MS = 2100;
const DEFAULT_OUTRO_MS = 2100;

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

/** Centers a mesh at the origin and uniformly scales it to fit within `targetSize`. */
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

function motionVectorAt(motion: MotionController, t: number): Vec3 {
  return scale(subtract(motion.positionAt(t + 1), motion.positionAt(t - 1)), 0.5);
}

function resolveDirection(velocity: Vec3, fallback: Vec3): Vec3 {
  return Math.hypot(velocity.x, velocity.y, velocity.z) > 1e-6 ? normalize(velocity) : fallback;
}

function resolveTransition(
  config: ObjectMotionTransitionConfig | undefined,
  fallback: ObjectMotionTransition,
  durationMs: number,
): ResolvedObjectMotionTransition {
  if (!config) return { transition: fallback, durationMs };
  if (typeof config === "function") return { transition: config, durationMs };
  return { transition: config.transition, durationMs: Math.max(0, config.durationMs ?? durationMs) };
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
  private readonly intro: ResolvedObjectMotionTransition;
  private readonly outro: ResolvedObjectMotionTransition;
  private readonly rotationOffset: Vec3;
  private readonly rotationSpin: Vec3;
  private readonly hasExtraRotation: boolean;

  private started = false;
  private finished = false;
  private introStart = 0;
  private outroStart = Infinity;
  private outroPosition: Vec3 = { x: 0, y: 0, z: 0 };
  private outroVelocity: Vec3 = { x: 0, y: 0, z: 0 };
  private outroDirection: Vec3 = { x: 1, y: 0, z: 0 };

  constructor(options: ObjectMotionOptions) {
    const centered = centerAndScaleMesh(resolveMesh(options.mesh), options.size ?? 1);
    const facing = faceForward(centered, options.facing ?? "+x");
    this.mesh = applyColor(facing, options.color ?? "#cbd5e1");
    this.motion = options.motion;
    this.backend = options.backend;
    this.labelText = options.label;
    this.tailCount = Math.max(0, Math.floor(options.tail?.count ?? 0));
    this.tailGap = Math.max(0, options.tail?.gapMs ?? 0);
    this.intro = resolveTransition(options.intro, grow(), DEFAULT_INTRO_MS);
    this.outro = resolveTransition(options.outro, shrink(), DEFAULT_OUTRO_MS);

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
    this.outroPosition = this.motion.positionAt(now);
    this.outroVelocity = motionVectorAt(this.motion, now);
    this.outroDirection = resolveDirection(this.outroVelocity, this.headings[0]);
    this.outroStart = now;
  }

  isFinished(): boolean {
    return this.finished;
  }

  render(now: number, frame: AnimationFrame): void {
    if (!this.engine || !this.label) return;

    if (this.outroStart !== Infinity && now >= this.outroStart + this.outro.durationMs + this.tailCount * this.tailGap) {
      this.finished = true;
    }

    for (let k = 0; k < this.handles.length; k++) {
      const transform = this.handles[k].transform;
      const t = now - k * this.tailGap;
      const sample = this.sampleAt(t);
      if (!sample) {
        transform.scale = 0;
        continue;
      }
      transform.scale = sample.size;
      let euler = sample.orientation;
      if (!euler) {
        const heading = subtract(this.positionAt(t + SAMPLE_MS) ?? sample.position, sample.position);
        if (Math.hypot(heading.x, heading.y, heading.z) > 1e-5) {
          this.headings[k] = normalize(heading);
        }
        const ahead = this.aheadAt(t) ?? this.headings[k];
        const targetBank = Math.max(
          -BANK_LIMIT,
          Math.min(BANK_LIMIT, cross(this.headings[k], ahead).y * BANK_GAIN),
        );
        this.banks[k] += (targetBank - this.banks[k]) * BANK_SMOOTH;
        euler = orientationFor(this.headings[k], this.banks[k]);
      }
      if (this.hasExtraRotation) {
        euler = combineLocalRotation(euler, {
          x: this.rotationOffset.x + this.rotationSpin.x * t,
          y: this.rotationOffset.y + this.rotationSpin.y * t,
          z: this.rotationOffset.z + this.rotationSpin.z * t,
        });
      }
      transform.position.x = sample.position.x;
      transform.position.y = sample.position.y;
      transform.position.z = sample.position.z;
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

  private aheadAt(t: number): Vec3 | undefined {
    const next = this.positionAt(t + SAMPLE_MS);
    const afterNext = this.positionAt(t + 2 * SAMPLE_MS);
    if (!next || !afterNext) return undefined;
    const ahead = subtract(afterNext, next);
    if (Math.hypot(ahead.x, ahead.y, ahead.z) <= 1e-5) return undefined;
    return normalize(ahead);
  }

  private positionAt(t: number): Vec3 | undefined {
    return this.sampleAt(t)?.position;
  }

  private sampleAt(t: number): ObjectMotionSample | undefined {
    if (!this.started || t < this.introStart) return undefined;
    if (t < this.introStart + this.intro.durationMs) {
      return this.transitionSample("intro", t, this.intro, this.introStart);
    }
    if (this.outroStart !== Infinity) {
      if (t > this.outroStart + this.outro.durationMs) return undefined;
      if (t >= this.outroStart) return this.transitionSample("outro", t, this.outro, this.outroStart);
    }
    return { position: this.motion.positionAt(t), size: 1 };
  }

  private transitionSample(
    phase: ObjectMotionTransitionPhase,
    t: number,
    transition: ResolvedObjectMotionTransition,
    start: number,
  ): ObjectMotionSample {
    const elapsedMs = Math.max(0, t - start);
    const delta = transition.durationMs === 0 ? 1 : clamp01(elapsedMs / transition.durationMs);
    const input = this.transitionInput(phase, delta, elapsedMs, transition.durationMs, start);
    const output = transition.transition(input);
    return this.applyTransitionOutput(input, output);
  }

  private transitionInput(
    phase: ObjectMotionTransitionPhase,
    delta: number,
    elapsedMs: number,
    durationMs: number,
    start: number,
  ): ObjectMotionTransitionInput {
    if (phase === "intro") {
      const handoff = start + durationMs;
      const velocity = motionVectorAt(this.motion, handoff);
      return {
        delta,
        position: this.motion.positionAt(handoff),
        direction: resolveDirection(velocity, { x: 1, y: 0, z: 0 }),
        velocity,
        size: 1,
        durationMs,
        elapsedMs,
        phase,
      };
    }
    return {
      delta,
      position: this.outroPosition,
      direction: this.outroDirection,
      velocity: this.outroVelocity,
      size: 1,
      durationMs,
      elapsedMs,
      phase,
    };
  }

  private applyTransitionOutput(
    input: ObjectMotionTransitionInput,
    output: ObjectMotionTransitionOutput,
  ): ObjectMotionSample {
    return {
      position: output.position ?? input.position,
      size: output.size ?? input.size ?? 1,
      orientation: output.orientation,
    };
  }
}
