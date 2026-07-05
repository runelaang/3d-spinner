import type { AnimationLabel } from "./animation.js";
export interface MountedAnimationLabel {
    readonly container: HTMLDivElement;
    setText(value: string): void;
    setOpacity(value: number): void;
}
export declare function animationLabelOpacity(now: number, enterAt: number, introDurationMs: number, exitAt: number, outroDurationMs: number): number;
export declare function mountAnimationLabel(target: HTMLElement, content: AnimationLabel | undefined): MountedAnimationLabel;
