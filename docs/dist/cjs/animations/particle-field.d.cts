import type { Vec3 } from "../engines/little-3d-engine/little-3d-engine.cjs";
import type { ParticlesOptions } from "./particles.cjs";
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
export declare const FADE_IN_END = 0.15;
/** Create a {@link ParticleField} from the emission options. */
export declare function particleField(options?: ParticlesOptions): ParticleField;
