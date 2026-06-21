import type { SpinnerPlugin, SpinnerPluginState } from "../plugin.js";
import type { Backend } from "../engines/little-3d-engine/little-3d-engine.js";
export interface Basic3dCubeOptions {
    /** Rendering backend. Default `"canvas2d"`. */
    backend?: Backend;
}
/** A spinning cube. Thin wrapper around {@link Basic3dSpinSpinner} with default options. */
export declare class Basic3dCubeSpinner implements SpinnerPlugin {
    private readonly spin;
    constructor(options?: Basic3dCubeOptions);
    mount(target: HTMLElement): void;
    render(now: number, state: SpinnerPluginState): void;
    destroy(): void;
}
