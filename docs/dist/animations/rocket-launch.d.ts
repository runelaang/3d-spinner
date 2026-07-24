import type { AnimationFrame, AnimationLabel, SpinnerAnimation } from "../animation.js";
import { type Backend } from "../engines/little-3d-engine/little-3d-engine.js";
export interface RocketLaunchOptions {
    /** Rendering backend. Default `"auto"`: WebGPU, then WebGL, then Canvas 2D. */
    backend?: Backend;
    /** Overlay label; progress mode shows a percentage. */
    label?: AnimationLabel;
    /** Fade the label with the story's beginning and launch. Default `true`. */
    fadeLabel?: boolean;
}
/**
 * A progress story told by a launch pad. Every 5% of progress a small rocket
 * slides in cartoon-style from the right and lines up left-to-right under the
 * progress text, idling with a thin wisp of smoke. At 100% the whole row blasts
 * off in a loose stagger on columns of fire; partway up three of them suddenly
 * veer 30-50 degrees and streak away. Rocket count follows the reported
 * progress, so scrubbing in either direction stays smooth.
 */
export declare class RocketLaunchAnimation implements SpinnerAnimation {
    private engine?;
    private label?;
    private observer?;
    private readonly backend?;
    private readonly labelContent?;
    private readonly fadeLabel;
    private readonly rockets;
    private readonly smoke;
    private readonly fire;
    private readonly smokeFades;
    private readonly fireFades;
    private readonly blends;
    private readonly groundedAt;
    private readonly turnS;
    private readonly turnDir;
    private readonly turnRoll;
    private readonly stagger;
    private aspect;
    private enterAt;
    private exitAt;
    private launchedAt;
    private lastNow;
    private finished;
    constructor(options?: RocketLaunchOptions);
    mount(target: HTMLElement): void;
    enter(now: number): void;
    exit(now: number): void;
    isFinished(): boolean;
    render(now: number, frame: AnimationFrame): void;
    destroy(): void;
    private updateBlends;
    /** Along-track distance climbed `la` ms after this rocket's own blast-off. */
    private ascentDistance;
    /** Rocket center, nose direction, and roll `la` ms into its climb. */
    private ascentPose;
    private renderAscent;
    private emitFire;
    private emitSmoke;
}
