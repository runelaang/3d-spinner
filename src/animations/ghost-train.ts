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
  type Material,
  type Mesh,
  type MeshHandle,
  type Transparency,
  type Vec3,
  cross,
  dot,
  normalize,
  subtract,
} from "../engines/little-3d-engine/little-3d-engine.js";
import type { MotionController } from "../motion/controller.js";
import { squareMotion } from "../motion/square.js";
import { easeOutBack } from "../engines/little-tween-engine/core/tweens.js";

export interface GhostTrainOptions {
  /** How the convoy moves. Default a tilted square track. */
  motion?: MotionController;
  /** Uniform car size in scene units. Default `0.15`. */
  size?: number;
  /** Rendering backend. Default `"auto"`: WebGPU, then WebGL, then Canvas 2D. */
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
const TURN_RATE = (0.4 * Math.PI) / 180; // max heading change per millisecond (smooth cornering)

// Blast-off: the whole convoy funnels through the lead car's exit point and
// follows the exact same escape path. A time-warp accelerates every car's
// path-time after exit so all of them clear the view within MAX_OUTRO_MS.
const MAX_OUTRO_MS = 4000;
const WARP_ACCEL = 1000; // extra path-milliseconds accrued, = 0.5 * WARP_ACCEL * seconds^2
const TRAIL_OUTRO_MS = 1200; // how long the lead keeps shedding stars into the outro

const TRANSPARENCY: Transparency = { mode: "two-sided", opacity: 0.275 };
const CAR_COLORS = ["#bae6fd", "#7dd3fc", "#38bdf8", "#0ea5e9", "#a5f3fc", "#e0f2fe"];
// A faint icy self-glow so the translucent cars read as ghostly rather than flat.
const CAR_MATERIAL: Material = { emissive: [0.1, 0.2, 0.3] };
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

/** Rotate unit vector `from` toward `to` by at most `maxRad`, for a rate-limited turn. */
function rotateToward(from: Vec3, to: Vec3, maxRad: number): Vec3 {
  const a = normalize(from);
  const b = normalize(to);
  const d = Math.max(-1, Math.min(1, dot(a, b)));
  const angle = Math.acos(d);
  if (angle <= maxRad || angle < 1e-4) return b;
  const sin = Math.sin(angle);
  if (sin < 1e-4) return b; // (near-)opposite: snap rather than spin unpredictably
  const t = maxRad / angle;
  const w1 = Math.sin((1 - t) * angle) / sin;
  const w2 = Math.sin(t * angle) / sin;
  return normalize({ x: a.x * w1 + b.x * w2, y: a.y * w1 + b.y * w2, z: a.z * w1 + b.z * w2 });
}

/**
 * A progress story: a translucent train of ice cubes runs laps around a tilted
 * square track, cars turning smoothly through the corners as if seen from above.
 * Every 2% of progress attaches one more car, popping it into existence at the
 * tail. At 100% the lead car keeps going in its current direction of travel and
 * every following car funnels through that same exit point along the exact same
 * path, the convoy accelerating clear of the view within four seconds. Car
 * count follows the
 * reported progress, so scrubbing in either direction stays smooth.
 * {@link trailEmitter} exposes the lead car to a particle layer for the star trail.
 */
export class GhostTrainAnimation implements SpinnerAnimation {
  private engine?: Little3dEngine;
  private label?: MountedAnimationLabel;
  private observer?: ResizeObserver;
  private readonly cars: MeshHandle[] = [];
  private readonly appear: number[] = new Array(MAX_CARS).fill(0);
  private readonly headings: Array<Vec3 | undefined> = new Array(MAX_CARS).fill(undefined);
  private readonly motion: MotionController;
  private readonly size: number;
  private readonly backend?: Backend;
  private readonly labelContent?: AnimationLabel;
  private readonly fadeLabel: boolean;

  private aspect = 16 / 9;
  private enterAt = Infinity;
  private outroAt = Infinity;
  private carsAtOutro = 0;
  private exitPathTime = 0; // lead car's path-time at blast-off (the escape switch point)
  private exitPoint: Vec3 = { x: 0, y: 0, z: 0 };
  private exitDir: Vec3 = { x: 1, y: 0, z: 0 }; // shared escape direction, outward from the track
  private exitSpeed = 0.001; // path-units per path-millisecond at the switch (keeps speed continuous)
  private lastNow = 0;
  private finished = false;

  constructor(options: GhostTrainOptions = {}) {
    this.motion = options.motion ?? squareMotion({ size: 1.7, periodMs: 6800, tilt: 0.5 });
    this.size = options.size ?? 0.15;
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
    const mesh: Mesh = cube(1, CAR_COLORS, CAR_MATERIAL);
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
    this.exitPathTime = now - this.enterAt;

    const from = this.motion.positionAt(this.exitPathTime);
    const velocity = subtract(
      this.motion.positionAt(this.exitPathTime + 1),
      this.motion.positionAt(this.exitPathTime - 1),
    );
    const speed = Math.hypot(velocity.x, velocity.y, velocity.z);
    this.exitPoint = from;
    if (speed > 1e-6) this.exitSpeed = speed / 2;

    // The lead car keeps going in its current direction of travel; every car
    // funnels through the exit point and follows that same straight path out.
    this.exitDir = speed > 1e-6 ? normalize(velocity) : { x: 1, y: 0, z: 0 };
  }

  isFinished(): boolean {
    return this.finished;
  }

  /** Milliseconds the lead car keeps moving into the outro; feed a trail layer's `outroMs`. */
  get outroDurationMs(): number {
    return TRAIL_OUTRO_MS;
  }

  /**
   * A {@link MotionController} following the lead car's actual position, through
   * laps and the accelerating escape. Feed it to a particle layer's `emitter`
   * so the star trail stays behind the train.
   */
  trailEmitter(): MotionController {
    return {
      positionAt: (t) =>
        this.enterAt === Infinity
          ? this.motion.positionAt(t)
          : this.pathPosition(t - this.enterAt + this.warp(t)),
    };
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
    const warp = this.warp(now);
    let anyOnScreen = false;

    for (let k = 0; k < MAX_CARS; k++) {
      const target = k < want ? 1 : 0;
      this.appear[k] = clamp01(this.appear[k] + Math.sign(target - this.appear[k]) * (dt / POP_MS));
      if (this.appear[k] <= 0) {
        this.headings[k] = undefined;
        continue;
      }

      const p = now - this.enterAt - k * RUN_GAP_MS + warp;
      const position = this.pathPosition(p);
      if (Math.abs(position.x) > halfWidth + this.size || Math.abs(position.y) > HALF_HEIGHT + this.size) {
        continue; // off-screen: leave it hidden
      }

      const ahead = subtract(this.pathPosition(p + SAMPLE_MS), position);
      const targetDir = Math.hypot(ahead.x, ahead.y, ahead.z) > 1e-5
        ? ahead
        : this.headings[k] ?? { x: 1, y: 0, z: 0 };
      this.headings[k] = this.headings[k]
        ? rotateToward(this.headings[k]!, targetDir, TURN_RATE * dt)
        : normalize(targetDir);
      const orientation = orientationFor(this.headings[k]!);

      const transform = this.cars[k].transform;
      transform.position.x = position.x;
      transform.position.y = position.y;
      transform.position.z = position.z;
      transform.rotation.x = orientation.x;
      transform.rotation.y = orientation.y;
      transform.rotation.z = orientation.z;
      transform.scale = this.size * easeOutBack(this.appear[k]);
      anyOnScreen = true;
    }

    this.label.setText(frame.indeterminate
      ? (typeof this.labelContent === "string" ? this.labelContent : "")
      : `${Math.round(frame.progress * 100)}%`);
    if (this.fadeLabel) {
      this.label.setOpacity(animationLabelOpacity(now, this.enterAt, POP_MS, this.outroAt, TRAIL_OUTRO_MS));
    }

    if (this.outroAt !== Infinity && now > this.outroAt + 300 &&
        (!anyOnScreen || now >= this.outroAt + MAX_OUTRO_MS)) {
      this.finished = true;
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

  /** Extra path-time every car has accelerated forward by, `now` ms into the outro. */
  private warp(now: number): number {
    if (this.outroAt === Infinity) return 0;
    const seconds = (now - this.outroAt) / 1000;
    return 0.5 * WARP_ACCEL * seconds * seconds;
  }

  /**
   * The single trajectory every car rides, sampled at path-time `p`: the track
   * up to the exit switch point, then a straight escape outward. Because the
   * switch point and direction are shared, all cars follow the exact same path.
   */
  private pathPosition(p: number): Vec3 {
    if (this.outroAt === Infinity || p <= this.exitPathTime) {
      return this.motion.positionAt(p);
    }
    const distance = this.exitSpeed * (p - this.exitPathTime);
    return {
      x: this.exitPoint.x + this.exitDir.x * distance,
      y: this.exitPoint.y + this.exitDir.y * distance,
      z: this.exitPoint.z + this.exitDir.z * distance,
    };
  }
}
