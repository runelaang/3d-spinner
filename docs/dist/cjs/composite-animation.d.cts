import type { AnimationFrame, SpinnerAnimation } from "./animation.cjs";
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
    /** Mount every layer in its own stacked element; resolves once all layers can draw. */
    mount(target: HTMLElement): Promise<void>;
    enter(now: number): void;
    exit(now: number): void;
    render(now: number, frame: AnimationFrame): void;
    isFinished(): boolean;
    /** Destroy every layer even if one throws, then rethrow the first error. */
    destroy(): void;
}
