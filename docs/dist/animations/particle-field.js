import { cross, normalize } from "../engines/little-3d-engine/core/math.js";
import { positiveFinite } from "../validate.js";
export const FADE_IN_END = 0.15;
const FADE_OUT_START = 0.6;
function rand01(seed, index, salt) {
    let h = (seed ^ Math.imul(index + 1, 0x9e3779b9) ^ Math.imul(salt + 1, 0x85ebca6b)) >>> 0;
    h = Math.imul(h ^ (h >>> 16), 0x45d9f3b);
    h = Math.imul(h ^ (h >>> 16), 0x45d9f3b);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
}
function smoothstep(edge0, edge1, value) {
    const x = Math.max(0, Math.min(1, (value - edge0) / (edge1 - edge0)));
    return x * x * (3 - 2 * x);
}
function emitBasis(direction) {
    const d = normalize(direction);
    const helper = Math.abs(d.y) < 0.99 ? { x: 0, y: 1, z: 0 } : { x: 1, y: 0, z: 0 };
    const right = normalize(cross(helper, d));
    return { d, right, up: cross(d, right) };
}
/** Create a {@link ParticleField} from the emission options. */
export function particleField(options = {}) {
    const rate = positiveFinite(options.rate ?? 20, "rate");
    const lifeMs = positiveFinite(options.lifeMs ?? 1800, "lifeMs");
    const size = options.size ?? 0.16;
    const speed = options.speed ?? 0.6;
    const gravity = options.gravity;
    const spread = options.spread ?? 0.5;
    const peak = Math.max(0, Math.min(1, options.opacity ?? 0.9));
    const spin = options.spin ?? 0.002;
    const alignToMotion = options.alignToMotion ?? false;
    const seed = options.seed ?? 1;
    const basis = options.direction && emitBasis(options.direction);
    const spawnGapMs = 1000 / rate;
    const directionOf = (index) => {
        const u = rand01(seed, index, 0);
        const phi = 2 * Math.PI * rand01(seed, index, 1);
        if (!basis) {
            const z = 2 * u - 1;
            const r = Math.sqrt(Math.max(0, 1 - z * z));
            return { x: r * Math.cos(phi), y: r * Math.sin(phi), z };
        }
        const cos = 1 - u * (1 - Math.cos(spread));
        const sin = Math.sqrt(Math.max(0, 1 - cos * cos));
        const { d, right, up } = basis;
        return {
            x: d.x * cos + (right.x * Math.cos(phi) + up.x * Math.sin(phi)) * sin,
            y: d.y * cos + (right.y * Math.cos(phi) + up.y * Math.sin(phi)) * sin,
            z: d.z * cos + (right.z * Math.cos(phi) + up.z * Math.sin(phi)) * sin,
        };
    };
    return {
        maxLive: Math.ceil((lifeMs * rate) / 1000) + 1,
        spawnGapMs,
        lifeMs,
        sample(index, t) {
            if (index < 0)
                return undefined;
            const age = t - index * spawnGapMs;
            if (age < 0 || age >= lifeMs)
                return undefined;
            const seconds = age / 1000;
            const dir = directionOf(index);
            const particleSpeed = speed * (0.6 + 0.8 * rand01(seed, index, 2));
            const travel = particleSpeed * seconds;
            const pull = gravity ? 0.5 * seconds * seconds : 0;
            const life = age / lifeMs;
            const roll = alignToMotion
                ? Math.atan2(dir.y * particleSpeed + (gravity?.y ?? 0) * seconds, dir.x * particleSpeed + (gravity?.x ?? 0) * seconds)
                : 2 * Math.PI * rand01(seed, index, 3) + (2 * rand01(seed, index, 4) - 1) * spin * age;
            return {
                position: {
                    x: dir.x * travel + (gravity ? gravity.x * pull : 0),
                    y: dir.y * travel + (gravity ? gravity.y * pull : 0),
                    z: dir.z * travel + (gravity ? gravity.z * pull : 0),
                },
                roll,
                size: size * (0.7 + 0.6 * rand01(seed, index, 5)),
                opacity: peak * smoothstep(0, FADE_IN_END, life) * (1 - smoothstep(FADE_OUT_START, 1, life)),
            };
        },
    };
}
