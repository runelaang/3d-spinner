import type { AnimationFrame, AnimationLabel, SpinnerAnimation } from "../animation.js";
import type { MotionController } from "../motion/controller.js";
import { type Backend, type Vec3 } from "../engines/little-3d-engine/little-3d-engine.js";
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
    mount(target: HTMLElement): Promise<void>;
    enter(now: number): void;
    exit(now: number): void;
    isFinished(): boolean;
    render(now: number, frame: AnimationFrame): void;
    destroy(): void;
}
