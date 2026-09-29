import type { AnimationFrame, AnimationLabel, SpinnerAnimation } from "../animation.js";
import { prepareHost } from "../mount-host.js";
import { finite } from "../validate.js";
import {
  animationLabelOpacity,
  mountAnimationLabel,
  type MountedAnimationLabel,
} from "../animation-label.js";
import type { MotionController } from "../motion/controller.js";
import {
  Little3dEngine,
  quad,
  type Backend,
  type MeshHandle,
  type OneSidedTransparency,
  type Vec3,
} from "../engines/little-3d-engine/little-3d-engine.js";
import { FADE_IN_END, particleField, type ParticleField } from "./particle-field.js";
import { createTexturedRenderer } from "../engines/little-3d-engine/textured-renderer.js";

export interface ParticlesOptions {
  /** Particles emitted per second. Default `20`. */
  rate?: number;
  /** Lifetime of one particle in milliseconds. Default `1800`. */
  lifeMs?: number;
  /**
   * Particle hex colors (`#rgb` or `#rrggbb`), cycled across particles. Defaults to a
   * built-in palette, also when empty.
   */
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
  /** Rotate each billboard around the view axis to follow its current velocity. Default `false`. */
  alignToMotion?: boolean;
  /** Seed for the deterministic particle stream. Default `1`. */
  seed?: number;
  /** Rendering backend. Default `"auto"`: WebGPU, then WebGL, then Canvas 2D. */
  backend?: Backend;
  /** Optional moving emission origin. Each particle keeps the origin where it was emitted. */
  emitter?: MotionController;
  /**
   * Milliseconds to keep emitting after {@link ParticlesAnimation.exit}. Default `0`
   * (emission stops at exit). Give it a moving `emitter`'s outro duration so fresh
   * particles keep trailing the emitter as it flies out, instead of freezing where
   * the loop left off. A function is read after exit, for an emitter whose
   * outro timing is only known then (see `ObjectMotionAnimation.outroDelayMs`).
   * A number must be finite (`RangeError` otherwise); a function result that is
   * not finite counts as `0`.
   */
  outroMs?: number | (() => number);
  /**
   * Image applied to every particle (a URL or a drawable element), tinted by
   * the particle color; the image's alpha shapes the particle. Renders through
   * the textured renderer matching the resolved `backend`, fetched on demand.
   */
  texture?: string | TexImageSource;
  /** Overlay label shown in indeterminate mode (no value to show). Hidden if omitted. */
  label?: AnimationLabel;
  /** Fade the label as particles appear and drain away. Default `true`. */
  fadeLabel?: boolean;
}

const DEFAULT_COLORS = ["#fde047", "#fb923c", "#f472b6", "#60a5fa"];

/**
 * A stream of camera-facing billboard particles: a burst, a fountain, drifting
 * embers - shaped by the emission options. Particles fade in, drift under
 * `gravity`, and fade out; the runner triggers the lifecycle: {@link enter}
 * starts emission, {@link exit} stops it and lets the live particles die out
 * as the outro.
 */
export class ParticlesAnimation implements SpinnerAnimation {
  private engine?: Little3dEngine;
  private label?: MountedAnimationLabel;
  private readonly handles: MeshHandle[] = [];
  private readonly fades: OneSidedTransparency[] = [];
  private readonly field: ParticleField;
  private readonly colors: string[];
  private readonly backend?: Backend;
  private readonly texture?: string | TexImageSource;
  private readonly labelContent?: AnimationLabel;
  private readonly fadeLabel: boolean;
  private readonly emitter?: MotionController;
  private readonly outroMs: () => number;

  private enterAt = Infinity;
  private exitAt = Infinity;
  private finished = false;

  constructor(options: ParticlesOptions = {}) {
    this.field = particleField(options);
    this.colors = [...(options.colors?.length ? options.colors : DEFAULT_COLORS)];
    this.backend = options.backend;
    this.texture = options.texture;
    this.labelContent = options.label;
    this.fadeLabel = options.fadeLabel ?? true;
    this.emitter = options.emitter;
    const outroMs = options.outroMs ?? 0;
    if (typeof outroMs === "number") finite(outroMs, "outroMs");
    this.outroMs = () => {
      const value = typeof outroMs === "function" ? outroMs() : outroMs;
      return Number.isFinite(value) ? Math.max(0, value) : 0;
    };
  }

  mount(target: HTMLElement): Promise<void> {
    prepareHost(target);
    const meshes = this.colors.map((color) => quad(1, [color]));
    const texture = this.texture;
    const engine = new Little3dEngine({
      backend: this.backend,
      rendererFor: texture
        ? (backend, options) =>
            createTexturedRenderer(backend, options, new Map(meshes.map((mesh) => [mesh, texture])))
        : undefined,
      camera: { position: { x: 0, y: 0, z: 3 } },
      light: { intensity: 0, ambient: 1 },
    });
    for (let slot = 0; slot < this.field.maxLive; slot++) {
      const fade: OneSidedTransparency = { mode: "one-sided", opacity: 0 };
      this.fades.push(fade);
      this.handles.push(engine.add(meshes[slot % meshes.length], { scale: 0, transparency: fade }));
    }
    this.engine = engine;
    const mounting = engine.mount(target);

    this.label = mountAnimationLabel(target, this.labelContent);
    if (this.fadeLabel) this.label.setOpacity(0);
    return mounting;
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
    const emitEnd = this.exitAt === Infinity ? Infinity : this.exitAt + this.outroMs();
    if (now >= emitEnd + this.field.lifeMs) this.finished = true;

    for (const handle of this.handles) handle.transform.scale = 0;

    if (this.enterAt !== Infinity) {
      const t = now - this.enterAt;
      const gap = this.field.spawnGapMs;
      let first = Math.max(0, Math.ceil((t - this.field.lifeMs) / gap));
      let last = Math.floor(t / gap);
      if (emitEnd !== Infinity) {
        last = Math.min(last, Math.floor((emitEnd - this.enterAt) / gap));
      }
      first = Math.max(first, last - this.field.maxLive + 1);
      for (let index = first; index <= last; index++) {
        const sample = this.field.sample(index, t);
        if (!sample) continue;
        const slot = index % this.handles.length;
        const transform = this.handles[slot].transform;
        const origin = this.emitter?.positionAt(this.enterAt + index * gap);
        transform.position.x = sample.position.x + (origin?.x ?? 0);
        transform.position.y = sample.position.y + (origin?.y ?? 0);
        transform.position.z = sample.position.z + (origin?.z ?? 0);
        transform.rotation.z = sample.roll;
        transform.scale = sample.size;
        this.fades[slot].opacity = sample.opacity;
      }
    }

    this.label.setText(
      frame.indeterminate
        ? typeof this.labelContent === "string"
          ? this.labelContent
          : ""
        : `${Math.round(frame.progress * 100)}%`,
    );
    if (this.fadeLabel) {
      this.label.setOpacity(
        animationLabelOpacity(
          now,
          this.enterAt,
          this.field.lifeMs * FADE_IN_END,
          this.exitAt,
          this.field.lifeMs,
        ),
      );
    }
    this.engine.render();
  }

  destroy(): void {
    this.label?.container.remove();
    this.label = undefined;
    this.engine?.destroy();
    this.engine = undefined;
    this.handles.length = 0;
    this.fades.length = 0;
  }
}
