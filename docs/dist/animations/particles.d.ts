import type { AnimationFrame, AnimationLabel, SpinnerAnimation } from "../animation.js";
import type { MotionController } from "../motion/controller.js";
import { type Backend, type Vec3 } from "../engines/little-3d-engine/little-3d-engine.js";
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
     * the loop left off.
     */
    outroMs?: number;
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
/** Create a {@link ParticleField} from the emission options. */
export declare function particleField(options?: ParticlesOptions): ParticleField;
/**
 * A stream of camera-facing billboard particles: a burst, a fountain, drifting
 * embers - shaped by the emission options. Particles fade in, drift under
 * `gravity`, and fade out; the runner triggers the lifecycle: {@link enter}
 * starts emission, {@link exit} stops it and lets the live particles die out
 * as the outro.
 */
export declare class ParticlesAnimation implements SpinnerAnimation {
    private engine?;
    private label?;
    private readonly handles;
    private readonly fades;
    private readonly field;
    private readonly colors;
    private readonly backend?;
    private readonly texture?;
    private readonly labelContent?;
    private readonly fadeLabel;
    private readonly emitter?;
    private readonly outroMs;
    private enterAt;
    private exitAt;
    private finished;
    constructor(options?: ParticlesOptions);
    mount(target: HTMLElement): void;
    enter(now: number): void;
    exit(now: number): void;
    isFinished(): boolean;
    render(now: number, frame: AnimationFrame): void;
    destroy(): void;
}
