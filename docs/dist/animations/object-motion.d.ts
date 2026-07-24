import type { AnimationFrame, AnimationLabel, SpinnerAnimation } from "../animation.js";
import { type Backend, type Mesh, type Transparency } from "../engines/little-3d-engine/little-3d-engine.js";
import type { MotionController } from "../motion/controller.js";
import { type ObjectMotionTransitionConfig } from "../motion/transitions.js";
/** Which local axis the object's nose points down, used to correct a model that moves backwards or sideways. */
export type Facing = "+x" | "-x" | "+y" | "-y" | "+z" | "-z";
/** Trailing copies that chase the lead object in single file. */
export interface ObjectMotionTail {
    /** Number of trailing copies. */
    count: number;
    /** Time each copy lags the one ahead of it, in milliseconds. */
    gapMs: number;
}
/** Extra local-space orientation on top of path following. */
export interface ObjectMotionRotation {
    /** Fixed local-space Euler offset, radians. */
    x?: number;
    y?: number;
    z?: number;
    /** Continuous spin around local X/Y/Z, radians per millisecond. */
    spinX?: number;
    spinY?: number;
    spinZ?: number;
}
export interface ObjectMotionOptions {
    /** Object mesh (an OBJ import or an engine primitive), or a factory returning one. */
    mesh: Mesh | (() => Mesh);
    /** How the object moves: a circle, square, figure-8, wander, or any custom controller. */
    motion: MotionController;
    /** Face color applied to every triangle. Omit to retain the mesh's face colors. */
    color?: string;
    /** Rendering backend. Default `"auto"`: WebGPU, then WebGL, then Canvas 2D. */
    backend?: Backend;
    /** Optional one-sided or two-sided mesh transparency. */
    transparency?: Transparency;
    /** Uniform object size after centering. Default `1`. */
    size?: number;
    /** The object's nose axis. Set this to correct a model that moves backwards or sideways. Default `"+x"`. */
    facing?: Facing;
    /** Additional local-space rotation on top of path orientation. */
    rotation?: ObjectMotionRotation;
    /** Intro transition. Defaults to `enterFromObjectDirection()` (fly in along the path). */
    intro?: ObjectMotionTransitionConfig;
    /** Outro transition. Defaults to `leaveInObjectDirection()` (fly out along the path). */
    outro?: ObjectMotionTransitionConfig;
    /** Trailing copies that chase the lead in single file. Omit for a single object. */
    tail?: ObjectMotionTail;
    /** Overlay label shown in indeterminate mode (no value to show). Hidden if omitted. */
    label?: AnimationLabel;
    /** Fade the label with the intro and outro transitions. Default `true`. */
    fadeLabel?: boolean;
}
/** Centers a mesh at the origin and uniformly scales it to fit within `targetSize`. */
export declare function centerAndScaleMesh(mesh: Mesh, targetSize: number): Mesh;
/**
 * An object that moves along a {@link MotionController}'s path (a circle, a
 * square, a figure-8, a smooth wander, or any custom controller) with its nose
 * following the path tangent. The runner triggers the lifecycle: {@link enter}
 * flies it in along the path, {@link exit} flies it out. Any mesh works (OBJ imports or engine
 * primitives); `facing` corrects a model that points the wrong way, and
 * `rotation` adds local spin or tilt on top of path following.
 */
export declare class ObjectMotionAnimation implements SpinnerAnimation {
    private engine?;
    private label?;
    private readonly handles;
    private readonly banks;
    private readonly headings;
    private readonly mesh;
    private readonly motion;
    private readonly backend?;
    private readonly transparency?;
    private readonly labelContent?;
    private readonly fadeLabel;
    private readonly tailCount;
    private readonly tailGap;
    private readonly intro;
    private readonly outro;
    private readonly rotationOffset;
    private readonly rotationSpin;
    private readonly hasExtraRotation;
    private started;
    private finished;
    private introStart;
    private outroStart;
    private outroPosition;
    private outroVelocity;
    private outroDirection;
    constructor(options: ObjectMotionOptions);
    mount(target: HTMLElement): void;
    enter(now: number): void;
    exit(now: number): void;
    isFinished(): boolean;
    /** Milliseconds the fly-out takes; used to align a following particle trail's outro. */
    get outroDurationMs(): number;
    /**
     * A {@link MotionController} that follows the object's *actual* position, including
     * the intro fly-in and outro fly-out (it falls back to the raw motion path before
     * {@link enter} and once idle). Feed it to a particle layer's `emitter` so the
     * particles trail the object through its transitions instead of the bare path.
     */
    trailEmitter(): MotionController;
    render(now: number, frame: AnimationFrame): void;
    destroy(): void;
    private aheadAt;
    private positionAt;
    private sampleAt;
    private transitionSample;
    private transitionInput;
    private applyTransitionOutput;
}
