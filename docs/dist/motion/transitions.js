const DEFAULT_DISTANCE = 3.5;
function add(a, b) {
    return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z };
}
function scaleVector(v, factor) {
    return { x: v.x * factor, y: v.y * factor, z: v.z * factor };
}
function vectorLength(v) {
    return Math.hypot(v.x, v.y, v.z);
}
function normalizeVector(v) {
    const length = vectorLength(v);
    if (length < 1e-6)
        return { x: 1, y: 0, z: 0 };
    return scaleVector(v, 1 / length);
}
function resolveDirection(input, fallback) {
    return normalizeVector(fallback ?? input.direction ?? input.velocity ?? { x: 1, y: 0, z: 0 });
}
function easeOutBack(delta) {
    const c = 1.70158;
    const u = delta - 1;
    return 1 + (c + 1) * u * u * u + c * u * u;
}
/**
 * Constant velocity the fly-in/out travels at. When the path supplies a real
 * velocity at the handoff (and the caller has not forced a custom `direction`),
 * we match it exactly so the transition joins the motion with no speed jump.
 * Only when no useful velocity is available do we fall back to covering
 * `distance` over the duration along the resolved direction.
 */
function joinVelocity(input, options, durationMs) {
    const inputSpeed = input.velocity ? vectorLength(input.velocity) : 0;
    if (input.velocity && inputSpeed > 1e-6 && !options.direction) {
        return input.velocity;
    }
    const distance = options.distance ?? DEFAULT_DISTANCE;
    return scaleVector(resolveDirection(input, options.direction), distance / durationMs);
}
export function enterFromObjectDirection(options = {}) {
    return (input) => {
        const durationMs = Math.max(1, input.durationMs);
        const velocity = joinVelocity(input, options, durationMs);
        const remaining = durationMs - input.elapsedMs;
        return { position: add(input.position, scaleVector(velocity, -remaining)) };
    };
}
export function leaveInObjectDirection(options = {}) {
    return (input) => {
        const durationMs = Math.max(1, input.durationMs);
        const velocity = joinVelocity(input, options, durationMs);
        return { position: add(input.position, scaleVector(velocity, input.elapsedMs)) };
    };
}
export function grow() {
    return (input) => ({ size: (input.size ?? 1) * easeOutBack(input.delta) });
}
export function shrink() {
    return (input) => ({ size: (input.size ?? 1) * (1 - input.delta * input.delta) });
}
