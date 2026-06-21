import type { SpinnerPlugin, SpinnerPluginState } from "../plugin.js";
export declare class ProgressBarSpinner implements SpinnerPlugin {
    private el?;
    mount(target: HTMLElement): void;
    render(_now: number, state: SpinnerPluginState): void;
    destroy(): void;
}
