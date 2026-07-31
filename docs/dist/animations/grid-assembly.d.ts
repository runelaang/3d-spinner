import type { AnimationFrame, AnimationLabel, SpinnerAnimation } from "../animation.js";
import { type Backend, type Mesh } from "../engines/little-3d-engine/little-3d-engine.js";
export interface GridAssemblyOptions {
    /** Meshes (or factories) cycled across the 25 shapes. Defaults to a mixed primitive set. */
    meshes?: Array<Mesh | (() => Mesh)>;
    /** Uniform shape size in scene units. Default `0.34`. */
    size?: number;
    /** Gap between neighboring grid cells in scene units. Default `0.12`. */
    gap?: number;
    /** Milliseconds for one full orbit revolution. Default `9000`. */
    orbitPeriodMs?: number;
    /** Milliseconds one shape takes to travel between the orbit and its grid cell. Default `800`. */
    dockMs?: number;
    /** Rendering backend. Default `"canvas2d"`. */
    backend?: Backend;
    /** Overlay label shown in indeterminate mode (progress mode shows a percentage). */
    label?: AnimationLabel;
    /** Fade the label with the story's beginning and end. Default `true`. */
    fadeLabel?: boolean;
}
/**
 * A progress story in three acts: 25 shapes fly in and circle just inside the
 * view edge; as progress climbs they leave the orbit one by one and dock into
 * a 5x5 grid at the center (docked shapes idle with a staggered spin every two
 * seconds); at completion the finished grid holds for a second, then every
 * shape dives into the center while shrinking away and vanishes with a small
 * pop. Docking is driven by time-based blends toward per-shape targets, so a
 * progress jump in either direction stays smooth.
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
    private popFading;
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
