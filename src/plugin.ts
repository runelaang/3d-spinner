export interface SpinnerPluginState {
  readonly determinate: boolean;
  readonly progress: number;
}

export interface SpinnerPlugin {
  mount(target: HTMLElement): void;
  render(now: number, state: SpinnerPluginState): void;
  destroy(): void;
}
