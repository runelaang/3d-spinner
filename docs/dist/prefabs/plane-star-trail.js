import { CompositeAnimation } from "../composite-animation.js";
import { ObjectMotionAnimation } from "../animations/object-motion.js";
import { ParticlesAnimation } from "../animations/particles.js";
import { planeMesh, starTexture } from "../engines/little-3d-engine/little-3d-engine.js";
import { figureEightMotion } from "../motion/figure-eight.js";
import { spinner } from "./spinner.js";
/** A small plane looping through a stream of colorful star particles. */
export function planeStarTrail(options = {}) {
    const motion = options.object?.motion ?? figureEightMotion({ size: 0.72, periodMs: 6200 });
    const particles = options.particles ?? {};
    // The object defines the primary direction; the particles trail its actual position through
    // the intro/outro fly transitions (not the bare path), so the two layers stay in sync.
    const object = new ObjectMotionAnimation({
        mesh: planeMesh,
        motion,
        size: 0.48,
        backend: options.backend,
        ...options.object,
        label: options.object?.label,
    });
    const animation = new CompositeAnimation([
        new ParticlesAnimation({
            rate: 34,
            lifeMs: 1900,
            size: 0.16,
            speed: 0.11,
            colors: ["#fde047", "#f472b6", "#7dd3fc"],
            texture: particles.texture ?? starTexture(),
            emitter: object.trailEmitter(),
            outroMs: object.outroDurationMs,
            seed: 11,
            backend: options.backend,
            ...particles,
            label: options.label ?? particles.label ?? "Flying in...",
            fadeLabel: options.fadeLabel ?? particles.fadeLabel,
        }),
        object,
    ]);
    return spinner(animation, options);
}
