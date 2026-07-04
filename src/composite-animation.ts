import type { AnimationFrame, SpinnerAnimation } from "./animation.js";
import { hasAdjustableQuality, type AdjustableQuality, type AdjustableQualitySetting } from "./quality.js";

/** One animation layer in a {@link CompositeAnimation}. Later layers render above earlier ones. */
export interface CompositeAnimationLayer {
  readonly animation: SpinnerAnimation;
  readonly zIndex?: number;
}

/** Run multiple animations through one spinner lifecycle in stacked layers. */
export class CompositeAnimation implements SpinnerAnimation, AdjustableQuality {
  private readonly layers: ReadonlyArray<CompositeAnimationLayer>;
  private readonly elements: HTMLElement[] = [];

  constructor(layers: ReadonlyArray<SpinnerAnimation | CompositeAnimationLayer>) {
    this.layers = layers.map((layer) => "animation" in layer ? layer : { animation: layer });
  }

  mount(target: HTMLElement): void {
    target.style.position = "relative";
    for (const [index, layer] of this.layers.entries()) {
      const element = document.createElement("div");
      element.style.cssText = `position:absolute;inset:0;z-index:${layer.zIndex ?? index}`;
      target.appendChild(element);
      this.elements.push(element);
      layer.animation.mount(element);
    }
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

  getQualitySettings(): ReadonlyArray<AdjustableQualitySetting> {
    return this.layers.flatMap((layer) =>
      hasAdjustableQuality(layer.animation) ? layer.animation.getQualitySettings() : []
    );
  }

  destroy(): void {
    for (const layer of this.layers) layer.animation.destroy();
    for (const element of this.elements) element.remove();
    this.elements.length = 0;
  }
}
