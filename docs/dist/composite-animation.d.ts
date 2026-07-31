import type { AnimationFrame, SpinnerAnimation } from "./animation.js";
/** One animation layer in a {@link CompositeAnimation}. Later layers render above earlier ones. */
export interface CompositeAnimationLayer {
    readonly animation: SpinnerAnimation;
    readonly zIndex?: number;
}
/** Run multiple animations through one spinner lifecycle in stacked layers. */
export declare class CompositeAnimation implements SpinnerAnimation {
    private readonly layers;
    private readonly elements;
    constructor(layers: ReadonlyArray<SpinnerAnimation | CompositeAnimationLayer>);
    mount(target: HTMLElement): void;
    enter(now: number): void;
    exit(now: number): void;
    render(now: number, frame: AnimationFrame): void;
    isFinished(): boolean;
    destroy(): void;
}
