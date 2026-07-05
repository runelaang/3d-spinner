import type { AnimationLabel } from "../animation.js";
import { CompositeAnimation } from "../composite-animation.js";
import type { IndeterminateSpinnerOptions } from "../index.js";
import { ObjectMotionAnimation, type ObjectMotionOptions } from "../animations/object-motion.js";
import { ParticlesAnimation, type ParticlesOptions } from "../animations/particles.js";
import {
  tetrahedron,
  type Backend,
  type Mesh,
} from "../engines/little-3d-engine/little-3d-engine.js";
import { figureEightMotion } from "../motion/figure-eight.js";
import { wanderMotion } from "../motion/wander.js";
import type { SpinnerPlugin } from "../plugin.js";
import { adaptiveQuality } from "../plugins/adaptive-quality.js";

export interface PrefabOptions {
  /** Rendering backend used by every layer. Default `"canvas2d"`. */
  backend?: Backend;
  /** Text or custom HTML shown over the prefab. */
  label?: AnimationLabel;
  /** Indeterminate progress loop. Default `"bounce"`. */
  loop?: "bounce" | "restart";
  /** Milliseconds for one progress sweep. Default `2000`. */
  periodMs?: number;
  /** Spinner plugins. Defaults to adaptive particle quality. */
  plugins?: ReadonlyArray<SpinnerPlugin>;
}

export interface MotionPrefabOptions extends PrefabOptions {
  /** Overrides for the moving object layer, including `mesh` and `motion`. */
  object?: Partial<ObjectMotionOptions>;
  /** Overrides for the particle layer. */
  particles?: ParticlesOptions;
}

export interface ParticlePrefabOptions extends PrefabOptions {
  /** Overrides for the particle animation. */
  particles?: ParticlesOptions;
}

function spinner(
  animation: CompositeAnimation | ParticlesAnimation,
  options: PrefabOptions,
): IndeterminateSpinnerOptions {
  return {
    type: "indeterminate",
    animation,
    loop: options.loop,
    periodMs: options.periodMs,
    plugins: options.plugins ?? [adaptiveQuality()],
  };
}

function texture(draw: (ctx: CanvasRenderingContext2D) => void): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 96;
  const ctx = canvas.getContext("2d");
  if (ctx) draw(ctx);
  return canvas;
}

function starTexture(): HTMLCanvasElement {
  return texture((ctx) => {
    ctx.translate(48, 48);
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    for (let index = 0; index < 10; index++) {
      const radius = index % 2 === 0 ? 43 : 16;
      const angle = (index * Math.PI) / 5 - Math.PI / 2;
      ctx.lineTo(radius * Math.cos(angle), radius * Math.sin(angle));
    }
    ctx.closePath();
    ctx.fill();
  });
}

function shineTexture(): HTMLCanvasElement {
  return texture((ctx) => {
    const halo = ctx.createRadialGradient(48, 48, 1, 48, 48, 46);
    halo.addColorStop(0, "rgba(255,255,255,1)");
    halo.addColorStop(0.08, "rgba(255,255,255,1)");
    halo.addColorStop(0.22, "rgba(210,240,255,0.7)");
    halo.addColorStop(0.55, "rgba(120,200,255,0.22)");
    halo.addColorStop(1, "rgba(80,160,255,0)");
    ctx.fillStyle = halo;
    ctx.fillRect(0, 0, 96, 96);
  });
}

function streakTexture(): HTMLCanvasElement {
  return texture((ctx) => {
    const gradient = ctx.createLinearGradient(5, 0, 91, 0);
    gradient.addColorStop(0, "rgba(255,255,255,0)");
    gradient.addColorStop(0.72, "#fff");
    gradient.addColorStop(1, "#fff");
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 7;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(5, 48);
    ctx.lineTo(91, 48);
    ctx.stroke();
  });
}

function planeMesh(): Mesh {
  const vertices = [
    { x: 0.9, y: 0, z: 0 },
    { x: -0.7, y: 0.08, z: 0 },
    { x: -0.25, y: 0, z: 0.82 },
    { x: -0.25, y: 0, z: -0.82 },
    { x: -0.58, y: 0.38, z: 0 },
    { x: -0.58, y: -0.12, z: 0 },
  ];
  const colors = ["#e0f2fe", "#7dd3fc", "#38bdf8", "#f8fafc"];
  return {
    vertices,
    faces: [
      { indices: [0, 2, 1], color: colors[0] },
      { indices: [0, 1, 3], color: colors[1] },
      { indices: [0, 4, 2], color: colors[3] },
      { indices: [0, 3, 4], color: colors[2] },
      { indices: [1, 2, 5], color: colors[1] },
      { indices: [1, 5, 3], color: colors[2] },
    ],
  };
}

function pulsingLabel(): HTMLDivElement {
  const label = document.createElement("div");
  label.innerHTML = `<style>
    @keyframes spinner-prefab-pulse { 0%,100% { color:#fff; transform:scale(1); } 50% { color:#93c5fd; transform:scale(1.06); } }
  </style><div style="animation:spinner-prefab-pulse 2.4s ease-in-out infinite;font-size:2rem">Loading the good stuff</div>`;
  return label;
}

/** A small plane looping through a stream of colorful star particles. */
export function planeStarTrail(options: MotionPrefabOptions = {}): IndeterminateSpinnerOptions {
  const motion = options.object?.motion ?? figureEightMotion({ size: 0.72, periodMs: 6200 });
  const particles = options.particles ?? {};
  const animation = new CompositeAnimation([
    new ParticlesAnimation({
      rate: 34,
      lifeMs: 1900,
      size: 0.16,
      speed: 0.11,
      colors: ["#fde047", "#f472b6", "#7dd3fc"],
      texture: particles.texture ?? starTexture(),
      emitter: motion,
      seed: 11,
      backend: options.backend,
      ...particles,
      label: options.label ?? particles.label ?? "Flying in...",
    }),
    new ObjectMotionAnimation({
      mesh: planeMesh,
      motion,
      size: 0.48,
      backend: options.backend,
      ...options.object,
      label: options.object?.label,
    }),
  ]);
  return spinner(animation, options);
}

/** A spinning crystal primitive with a luminous comet trail. */
export function crystalComet(options: MotionPrefabOptions = {}): IndeterminateSpinnerOptions {
  const motion = options.object?.motion ?? figureEightMotion({ size: 0.66, periodMs: 7200 });
  const particles = options.particles ?? {};
  const animation = new CompositeAnimation([
    new ParticlesAnimation({
      rate: 44,
      lifeMs: 2300,
      size: 0.25,
      speed: 0.08,
      colors: ["#ffffff", "#bae6fd", "#818cf8"],
      texture: particles.texture ?? shineTexture(),
      emitter: motion,
      seed: 28,
      backend: options.backend,
      ...particles,
      label: options.label ?? particles.label ?? "Polishing pixels",
    }),
    new ObjectMotionAnimation({
      mesh: () => tetrahedron(1, ["#f0f9ff", "#7dd3fc", "#818cf8", "#e879f9"]),
      motion,
      size: 0.42,
      rotation: { spinX: 0.002, spinY: 0.003 },
      backend: options.backend,
      ...options.object,
      label: options.object?.label,
    }),
  ]);
  return spinner(animation, options);
}

/** High-shine particles drifting around a slowly pulsing HTML message. */
export function pulsingStarfield(options: ParticlePrefabOptions = {}): IndeterminateSpinnerOptions {
  const particles = options.particles ?? {};
  return spinner(new ParticlesAnimation({
    rate: 48,
    lifeMs: 4200,
    size: 0.3,
    speed: 0.34,
    colors: ["#ffffff", "#dbeafe", "#93c5fd", "#c4b5fd"],
    texture: particles.texture ?? shineTexture(),
    seed: 71,
    backend: options.backend,
    ...particles,
    label: options.label ?? particles.label ?? pulsingLabel(),
  }), options);
}

/** Bright star particles wandering around a centered loading message. */
export function starSwarm(options: ParticlePrefabOptions = {}): IndeterminateSpinnerOptions {
  const particles = options.particles ?? {};
  const emitter = particles.emitter ?? wanderMotion({
    bounds: { x: 1.1, y: 0.72, z: 0.35 },
    periodMs: 7200,
    seed: 19,
  });
  return spinner(new ParticlesAnimation({
    rate: 38,
    lifeMs: 2600,
    size: 0.15,
    speed: 0.17,
    colors: ["#fef08a", "#f9a8d4", "#a5f3fc"],
    texture: particles.texture ?? starTexture(),
    emitter,
    seed: 91,
    backend: options.backend,
    ...particles,
    label: options.label ?? particles.label ?? "Loading...",
  }), options);
}

/** A fountain of black and white streaks that turn with their travel direction. */
export function monochromeStreak(options: ParticlePrefabOptions = {}): IndeterminateSpinnerOptions {
  const particles = options.particles ?? {};
  return spinner(new ParticlesAnimation({
    rate: 70,
    lifeMs: 1300,
    size: 0.38,
    speed: 1.35,
    direction: { x: 0, y: 1, z: 0 },
    spread: 0.48,
    gravity: { x: 0, y: -1.45, z: 0 },
    colors: ["#fff", "#000"],
    texture: particles.texture ?? streakTexture(),
    spin: 0,
    alignToMotion: true,
    seed: 37,
    backend: options.backend,
    ...particles,
    label: options.label ?? particles.label ?? "Loading...",
  }), options);
}
