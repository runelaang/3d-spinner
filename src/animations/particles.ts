import type { AnimationFrame, SpinnerAnimation } from "../animation.js";
import {
  Little3dEngine,
  quad,
  type Backend,
  type MeshHandle,
  type OneSidedTransparency,
  type RendererFactory,
  type Vec3,
  cross,
  normalize,
} from "../engines/little-3d-engine/little-3d-engine.js";

export interface ParticlesOptions {
  /** Particles emitted per second. Default `20`. */
  rate?: number;
  /** Lifetime of one particle in milliseconds. Default `1800`. */
  lifeMs?: number;
  /** Particle colors, cycled across particles. Defaults to a built-in palette. */
  colors?: string[];
  /** Base particle size in world units, varied per particle. Default `0.16`. */
  size?: number;
  /** Base emission speed in world units per second, varied per particle. Default `0.6`. */
  speed?: number;
  /** Constant acceleration in world units per second squared. Default none. */
  gravity?: Vec3;
  /** Mean emission direction. Omit to emit uniformly in all directions. */
  direction?: Vec3;
  /** Cone half-angle around `direction` in radians. Default `0.5`. */
  spread?: number;
  /** Peak particle opacity `0..1`. Default `0.9`. */
  opacity?: number;
  /** Maximum spin around the view axis in radians per millisecond. Default `0.002`. */
  spin?: number;
  /** Seed for the deterministic particle stream. Default `1`. */
  seed?: number;
  /** Rendering backend. Default `"canvas2d"`. */
  backend?: Backend;
  /**
   * Image applied to every particle (a URL or a drawable element), tinted by
   * the particle color; the image's alpha shapes the particle. Renders
   * through the WebGL textured renderer, which is fetched on demand and
   * replaces the `backend` option.
   */
  texture?: string | TexImageSource;
  /** Overlay label shown in indeterminate mode (no value to show). Hidden if omitted. */
  label?: string;
}

/** State of one live particle: where it is and how it looks. */
export interface ParticleSample {
  position: Vec3;
  /** Rotation around the view axis, radians. */
  roll: number;
  size: number;
  opacity: number;
}

/**
 * A deterministic particle stream. Particle `index` is emitted at
 * `index * spawnGapMs`; its whole life is a pure function of time, so the
 * field holds no per-frame state and the same seed replays the same stream.
 */
export interface ParticleField {
  /** Upper bound on simultaneously live particles; slots recycle beyond it. */
  maxLive: number;
  /** Milliseconds between consecutive emissions. */
  spawnGapMs: number;
  /** Lifetime of one particle in milliseconds. */
  lifeMs: number;
  /**
   * State of particle `index` at `t` milliseconds after emission started, or
   * `undefined` while unborn or after death.
   */
  sample(index: number, t: number): ParticleSample | undefined;
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

const DEFAULT_COLORS = ["#fde047", "#fb923c", "#f472b6", "#60a5fa"];
const FADE_IN_END = 0.15;
const FADE_OUT_START = 0.6;

function rand01(seed: number, index: number, salt: number): number {
  let h = (seed ^ Math.imul(index + 1, 0x9e3779b9) ^ Math.imul(salt + 1, 0x85ebca6b)) >>> 0;
  h = Math.imul(h ^ (h >>> 16), 0x45d9f3b);
  h = Math.imul(h ^ (h >>> 16), 0x45d9f3b);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

function smoothstep(edge0: number, edge1: number, value: number): number {
  const x = Math.max(0, Math.min(1, (value - edge0) / (edge1 - edge0)));
  return x * x * (3 - 2 * x);
}

function positiveFinite(value: number, name: string): number {
  if (!Number.isFinite(value) || value <= 0) {
    throw new RangeError(`3d-spinner: ${name} must be a finite number greater than zero.`);
  }
  return value;
}

function emitBasis(direction: Vec3): { d: Vec3; right: Vec3; up: Vec3 } {
  const d = normalize(direction);
  const helper: Vec3 = Math.abs(d.y) < 0.99 ? { x: 0, y: 1, z: 0 } : { x: 1, y: 0, z: 0 };
  const right = normalize(cross(helper, d));
  return { d, right, up: cross(d, right) };
}

/** Create a {@link ParticleField} from the emission options. */
export function particleField(options: ParticlesOptions = {}): ParticleField {
  const rate = positiveFinite(options.rate ?? 20, "rate");
  const lifeMs = positiveFinite(options.lifeMs ?? 1800, "lifeMs");
  const size = options.size ?? 0.16;
  const speed = options.speed ?? 0.6;
  const gravity = options.gravity;
  const spread = options.spread ?? 0.5;
  const peak = Math.max(0, Math.min(1, options.opacity ?? 0.9));
  const spin = options.spin ?? 0.002;
  const seed = options.seed ?? 1;
  const basis = options.direction && emitBasis(options.direction);
  const spawnGapMs = 1000 / rate;

  const directionOf = (index: number): Vec3 => {
    const u = rand01(seed, index, 0);
    const phi = 2 * Math.PI * rand01(seed, index, 1);
    if (!basis) {
      const z = 2 * u - 1;
      const r = Math.sqrt(Math.max(0, 1 - z * z));
      return { x: r * Math.cos(phi), y: r * Math.sin(phi), z };
    }
    const cos = 1 - u * (1 - Math.cos(spread));
    const sin = Math.sqrt(Math.max(0, 1 - cos * cos));
    const { d, right, up } = basis;
    return {
      x: d.x * cos + (right.x * Math.cos(phi) + up.x * Math.sin(phi)) * sin,
      y: d.y * cos + (right.y * Math.cos(phi) + up.y * Math.sin(phi)) * sin,
      z: d.z * cos + (right.z * Math.cos(phi) + up.z * Math.sin(phi)) * sin,
    };
  };

  return {
    maxLive: Math.ceil((lifeMs * rate) / 1000) + 1,
    spawnGapMs,
    lifeMs,
    sample(index: number, t: number): ParticleSample | undefined {
      if (index < 0) return undefined;
      const age = t - index * spawnGapMs;
      if (age < 0 || age >= lifeMs) return undefined;

      const seconds = age / 1000;
      const dir = directionOf(index);
      const travel = speed * (0.6 + 0.8 * rand01(seed, index, 2)) * seconds;
      const pull = gravity ? 0.5 * seconds * seconds : 0;
      const life = age / lifeMs;
      return {
        position: {
          x: dir.x * travel + (gravity ? gravity.x * pull : 0),
          y: dir.y * travel + (gravity ? gravity.y * pull : 0),
          z: dir.z * travel + (gravity ? gravity.z * pull : 0),
        },
        roll: 2 * Math.PI * rand01(seed, index, 3) + (2 * rand01(seed, index, 4) - 1) * spin * age,
        size: size * (0.7 + 0.6 * rand01(seed, index, 5)),
        opacity:
          peak * smoothstep(0, FADE_IN_END, life) * (1 - smoothstep(FADE_OUT_START, 1, life)),
      };
    },
  };
}

/**
 * A stream of camera-facing billboard particles: a burst, a fountain, drifting
 * embers - shaped by the emission options. Particles fade in, drift under
 * `gravity`, and fade out; the runner triggers the lifecycle: {@link enter}
 * starts emission, {@link exit} stops it and lets the live particles die out
 * as the outro.
 */
export class ParticlesAnimation implements SpinnerAnimation {
  private engine?: Little3dEngine;
  private label?: HTMLDivElement;
  private readonly handles: MeshHandle[] = [];
  private readonly fades: OneSidedTransparency[] = [];
  private readonly field: ParticleField;
  private readonly colors: string[];
  private readonly backend?: Backend;
  private readonly texture?: string | TexImageSource;
  private readonly labelText?: string;

  private enterAt = Infinity;
  private exitAt = Infinity;
  private finished = false;

  constructor(options: ParticlesOptions = {}) {
    this.field = particleField(options);
    this.colors = options.colors ?? DEFAULT_COLORS;
    this.backend = options.backend;
    this.texture = options.texture;
    this.labelText = options.label;
  }

  mount(target: HTMLElement): void {
    target.style.position = "relative";
    const meshes = this.colors.map((color) => quad(1, [color]));
    const texture = this.texture;
    const backend: Backend | RendererFactory | undefined = texture
      ? async (rendererOptions) => {
          const { WebGLTexturedRenderer } = await import(
            "../engines/little-3d-engine/renderers/webgl-textured.js"
          );
          const renderer = new WebGLTexturedRenderer(rendererOptions);
          for (const mesh of meshes) renderer.setTexture(mesh, texture);
          return renderer;
        }
      : this.backend;
    const engine = new Little3dEngine({
      backend,
      camera: { position: { x: 0, y: 0, z: 3 } },
      light: { intensity: 0, ambient: 1 },
    });
    for (let slot = 0; slot < this.field.maxLive; slot++) {
      const fade: OneSidedTransparency = { mode: "one-sided", opacity: 0 };
      this.fades.push(fade);
      this.handles.push(engine.add(meshes[slot % meshes.length], { scale: 0, transparency: fade }));
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
    if (this.enterAt === Infinity) this.enterAt = now;
  }

  exit(now: number): void {
    if (this.exitAt === Infinity) this.exitAt = now;
  }

  isFinished(): boolean {
    return this.finished;
  }

  render(now: number, frame: AnimationFrame): void {
    if (!this.engine || !this.label) return;
    if (this.exitAt !== Infinity && now >= this.exitAt + this.field.lifeMs) this.finished = true;

    for (const handle of this.handles) handle.transform.scale = 0;

    if (this.enterAt !== Infinity) {
      const t = now - this.enterAt;
      const gap = this.field.spawnGapMs;
      const first = Math.max(0, Math.ceil((t - this.field.lifeMs) / gap));
      let last = Math.floor(t / gap);
      if (this.exitAt !== Infinity) {
        last = Math.min(last, Math.floor((this.exitAt - this.enterAt) / gap));
      }
      for (let index = first; index <= last; index++) {
        const sample = this.field.sample(index, t);
        if (!sample) continue;
        const slot = index % this.handles.length;
        const transform = this.handles[slot].transform;
        transform.position.x = sample.position.x;
        transform.position.y = sample.position.y;
        transform.position.z = sample.position.z;
        transform.rotation.z = sample.roll;
        transform.scale = sample.size;
        this.fades[slot].opacity = sample.opacity;
      }
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
    this.fades.length = 0;
  }
}
