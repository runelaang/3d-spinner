import type { AnimationFrame, SpinnerAnimation } from "./animation.js";
import { prepareHost } from "./mount-host.js";

/** One animation layer in a {@link CompositeAnimation}. Later layers render above earlier ones. */
export interface CompositeAnimationLayer {
  readonly animation: SpinnerAnimation;
  readonly zIndex?: number;
}

/** Run multiple animations through one spinner lifecycle in stacked layers. */
export class CompositeAnimation implements SpinnerAnimation {
  private readonly layers: ReadonlyArray<CompositeAnimationLayer>;
  private readonly elements: HTMLElement[] = [];

  constructor(layers: ReadonlyArray<SpinnerAnimation | CompositeAnimationLayer>) {
    this.layers = layers.map((layer) => ("animation" in layer ? layer : { animation: layer }));
  }

  /** Mount every layer in its own stacked element; resolves once all layers can draw. */
  mount(target: HTMLElement): Promise<void> {
    prepareHost(target);
    const mounting: Array<Promise<void>> = [];
    for (const [index, layer] of this.layers.entries()) {
      const element = document.createElement("div");
      element.style.cssText = `position:absolute;inset:0;z-index:${layer.zIndex ?? index}`;
      target.appendChild(element);
      this.elements.push(element);
      mounting.push(Promise.resolve(layer.animation.mount(element)));
    }
    return Promise.all(mounting).then(() => undefined);
  }

  enter(now: number): void {
    for (const layer of this.layers) layer.animation.enter(now);
  }

  exit(now: number): void {
    for (const layer of this.layers) layer.animation.exit(now);
  }

  render(now: number, frame: AnimationFrame): void {
    for (const layer of this.layers) layer.animation.render(now, frame);
  }

  isFinished(): boolean {
    return this.layers.every((layer) => layer.animation.isFinished());
  }

  destroy(): void {
    for (const layer of this.layers) layer.animation.destroy();
    for (const element of this.elements) element.remove();
    this.elements.length = 0;
  }
}
