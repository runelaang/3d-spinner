import { CompositeAnimation } from "../composite-animation.js";
import { ObjectMotionAnimation } from "../animations/object-motion.js";
import { ParticlesAnimation } from "../animations/particles.js";
import { cube, starTexture } from "../engines/little-3d-engine/little-3d-engine.js";
import { squareMotion } from "../motion/square.js";
import { progressSpinner } from "./spinner.js";
/**
 * A progress story: a translucent train of ice cubes pulls in and runs laps
 * around a tilted square track, shedding a trail of pale stars while progress
 * climbs; at 100% the whole convoy flies off along the track, cars following
 * the lead one by one, and the star trail drains behind them.
 */
export function ghostTrain(options = {}) {
    const motion = options.object?.motion ?? squareMotion({ size: 1.7, periodMs: 6800, tilt: 0.5 });
    const particles = options.particles ?? {};
    // The object defines the primary direction; the particles trail its actual position through
    // the intro/outro fly transitions (not the bare path), so the two layers stay in sync.
    const object = new ObjectMotionAnimation({
        mesh: () => cube(1, ["#bae6fd", "#7dd3fc", "#38bdf8", "#0ea5e9", "#a5f3fc", "#e0f2fe"]),
        motion,
        size: 0.3,
        transparency: { mode: "two-sided", opacity: 0.55 },
        tail: { count: 4, gapMs: 240 },
        backend: options.backend,
        ...options.object,
        label: options.object?.label,
    });
    const trail = new ParticlesAnimation({
        rate: 30,
        lifeMs: 1700,
        size: 0.13,
        speed: 0.07,
        colors: ["#e0f2fe", "#a5f3fc", "#c4b5fd"],
        texture: particles.texture ?? starTexture(),
        emitter: object.trailEmitter(),
        outroMs: object.outroDurationMs,
        seed: 17,
        backend: options.backend,
        ...particles,
        label: options.label ?? particles.label,
        fadeLabel: options.fadeLabel ?? particles.fadeLabel,
    });
    return progressSpinner(new CompositeAnimation([trail, object]), options);
}
