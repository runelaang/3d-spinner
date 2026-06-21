import type { SpinnerPlugin, SpinnerPluginState } from "../plugin.js";
import { type Backend, type Mesh } from "../engines/little-3d-engine/little-3d-engine.js";
export interface Basic3dSpinOptions {
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
}
/** A spinning, flat-lit 3D shape. Defaults to a cube; any shape and colors work. */
export declare class Basic3dSpinSpinner implements SpinnerPlugin {
    private engine?;
    private handle?;
    private readonly mesh;
    private readonly spinX;
    private readonly spinY;
    private readonly backend?;
    constructor(options?: Basic3dSpinOptions);
    mount(target: HTMLElement): void;
    render(now: number, state: SpinnerPluginState): void;
    destroy(): void;
}
