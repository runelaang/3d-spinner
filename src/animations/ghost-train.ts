import type { AnimationFrame, AnimationLabel, SpinnerAnimation } from "../animation.js";
import {
  animationLabelOpacity,
  mountAnimationLabel,
  type MountedAnimationLabel,
} from "../animation-label.js";
import {
  Little3dEngine,
  cube,
  type Backend,
  type Mesh,
  type MeshHandle,
  type Transparency,
  type Vec3,
  cross,
  normalize,
  subtract,
} from "../engines/little-3d-engine/little-3d-engine.js";
import type { MotionController } from "../motion/controller.js";
import { squareMotion } from "../motion/square.js";
import { easeOutBack } from "../engines/little-tween-engine/core/tweens.js";

export interface GhostTrainOptions {
  /** How the convoy moves. Default a tilted square track. */
  motion?: MotionController;
  /** Uniform car size in scene units. Default `0.3`. */
  size?: number;
  /** Rendering backend. Default `"canvas2d"`. */
  backend?: Backend;
  /** Overlay label; progress mode shows a percentage. */
  label?: AnimationLabel;
  /** Fade the label with the story's beginning and end. Default `true`. */
  fadeLabel?: boolean;
}

const MAX_CARS = 50; // one car per 2% of progress
const CAMERA_Z = 3;
const FOV = (55 * Math.PI) / 180;
const HALF_HEIGHT = Math.tan(FOV / 2) * CAMERA_Z;
const RUN_GAP_MS = 130; // spacing between cars in path-time; 49 gaps stay under one lap
const POP_MS = 320; // a new car pops into existence over this long
const SAMPLE_MS = 8; // heading sample step

// Bounded blast-off: the whole convoy must clear the view within MAX_OUTRO_MS.
// Cars peel off one after another (OUTRO_GAP apart) then accelerate away.
const MAX_OUTRO_MS = 4000;
const FLYOUT_MS = 900; // time for one car to accelerate clear of the view
const OUTRO_GAP_MS = 60; // (MAX_OUTRO_MS - FLYOUT_MS) / (MAX_CARS - 1), rounded down
const OUTRO_ACCEL = 12; // fly-out acceleration, scene units per second squared

const TRANSPARENCY: Transparency = { mode: "two-sided", opacity: 0.55 };
const CAR_COLORS = ["#bae6fd", "#7dd3fc", "#38bdf8", "#0ea5e9", "#a5f3fc", "#e0f2fe"];
const WORLD_UP: Vec3 = { x: 0, y: 1, z: 0 };

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

/** Orientation (engine Euler) that points the car's local +X along `forward`, kept upright. */
function orientationFor(forward: Vec3): Vec3 {
  const fwd = normalize(forward);
  let right = cross(fwd, WORLD_UP);
  if (Math.hypot(right.x, right.y, right.z) < 1e-4) right = { x: 0, y: 0, z: 1 };
  right = normalize(right);
  const up = cross(right, fwd);
  const w = normalize(cross(fwd, up));
  return {
    x: Math.atan2(cross(w, fwd).z, w.z),
    y: Math.asin(Math.max(-1, Math.min(1, -fwd.z))),
    z: Math.atan2(fwd.y, fwd.x),
  };
}

/**
 * A progress story: a translucent train of ice cubes runs laps around a tilted
 * square track. Every 2% of progress attaches one more car, popping it into
 * existence at the tail. At 100% the whole convoy peels off the track one after
 * another and accelerates away, clearing the view within four seconds. Car count
 * follows the reported progress, so scrubbing in either direction stays smooth.
 * {@link trailEmitter} exposes the lead car to a particle layer for the star trail.
 */
export class GhostTrainAnimation implements SpinnerAnimation {
  private engine?: Little3dEngine;
  private label?: MountedAnimationLabel;
  private observer?: ResizeObserver;
  private readonly cars: MeshHandle[] = [];
  private readonly appear: number[] = new Array(MAX_CARS).fill(0);
  private readonly motion: MotionController;
  private readonly size: number;
  private readonly backend?: Backend;
  private readonly labelContent?: AnimationLabel;
  private readonly fadeLabel: boolean;

  private aspect = 16 / 9;
  private enterAt = Infinity;
  private outroAt = Infinity;
  private carsAtOutro = 0;
  private exitDir: Vec3 = { x: 1, y: 0, z: 0 };
  private exitSpeed = 1; // scene units per second, sampled from the track at blast-off
  private lastNow = 0;
  private finished = false;

  constructor(options: GhostTrainOptions = {}) {
    this.motion = options.motion ?? squareMotion({ size: 1.7, periodMs: 6800, tilt: 0.5 });
    this.size = options.size ?? 0.3;
    this.backend = options.backend;
    this.labelContent = options.label;
    this.fadeLabel = options.fadeLabel ?? true;
  }

  mount(target: HTMLElement): void {
    if (!target.style.position) target.style.position = "relative";
    const engine = new Little3dEngine({
      backend: this.backend,
      camera: { position: { x: 0, y: 0, z: CAMERA_Z }, fov: FOV },
    });
    const mesh: Mesh = cube(1, CAR_COLORS);
    for (let i = 0; i < MAX_CARS; i++) {
      this.cars.push(engine.add(mesh, { scale: 0, transparency: { ...TRANSPARENCY } }));
    }
    this.engine = engine;
    engine.mount(target).catch((error) => {
      target.textContent = error instanceof Error ? error.message : String(error);
    });

    const measure = () => {
      if (target.clientWidth > 0 && target.clientHeight > 0) {
        this.aspect = target.clientWidth / target.clientHeight;
      }
    };
    measure();
    this.observer = new ResizeObserver(measure);
    this.observer.observe(target);

    this.label = mountAnimationLabel(target, this.labelContent);
    if (this.fadeLabel) this.label.setOpacity(0);
  }

  enter(now: number): void {
    if (this.enterAt === Infinity) this.enterAt = now;
  }

  exit(now: number): void {
    if (this.outroAt !== Infinity || this.enterAt === Infinity) return;
    this.outroAt = now;
    this.carsAtOutro = this.appear.filter((a) => a > 0.5).length;
    // Single exit direction and speed for the whole convoy: the lead car's tangent.
    const to = now - this.enterAt;
    const velocity = subtract(this.motion.positionAt(to + 1), this.motion.positionAt(to - 1));
    const speed = Math.hypot(velocity.x, velocity.y, velocity.z);
    if (speed > 1e-6) {
      this.exitDir = { x: velocity.x / speed, y: velocity.y / speed, z: velocity.z / speed };
      this.exitSpeed = speed * 1000; // per-ms sample -> per-second
    }
  }

  isFinished(): boolean {
    return this.finished;
  }

  /** Milliseconds the lead car keeps moving into the outro; feed a trail layer's `outroMs`. */
  get outroDurationMs(): number {
    return FLYOUT_MS;
  }

  /**
   * A {@link MotionController} following the lead car's actual position, through
   * laps and the accelerating blast-off. Feed it to a particle layer's `emitter`
   * so the star trail stays behind the train.
   */
  trailEmitter(): MotionController {
    return { positionAt: (t) => this.leadPositionAt(t) };
  }

  render(now: number, frame: AnimationFrame): void {
    if (!this.engine || !this.label) return;

    for (const car of this.cars) car.transform.scale = 0;
    if (this.enterAt === Infinity) {
      this.engine.render();
      return;
    }

    const dt = this.lastNow === 0 ? 16 : Math.min(50, now - this.lastNow);
    this.lastNow = now;

    // One car per 2%; round so the fiftieth attaches ~99% and has a beat to pop
    // before the 100% blast-off (mirrors the rocket-launch count).
    const want = this.outroAt !== Infinity
      ? this.carsAtOutro
      : Math.min(MAX_CARS, Math.round(frame.progress * MAX_CARS));
    const halfWidth = HALF_HEIGHT * this.aspect;

    for (let k = 0; k < MAX_CARS; k++) {
      const target = k < want ? 1 : 0;
      this.appear[k] += Math.sign(target - this.appear[k]) * (dt / POP_MS);
      this.appear[k] = clamp01(this.appear[k]);
      if (this.appear[k] <= 0) continue;

      const pose = this.carPose(k, now);
      if (!pose || Math.abs(pose.position.x) > halfWidth + this.size || Math.abs(pose.position.y) > HALF_HEIGHT + this.size) {
        continue; // off-screen: leave it hidden
      }
      const transform = this.cars[k].transform;
      transform.position.x = pose.position.x;
      transform.position.y = pose.position.y;
      transform.position.z = pose.position.z;
      transform.rotation.x = pose.orientation.x;
      transform.rotation.y = pose.orientation.y;
      transform.rotation.z = pose.orientation.z;
      transform.scale = this.size * easeOutBack(this.appear[k]);
    }

    this.label.setText(frame.indeterminate
      ? (typeof this.labelContent === "string" ? this.labelContent : "")
      : `${Math.round(frame.progress * 100)}%`);
    if (this.fadeLabel) {
      this.label.setOpacity(animationLabelOpacity(now, this.enterAt, POP_MS, this.outroAt, FLYOUT_MS));
    }

    if (this.outroAt !== Infinity) {
      const span = this.carsAtOutro > 0
        ? (this.carsAtOutro - 1) * OUTRO_GAP_MS + FLYOUT_MS + 150
        : 300;
      if (now >= this.outroAt + Math.min(MAX_OUTRO_MS, span)) this.finished = true;
    }
    this.engine.render();
  }

  destroy(): void {
    this.observer?.disconnect();
    this.observer = undefined;
    this.label?.container.remove();
    this.label = undefined;
    this.engine?.destroy();
    this.engine = undefined;
    this.cars.length = 0;
  }

  /** Accelerating distance a car has travelled `ms` into its fly-out. */
  private flyoutDistance(ms: number): number {
    const s = ms / 1000;
    return this.exitSpeed * s + 0.5 * OUTRO_ACCEL * s * s;
  }

  /** Position and orientation of car `k` at time `now`, or `undefined` if it has no place yet. */
  private carPose(k: number, now: number): { position: Vec3; orientation: Vec3 } | undefined {
    if (this.enterAt === Infinity) return undefined;

    if (this.outroAt !== Infinity) {
      const peelStart = this.outroAt + k * OUTRO_GAP_MS;
      const local = now - peelStart;
      if (local >= 0) {
        // Peel off the track and accelerate along the shared exit direction.
        const phase = peelStart - this.enterAt - k * RUN_GAP_MS;
        const from = this.motion.positionAt(phase);
        const d = this.flyoutDistance(local);
        return {
          position: { x: from.x + this.exitDir.x * d, y: from.y + this.exitDir.y * d, z: from.z + this.exitDir.z * d },
          orientation: orientationFor(this.exitDir),
        };
      }
    }
    return this.trackPose(now - this.enterAt - k * RUN_GAP_MS);
  }

  private trackPose(phase: number): { position: Vec3; orientation: Vec3 } {
    const position = this.motion.positionAt(phase);
    const ahead = subtract(this.motion.positionAt(phase + SAMPLE_MS), position);
    const orientation = Math.hypot(ahead.x, ahead.y, ahead.z) > 1e-5
      ? orientationFor(ahead)
      : { x: 0, y: 0, z: 0 };
    return { position, orientation };
  }

  private leadPositionAt(t: number): Vec3 {
    if (this.enterAt === Infinity) return this.motion.positionAt(t);
    if (this.outroAt !== Infinity && t >= this.outroAt) {
      const from = this.motion.positionAt(this.outroAt - this.enterAt);
      const d = this.flyoutDistance(t - this.outroAt);
      return { x: from.x + this.exitDir.x * d, y: from.y + this.exitDir.y * d, z: from.z + this.exitDir.z * d };
    }
    return this.motion.positionAt(t - this.enterAt);
  }
}
