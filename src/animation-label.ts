import type { AnimationLabel } from "./animation.js";

const LABEL_STYLE = [
  "position:absolute",
  "inset:0",
  "display:flex",
  "align-items:center",
  "justify-content:center",
  "pointer-events:none",
  "font:700 1.6rem/1 system-ui,sans-serif",
  "letter-spacing:0.02em",
  "color:rgba(255,255,255,0.9)",
  "text-shadow:0 1px 10px rgba(0,0,0,0.6)",
  "z-index:1",
].join(";");

export interface MountedAnimationLabel {
  readonly container: HTMLDivElement;
  setText(value: string): void;
}

export function mountAnimationLabel(
  target: HTMLElement,
  content: AnimationLabel | undefined,
): MountedAnimationLabel {
  const container = document.createElement("div");
  container.style.cssText = LABEL_STYLE;
  container.setAttribute("role", "status");
  if (typeof content === "string") container.textContent = content;
  else if (content) {
    content.style.pointerEvents ||= "auto";
    container.appendChild(content);
  }
  target.appendChild(container);
  return {
    container,
    setText(value): void {
      if (typeof content !== "object") container.textContent = value;
    },
  };
}
