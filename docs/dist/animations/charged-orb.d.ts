import type { AnimationFrame, SpinnerAnimation } from "../animation.js";
import type { MotionController } from "../motion/controller.js";
import { type Backend } from "../engines/little-3d-engine/little-3d-engine.js";
export interface ChargedOrbOptions {
    /** Milliseconds for one satellite revolution around the center orb. Default `6000`. */
    orbitPeriodMs?: number;
    /** Rendering backend. Default `"canvas2d"`. */
    backend?: Backend;
}
/**
 * A progress story around a charging orb: the translucent-looking center orb
 * pops straight to full size, then every 10% of progress a mini orb pops out
 * of it and joins an evenly spread ring of satellites (the tenth at 100%). At
 * completion the satellites take one extra lap around the center, dive back
 * into the big orb one after another, and the orb pops away. Satellite motion
 * is time-blended per orb, so progress jumps in either direction stay smooth.
 * {@link satelliteEmitter} exposes the satellites to a particle layer, one
 * stream per orb.
 */
export declare class ChargedOrbAnimation implements SpinnerAnimation {
    private engine?;
    private center?;
    private readonly minis;
    private readonly blends;
    private readonly offsets;
    private readonly orbitPeriodMs;
    private readonly backend?;
    private enterAt;
    private exitAt;
    private allOutAt;
    private lastNow;
    private finished;
    constructor(options?: ChargedOrbOptions);
    mount(target: HTMLElement): void;
    enter(now: number): void;
    exit(now: number): void;
    isFinished(): boolean;
    /** Milliseconds after {@link exit} during which the satellites are still flying. */
    get outroEmitMs(): number;
    /**
     * A {@link MotionController} that cycles across the live satellites, one
     * spawn slot per orb, so a particle layer emits one stream per satellite.
     * `spawnGapMs` must match the particle layer's emission gap (`1000 / rate`).
     */
    satelliteEmitter(spawnGapMs: number): MotionController;
    render(now: number, frame: AnimationFrame): void;
    destroy(): void;
    private updateBlends;
    private updateSpread;
    private slotAngle;
    private baseAngleAt;
    private reenterStart;
    private miniSample;
    private centerScale;
}
