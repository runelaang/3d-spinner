import type { AnimationLabel } from "./animation.cjs";
export interface MountedAnimationLabel {
    readonly container: HTMLDivElement;
    setText(value: string): void;
    setOpacity(value: number): void;
}
export declare function animationLabelOpacity(now: number, enterAt: number, introDurationMs: number, exitAt: number, outroDurationMs: number): number;
/**
 * Overlay a centered label on `target`: plain text (hidden from assistive
 * technology) or the consumer's own element. `setText` only touches the DOM when
 * the text changes, so calling it every frame is cheap.
 */
export declare function mountAnimationLabel(target: HTMLElement, content: AnimationLabel | undefined): MountedAnimationLabel;
