import { animationLabelOpacity, mountAnimationLabel, } from "../animation-label.js";
import { Little3dEngine, quad, resolveBackend, cross, normalize, } from "../engines/little-3d-engine/little-3d-engine.js";
const DEFAULT_COLORS = ["#fde047", "#fb923c", "#f472b6", "#60a5fa"];
const FADE_IN_END = 0.15;
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
function positiveFinite(value, name) {
    if (!Number.isFinite(value) || value <= 0) {
        throw new RangeError(`3d-spinner: ${name} must be a finite number greater than zero.`);
    }
    return value;
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
                : 2 * Math.PI * rand01(seed, index, 3)
                    + (2 * rand01(seed, index, 4) - 1) * spin * age;
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
/**
 * A stream of camera-facing billboard particles: a burst, a fountain, drifting
 * embers - shaped by the emission options. Particles fade in, drift under
 * `gravity`, and fade out; the runner triggers the lifecycle: {@link enter}
 * starts emission, {@link exit} stops it and lets the live particles die out
 * as the outro.
 */
export class ParticlesAnimation {
    constructor(options = {}) {
        this.handles = [];
        this.fades = [];
        this.enterAt = Infinity;
        this.exitAt = Infinity;
        this.finished = false;
        this.field = particleField(options);
        this.colors = options.colors ?? DEFAULT_COLORS;
        this.backend = options.backend;
        this.texture = options.texture;
        this.labelContent = options.label;
        this.fadeLabel = options.fadeLabel ?? true;
        this.emitter = options.emitter;
        this.outroMs = Math.max(0, options.outroMs ?? 0);
    }
    mount(target) {
        if (!target.style.position)
            target.style.position = "relative";
        const meshes = this.colors.map((color) => quad(1, [color]));
        const texture = this.texture;
        const backend = texture
            ? async (rendererOptions) => {
                const picked = await resolveBackend(this.backend ?? "auto");
                const renderer = picked === "webgpu"
                    ? new (await import("../engines/little-3d-engine/renderers/webgpu-textured.js")).WebGPUTexturedRenderer(rendererOptions)
                    : picked === "webgl"
                        ? new (await import("../engines/little-3d-engine/renderers/webgl-textured.js")).WebGLTexturedRenderer(rendererOptions)
                        : new (await import("../engines/little-3d-engine/renderers/canvas2d-textured.js")).Canvas2DTexturedRenderer(rendererOptions);
                for (const mesh of meshes)
                    renderer.setTexture(mesh, texture);
                return renderer;
            }
            : this.backend;
        const engine = new Little3dEngine({
            backend,
            camera: { position: { x: 0, y: 0, z: 3 } },
            light: { intensity: 0, ambient: 1 },
        });
        for (let slot = 0; slot < this.field.maxLive; slot++) {
            const fade = { mode: "one-sided", opacity: 0 };
            this.fades.push(fade);
            this.handles.push(engine.add(meshes[slot % meshes.length], { scale: 0, transparency: fade }));
        }
        this.engine = engine;
        engine.mount(target).catch((error) => {
            target.textContent = error instanceof Error ? error.message : String(error);
        });
        this.label = mountAnimationLabel(target, this.labelContent);
        if (this.fadeLabel)
            this.label.setOpacity(0);
    }
    enter(now) {
        if (this.enterAt === Infinity)
            this.enterAt = now;
    }
    exit(now) {
        if (this.exitAt === Infinity)
            this.exitAt = now;
    }
    isFinished() {
        return this.finished;
    }
    render(now, frame) {
        if (!this.engine || !this.label)
            return;
        if (this.exitAt !== Infinity && now >= this.exitAt + this.outroMs + this.field.lifeMs)
            this.finished = true;
        for (const handle of this.handles)
            handle.transform.scale = 0;
        if (this.enterAt !== Infinity) {
            const t = now - this.enterAt;
            const gap = this.field.spawnGapMs;
            let first = Math.max(0, Math.ceil((t - this.field.lifeMs) / gap));
            let last = Math.floor(t / gap);
            if (this.exitAt !== Infinity) {
                last = Math.min(last, Math.floor((this.exitAt - this.enterAt + this.outroMs) / gap));
            }
            first = Math.max(first, last - this.field.maxLive + 1);
            for (let index = first; index <= last; index++) {
                const sample = this.field.sample(index, t);
                if (!sample)
                    continue;
                const slot = index % this.handles.length;
                const transform = this.handles[slot].transform;
                const origin = this.emitter?.positionAt(this.enterAt + index * gap);
                transform.position.x = sample.position.x + (origin?.x ?? 0);
                transform.position.y = sample.position.y + (origin?.y ?? 0);
                transform.position.z = sample.position.z + (origin?.z ?? 0);
                transform.rotation.z = sample.roll;
                transform.scale = sample.size;
                this.fades[slot].opacity = sample.opacity;
            }
        }
        this.label.setText(frame.indeterminate
            ? (typeof this.labelContent === "string" ? this.labelContent : "")
            : `${Math.round(frame.progress * 100)}%`);
        if (this.fadeLabel) {
            this.label.setOpacity(animationLabelOpacity(now, this.enterAt, this.field.lifeMs * FADE_IN_END, this.exitAt, this.field.lifeMs));
        }
        this.engine.render();
    }
    destroy() {
        this.label?.container.remove();
        this.label = undefined;
        this.engine?.destroy();
        this.engine = undefined;
        this.handles.length = 0;
        this.fades.length = 0;
    }
}
