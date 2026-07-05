import { CompositeAnimation } from "../composite-animation.js";
import { ParticlesAnimation } from "../animations/particles.js";
import { ChargedOrbAnimation } from "../animations/charged-orb.js";
import { shineTexture } from "../engines/little-3d-engine/little-3d-engine.js";
import { progressSpinner } from "./spinner.js";
/**
 * A progress story: the center orb pops straight to full size, and every 10%
 * of progress a mini orb pops out of it into an evenly spread satellite ring,
 * each satellite trailing its own spark stream; at 100% the satellites take
 * one extra lap, dive back into the big orb, and the orb pops away.
 */
export function chargedOrb(options = {}) {
    const particles = options.particles ?? {};
    const rate = particles.rate ?? 60;
    const orb = new ChargedOrbAnimation({
        backend: options.backend,
        ...options.orb,
    });
    // One spark stream per satellite: the emitter cycles spawn slots across the
    // live mini orbs, so its gap must match the particle layer's emission gap.
    const streams = new ParticlesAnimation({
        rate,
        lifeMs: 1200,
        size: 0.12,
        speed: 0.05,
        colors: ["#ffffff", "#a5f3fc", "#818cf8"],
        texture: particles.texture ?? shineTexture(),
        emitter: orb.satelliteEmitter(1000 / rate),
        outroMs: orb.outroEmitMs,
        seed: 5,
        backend: options.backend,
        ...particles,
        label: options.label ?? particles.label,
        fadeLabel: options.fadeLabel ?? particles.fadeLabel,
    });
    return progressSpinner(new CompositeAnimation([orb, streams]), options);
}
