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
/**
 * Distance covered `elapsedMs` into a fly-in/out that starts at `speed` and
 * speeds up evenly so it has covered `offscreen` when `durationMs` ends. There
 * is no speed-up when `speed` already gets that far, so a fast path keeps its
 * constant speed, and starting at exactly `speed` keeps the join smooth.
 */
function travelled(speed, elapsedMs, durationMs, offscreen = 0) {
    const shortfall = offscreen - speed * durationMs;
    const acceleration = shortfall > 0 ? (2 * shortfall) / (durationMs * durationMs) : 0;
    return speed * elapsedMs + 0.5 * acceleration * elapsedMs * elapsedMs;
}
/**
 * Fly in along the path direction and join the path at its own velocity. When
 * the animation reports its view, the fly-in starts fully out of view and
 * slows into the path, so the object never pops into existence on screen.
 */
export function enterFromObjectDirection(options = {}) {
    return (input) => {
        const durationMs = Math.max(1, input.durationMs);
        const velocity = joinVelocity(input, options, durationMs);
        const back = scaleVector(normalizeVector(velocity), -1);
        const offscreen = input.distanceToLeaveView?.(back);
        const remaining = durationMs - input.elapsedMs;
        const distance = travelled(vectorLength(velocity), remaining, durationMs, offscreen);
        return { position: add(input.position, scaleVector(back, distance)) };
    };
}
/**
 * Fly out along the path direction, leaving at the path's own velocity. When
 * the animation reports its view, the fly-out speeds up just enough to be
 * fully out of view when it ends, so the object never vanishes on screen.
 */
export function leaveInObjectDirection(options = {}) {
    return (input) => {
        const durationMs = Math.max(1, input.durationMs);
        const velocity = joinVelocity(input, options, durationMs);
        const direction = normalizeVector(velocity);
        const offscreen = input.distanceToLeaveView?.(direction);
        const distance = travelled(vectorLength(velocity), input.elapsedMs, durationMs, offscreen);
        return { position: add(input.position, scaleVector(direction, distance)) };
    };
}
export function grow() {
    return (input) => ({ size: (input.size ?? 1) * easeOutBack(input.delta) });
}
export function shrink() {
    return (input) => ({ size: (input.size ?? 1) * (1 - input.delta * input.delta) });
}
