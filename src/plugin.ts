export interface SpinnerPluginState {
  readonly determinate: boolean;
  readonly progress: number;
  /** Lerped destination; omitted when equal to `progress`. */
  readonly targetProgress?: number;
}

export interface SpinnerPlugin {
  mount(target: HTMLElement): void;
  render(now: number, state: SpinnerPluginState): void;
  destroy(): void;
}
