import { ParticlesAnimation } from "../animations/particles.js";
import { shineTexture } from "../engines/little-3d-engine/little-3d-engine.js";
import { spinner } from "./spinner.js";
function pulsingLabel() {
    const label = document.createElement("div");
    label.innerHTML = `<style>
    @keyframes spinner-prefab-pulse { 0%,100% { color:#fff; transform:scale(1); } 50% { color:#93c5fd; transform:scale(1.06); } }
  </style><div style="animation:spinner-prefab-pulse 2.4s ease-in-out infinite;font-size:2rem">Loading the good stuff</div>`;
    return label;
}
/** High-shine particles drifting around a slowly pulsing HTML message. */
export function pulsingStarfield(options = {}) {
    const particles = options.particles ?? {};
    return spinner(new ParticlesAnimation({
        rate: 48,
        lifeMs: 4200,
        size: 0.3,
        speed: 0.34,
        colors: ["#ffffff", "#dbeafe", "#93c5fd", "#c4b5fd"],
        texture: particles.texture ?? shineTexture(),
        seed: 71,
        backend: options.backend,
        ...particles,
        label: options.label ?? particles.label ?? pulsingLabel(),
        fadeLabel: options.fadeLabel ?? particles.fadeLabel,
    }), options);
}
