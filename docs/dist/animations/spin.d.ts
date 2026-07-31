import type { AnimationFrame, SpinnerAnimation } from "../animation.js";
import { type Backend, type Mesh, type Transparency } from "../engines/little-3d-engine/little-3d-engine.js";
import { type ProgressAnimationOptions } from "../progress-animation.js";
export interface SpinAnimationOptions {
    /** Shape to spin: a mesh, or a factory that returns one. Default: a cube. */
    shape?: Mesh | (() => Mesh);
    /** Face color(s): one color for every face, or an array applied per face. */
    color?: string | string[];
    /** Rotation speed around the X axis, in radians per millisecond. Default `0.0007`. */
    spinX?: number;
    /** Rotation speed around the Y axis, in radians per millisecond. Default `0.0011`. */
    spinY?: number;
    /** Rendering backend. Default `"canvas2d"`. */
    backend?: Backend;
    /** Optional one-sided or two-sided mesh transparency. */
    transparency?: Transparency;
    /**
     * Enable the start/end pop and progress-driven scale, with an optional overlay
     * label. Omit to spin at constant size with no progress reaction.
     */
    progressAnimation?: ProgressAnimationOptions;
}
/**
 * A spinning, flat-lit 3D shape (a cube by default). With `progressAnimation`
 * set it pops in/out and its scale tracks progress, with an optional label;
 * otherwise it just spins at a constant size.
 */
export declare class SpinAnimation implements SpinnerAnimation {
    private engine?;
    private handle?;
    private label?;
    private readonly mesh;
    private readonly spinX;
    private readonly spinY;
    private readonly backend?;
    private readonly transparency?;
    private readonly progress?;
    private exited;
    constructor(options?: SpinAnimationOptions);
    mount(target: HTMLElement): void;
    enter(now: number): void;
    exit(now: number): void;
    isFinished(): boolean;
    render(now: number, frame: AnimationFrame): void;
    destroy(): void;
    private applyLabel;
}
