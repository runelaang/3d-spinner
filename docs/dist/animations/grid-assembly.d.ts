import type { AnimationFrame, AnimationLabel, SpinnerAnimation } from "../animation.js";
import { type Backend, type Mesh } from "../engines/little-3d-engine/little-3d-engine.js";
export interface GridAssemblyOptions {
    /** Meshes (or factories) cycled across the 25 shapes. Defaults to a single pastel dark-blue cube. */
    meshes?: Array<Mesh | (() => Mesh)>;
    /** Uniform shape size in scene units. Default `0.34`. */
    size?: number;
    /** Gap between neighboring grid cells in scene units. Default `0.12`. */
    gap?: number;
    /** Milliseconds for one full orbit revolution. Default `9000`. */
    orbitPeriodMs?: number;
    /** Milliseconds one shape takes to travel between the orbit and its grid cell. Default `800`. */
    dockMs?: number;
    /** Rendering backend. Default `"auto"`: WebGPU, then WebGL, then Canvas 2D. */
    backend?: Backend;
    /** Overlay label shown in indeterminate mode (progress mode shows a percentage). */
    label?: AnimationLabel;
    /** Fade the label with the story's beginning and end. Default `true`. */
    fadeLabel?: boolean;
}
/**
 * A progress story in three acts: 25 pastel dark-blue cubes fly in and circle
 * just inside the view edge, completing the full ring before any of them move;
 * once the circle is complete they leave the orbit one by one as progress climbs
 * and dock into a 5x5 grid at the center (docked cubes idle with a staggered
 * spin every two seconds); at completion the finished grid holds for a second,
 * then the cubes dive into the center a little staggered, shrinking away and
 * vanishing with a small pop. Docking is driven by time-based blends toward
 * per-shape targets, so a progress jump in either direction stays smooth.
 */
export declare class GridAssemblyAnimation implements SpinnerAnimation {
    private engine?;
    private label?;
    private observer?;
    private readonly handles;
    private readonly blends;
    private readonly dockedAt;
    private readonly tumbleX;
    private readonly tumbleY;
    private readonly collapseDelay;
    private readonly popStarted;
    private maxCollapseDelay;
    private readonly fades;
    private readonly slots;
    private readonly meshes;
    private readonly size;
    private readonly orbitPeriodMs;
    private readonly dockMs;
    private readonly backend?;
    private readonly labelContent?;
    private readonly fadeLabel;
    private aspect;
    private enterAt;
    private exitAt;
    private allDockedAt;
    private collapseAt;
    private captured?;
    private lastNow;
    private finished;
    constructor(options?: GridAssemblyOptions);
    mount(target: HTMLElement): void;
    enter(now: number): void;
    exit(now: number): void;
    isFinished(): boolean;
    render(now: number, frame: AnimationFrame): void;
    destroy(): void;
    private updateBlends;
    private renderStory;
    private renderCollapse;
}
