import type { SpinnerPlugin, SpinnerPluginState } from "../plugin.js";
export declare class TestSpinner implements SpinnerPlugin {
    private el?;
    mount(target: HTMLElement): void;
    render(now: number, state: SpinnerPluginState): void;
    destroy(): void;
}
