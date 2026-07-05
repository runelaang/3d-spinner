import { CompositeAnimation } from "../composite-animation.js";
import { ObjectMotionAnimation } from "../animations/object-motion.js";
import { ParticlesAnimation } from "../animations/particles.js";
import { pyramid, shineTexture } from "../engines/little-3d-engine/little-3d-engine.js";
import { easeInCubic } from "../engines/little-tween-engine/core/tweens.js";
import { circleMotion } from "../motion/circle.js";
import { progressSpinner } from "./spinner.js";
// C1 launch: the handoff velocity coasts to a stop while the vertical climb
// accelerates, so the nose rotates smoothly from the patrol tangent to straight up.
const launchUp = ({ delta, position, velocity, durationMs }) => {
    const coast = durationMs * delta * (1 - 0.5 * delta);
    const climb = 5.5 * easeInCubic(delta);
    return {
        position: {
            x: position.x + (velocity?.x ?? 0) * coast,
            y: position.y + (velocity?.y ?? 0) * coast + climb,
            z: position.z + (velocity?.z ?? 0) * coast,
        },
    };
};
/**
 * A progress story: a silver rocket glides in and patrols a slow loop on a
 * column of embers while progress climbs; at 100% it pitches up and blasts off
 * the top of the view, exhaust trailing behind it.
 */
export function rocketLaunch(options = {}) {
    const motion = options.object?.motion
        ?? circleMotion({ radius: 0.55, periodMs: 7000, tilt: 0.15 });
    const particles = options.particles ?? {};
    const object = new ObjectMotionAnimation({
        mesh: () => pyramid(1, ["#e2e8f0", "#f8fafc", "#cbd5e1", "#94a3b8", "#e2e8f0"]),
        motion,
        size: 0.44,
        facing: "+y",
        outro: { transition: launchUp, durationMs: 1300 },
        backend: options.backend,
        ...options.object,
        label: options.object?.label,
    });
    const exhaust = new ParticlesAnimation({
        rate: 46,
        lifeMs: 1100,
        size: 0.18,
        speed: 0.5,
        direction: { x: 0, y: -1, z: 0 },
        spread: 0.3,
        gravity: { x: 0, y: -0.6, z: 0 },
        colors: ["#fde047", "#fb923c", "#ef4444", "#fef3c7"],
        texture: particles.texture ?? shineTexture(),
        emitter: object.trailEmitter(),
        outroMs: object.outroDurationMs,
        seed: 9,
        backend: options.backend,
        ...particles,
        label: options.label ?? particles.label,
        fadeLabel: options.fadeLabel ?? particles.fadeLabel,
    });
    return progressSpinner(new CompositeAnimation([exhaust, object]), options);
}
