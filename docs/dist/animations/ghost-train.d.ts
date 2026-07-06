import type { AnimationFrame, AnimationLabel, SpinnerAnimation } from "../animation.js";
import { type Backend } from "../engines/little-3d-engine/little-3d-engine.js";
import type { MotionController } from "../motion/controller.js";
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
export declare class GhostTrainAnimation implements SpinnerAnimation {
    private engine?;
    private label?;
    private observer?;
    private readonly cars;
    private readonly appear;
    private readonly headings;
    private readonly motion;
    private readonly size;
    private readonly backend?;
    private readonly labelContent?;
    private readonly fadeLabel;
    private aspect;
    private enterAt;
    private outroAt;
    private carsAtOutro;
    private exitPathTime;
    private exitPoint;
    private exitDir;
    private exitSpeed;
    private lastNow;
    private finished;
    constructor(options?: GhostTrainOptions);
    mount(target: HTMLElement): void;
    enter(now: number): void;
    exit(now: number): void;
    isFinished(): boolean;
    /** Milliseconds the lead car keeps moving into the outro; feed a trail layer's `outroMs`. */
    get outroDurationMs(): number;
    /**
     * A {@link MotionController} following the lead car's actual position, through
     * laps and the accelerating escape. Feed it to a particle layer's `emitter`
     * so the star trail stays behind the train.
     */
    trailEmitter(): MotionController;
    render(now: number, frame: AnimationFrame): void;
    destroy(): void;
    /** Extra path-time every car has accelerated forward by, `now` ms into the outro. */
    private warp;
    /**
     * The single trajectory every car rides, sampled at path-time `p`: the track
     * up to the exit switch point, then a straight escape outward. Because the
     * switch point and direction are shared, all cars follow the exact same path.
     */
    private pathPosition;
}
