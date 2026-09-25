import { prepareHost } from "../mount-host.js";
import { animationLabelOpacity, mountAnimationLabel, } from "../animation-label.js";
import { Camera, Little3dEngine, cross, normalize, scale, subtract, } from "../engines/little-3d-engine/little-3d-engine.js";
import { eulerFromRotation, multiply, rotationFromEuler, } from "../engines/little-3d-engine/core/math.js";
import { damp } from "../engines/little-tween-engine/core/damp.js";
import { enterFromObjectDirection, leaveInObjectDirection, } from "../motion/transitions.js";
const WORLD_UP = { x: 0, y: 1, z: 0 };
const DEFAULT_INTRO_MS = 2100;
const DEFAULT_OUTRO_MS = 2100;
const BANK_GAIN = 26;
const BANK_LIMIT = 0.7;
const BANK_SMOOTH = 0.12;
const SAMPLE_MS = 8;
const CAMERA = { position: { x: 0, y: 0, z: 3 } };
// Rotation (proper, winding-preserving) that maps each `facing` axis onto +X.
const FACE_FORWARD = {
    "+x": (v) => v,
    "-x": (v) => ({ x: -v.x, y: v.y, z: -v.z }),
    "+z": (v) => ({ x: v.z, y: v.y, z: -v.x }),
    "-z": (v) => ({ x: -v.z, y: v.y, z: v.x }),
    "+y": (v) => ({ x: v.y, y: -v.x, z: v.z }),
    "-y": (v) => ({ x: -v.y, y: v.x, z: v.z }),
};
function add(a, b) {
    return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z };
}
function resolveMesh(mesh) {
    return typeof mesh === "function" ? mesh() : mesh;
}
function applyColor(mesh, color) {
    if (color === undefined)
        return mesh;
    return { vertices: mesh.vertices, faces: mesh.faces.map((face) => ({ ...face, color })) };
}
function faceForward(mesh, facing) {
    if (facing === "+x")
        return mesh;
    const turn = FACE_FORWARD[facing];
    return { vertices: mesh.vertices.map(turn), faces: mesh.faces };
}
/** Centers a mesh at the origin and uniformly scales it to fit within `targetSize`. */
export function centerAndScaleMesh(mesh, targetSize) {
    let minX = Infinity;
    let minY = Infinity;
    let minZ = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    let maxZ = -Infinity;
    for (const vertex of mesh.vertices) {
        minX = Math.min(minX, vertex.x);
        minY = Math.min(minY, vertex.y);
        minZ = Math.min(minZ, vertex.z);
        maxX = Math.max(maxX, vertex.x);
        maxY = Math.max(maxY, vertex.y);
        maxZ = Math.max(maxZ, vertex.z);
    }
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    const centerZ = (minZ + maxZ) / 2;
    const extent = Math.max(maxX - minX, maxY - minY, maxZ - minZ) || 1;
    const factor = targetSize / extent;
    return {
        vertices: mesh.vertices.map((vertex) => ({
            x: (vertex.x - centerX) * factor,
            y: (vertex.y - centerY) * factor,
            z: (vertex.z - centerZ) * factor,
        })),
        faces: mesh.faces,
    };
}
/**
 * Orientation (engine Euler, Rz*Ry*Rx) that points the nose (+X) along
 * `forward` and keeps `up` upright, rolled by `bank` radians about the nose.
 */
function orientationFor(forward, bank) {
    const fwd = normalize(forward);
    let right = cross(fwd, WORLD_UP);
    if (Math.hypot(right.x, right.y, right.z) < 1e-4)
        right = { x: 0, y: 0, z: 1 };
    right = normalize(right);
    const levelUp = cross(right, fwd);
    const up = add(scale(levelUp, Math.cos(bank)), scale(right, Math.sin(bank)));
    const w = normalize(cross(fwd, up));
    return {
        x: Math.atan2(cross(w, fwd).z, w.z),
        y: Math.asin(Math.max(-1, Math.min(1, -fwd.z))),
        z: Math.atan2(fwd.y, fwd.x),
    };
}
/** Compose path orientation with a local-space offset/spin rotation. */
function combineLocalRotation(path, extra) {
    return eulerFromRotation(multiply(rotationFromEuler(path.x, path.y, path.z), rotationFromEuler(extra.x, extra.y, extra.z)));
}
function clamp01(value) {
    return Math.max(0, Math.min(1, value));
}
function motionVectorAt(motion, t) {
    return scale(subtract(motion.positionAt(t + 1), motion.positionAt(t - 1)), 0.5);
}
function resolveDirection(velocity, fallback) {
    return Math.hypot(velocity.x, velocity.y, velocity.z) > 1e-6 ? normalize(velocity) : fallback;
}
function resolveTransition(config, fallback, durationMs) {
    if (!config)
        return { transition: fallback, durationMs };
    if (typeof config === "function")
        return { transition: config, durationMs };
    return {
        transition: config.transition,
        durationMs: Math.max(0, config.durationMs ?? durationMs),
    };
}
/**
 * An object that moves along a {@link MotionController}'s path (a circle, a
 * square, a figure-8, a smooth wander, or any custom controller) with its nose
 * following the path tangent. The runner triggers the lifecycle: {@link enter}
 * flies it in along the path, {@link exit} flies it out. Any mesh works (OBJ imports or engine
 * primitives); `facing` corrects a model that points the wrong way, and
 * `rotation` adds local spin or tilt on top of path following.
 */
export class ObjectMotionAnimation {
    constructor(options) {
        this.handles = [];
        this.banks = [];
        this.headings = [];
        this.camera = new Camera(CAMERA);
        this.aspect = 1;
        this.started = false;
        this.finished = false;
        this.introStart = 0;
        this.outroStart = Infinity;
        this.outroDelay = 0;
        this.outroPosition = { x: 0, y: 0, z: 0 };
        this.outroVelocity = { x: 0, y: 0, z: 0 };
        this.outroDirection = { x: 1, y: 0, z: 0 };
        const centered = centerAndScaleMesh(resolveMesh(options.mesh), options.size ?? 1);
        const facing = faceForward(centered, options.facing ?? "+x");
        this.mesh = applyColor(facing, options.color);
        this.radius = this.mesh.vertices.reduce((max, v) => Math.max(max, Math.hypot(v.x, v.y, v.z)), 0);
        this.motion = options.motion;
        this.backend = options.backend;
        this.transparency = options.transparency;
        this.labelContent = options.label;
        this.fadeLabel = options.fadeLabel ?? true;
        const tailCount = options.tail?.count ?? 0;
        if (!Number.isFinite(tailCount)) {
            throw new RangeError("3d-spinner: tail.count must be a finite number.");
        }
        this.tailCount = Math.max(0, Math.floor(tailCount));
        this.tailGap = Math.max(0, options.tail?.gapMs ?? 0);
        this.intro = resolveTransition(options.intro, enterFromObjectDirection(), DEFAULT_INTRO_MS);
        this.outro = resolveTransition(options.outro, leaveInObjectDirection(), DEFAULT_OUTRO_MS);
        const rotation = options.rotation;
        this.rotationOffset = { x: rotation?.x ?? 0, y: rotation?.y ?? 0, z: rotation?.z ?? 0 };
        this.rotationSpin = {
            x: rotation?.spinX ?? 0,
            y: rotation?.spinY ?? 0,
            z: rotation?.spinZ ?? 0,
        };
        this.hasExtraRotation =
            this.rotationOffset.x !== 0 ||
                this.rotationOffset.y !== 0 ||
                this.rotationOffset.z !== 0 ||
                this.rotationSpin.x !== 0 ||
                this.rotationSpin.y !== 0 ||
                this.rotationSpin.z !== 0;
    }
    mount(target) {
        prepareHost(target);
        this.target = target;
        const engine = new Little3dEngine({ backend: this.backend, camera: CAMERA });
        for (let i = 0; i <= this.tailCount; i++) {
            this.handles.push(engine.add(this.mesh, { transparency: this.transparency }));
            this.banks.push(0);
            this.headings.push({ x: 1, y: 0, z: 0 });
        }
        this.engine = engine;
        const mounting = engine.mount(target);
        this.label = mountAnimationLabel(target, this.labelContent);
        if (this.fadeLabel)
            this.label.setOpacity(0);
        return mounting;
    }
    enter(now) {
        if (this.started)
            return;
        this.started = true;
        this.introStart = now;
        this.measureAspect();
    }
    /**
     * Begin the fly-out. A stop during the fly-in lets the fly-in finish first,
     * so the fly-out starts from where the object really is on its path.
     */
    exit(now) {
        if (!this.started || this.outroStart !== Infinity)
            return;
        const start = Math.max(now, this.introStart + this.intro.durationMs);
        this.measureAspect();
        this.outroPosition = this.motion.positionAt(start);
        this.outroVelocity = motionVectorAt(this.motion, start);
        this.outroDirection = resolveDirection(this.outroVelocity, this.headings[0]);
        this.outroStart = start;
        this.outroDelay = start - now;
    }
    isFinished() {
        return this.finished;
    }
    /** Milliseconds the fly-out takes; used to align a following particle trail's outro. */
    get outroDurationMs() {
        return this.outro.durationMs;
    }
    /**
     * Milliseconds between {@link exit} and the start of the fly-out: nonzero when
     * stopped during the fly-in, which finishes first. Feed `outroDelayMs +
     * outroDurationMs` to a trailing particle layer's `outroMs` as a function.
     */
    get outroDelayMs() {
        return this.outroDelay;
    }
    /**
     * A {@link MotionController} that follows the object's *actual* position, including
     * the intro fly-in and outro fly-out (it falls back to the raw motion path before
     * {@link enter} and once idle). Feed it to a particle layer's `emitter` so the
     * particles trail the object through its transitions instead of the bare path.
     */
    trailEmitter() {
        return { positionAt: (t) => this.sampleAt(t)?.position ?? this.motion.positionAt(t) };
    }
    render(now, frame) {
        if (!this.engine || !this.label)
            return;
        if (this.outroStart !== Infinity &&
            now >= this.outroStart + this.outro.durationMs + this.tailCount * this.tailGap) {
            this.finished = true;
        }
        const bankStep = damp(BANK_SMOOTH, now - (this.lastRenderAt ?? now - 1000 / 60));
        this.lastRenderAt = now;
        for (let k = 0; k < this.handles.length; k++) {
            const transform = this.handles[k].transform;
            const t = now - k * this.tailGap;
            const sample = this.sampleAt(t);
            if (!sample) {
                transform.scale = 0;
                continue;
            }
            transform.scale = sample.size;
            let euler = sample.orientation;
            if (!euler) {
                const heading = subtract(this.positionAt(t + SAMPLE_MS) ?? sample.position, sample.position);
                if (Math.hypot(heading.x, heading.y, heading.z) > 1e-5) {
                    this.headings[k] = normalize(heading);
                }
                const ahead = this.aheadAt(t) ?? this.headings[k];
                const targetBank = Math.max(-BANK_LIMIT, Math.min(BANK_LIMIT, cross(this.headings[k], ahead).y * BANK_GAIN));
                this.banks[k] += (targetBank - this.banks[k]) * bankStep;
                euler = orientationFor(this.headings[k], this.banks[k]);
            }
            if (this.hasExtraRotation) {
                euler = combineLocalRotation(euler, {
                    x: this.rotationOffset.x + this.rotationSpin.x * t,
                    y: this.rotationOffset.y + this.rotationSpin.y * t,
                    z: this.rotationOffset.z + this.rotationSpin.z * t,
                });
            }
            transform.position.x = sample.position.x;
            transform.position.y = sample.position.y;
            transform.position.z = sample.position.z;
            transform.rotation.x = euler.x;
            transform.rotation.y = euler.y;
            transform.rotation.z = euler.z;
        }
        this.label.setText(frame.indeterminate
            ? typeof this.labelContent === "string"
                ? this.labelContent
                : ""
            : `${Math.round(frame.progress * 100)}%`);
        if (this.fadeLabel) {
            this.label.setOpacity(animationLabelOpacity(now, this.started ? this.introStart : Infinity, this.intro.durationMs, this.outroStart, this.outro.durationMs));
        }
        this.engine.render();
    }
    destroy() {
        this.label?.container.remove();
        this.label = undefined;
        this.engine?.destroy();
        this.engine = undefined;
        this.handles.length = 0;
    }
    aheadAt(t) {
        const next = this.positionAt(t + SAMPLE_MS);
        const afterNext = this.positionAt(t + 2 * SAMPLE_MS);
        if (!next || !afterNext)
            return undefined;
        const ahead = subtract(afterNext, next);
        if (Math.hypot(ahead.x, ahead.y, ahead.z) <= 1e-5)
            return undefined;
        return normalize(ahead);
    }
    positionAt(t) {
        return this.sampleAt(t)?.position;
    }
    sampleAt(t) {
        if (!this.started || t < this.introStart)
            return undefined;
        if (t < this.introStart + this.intro.durationMs) {
            return this.transitionSample("intro", t, this.intro, this.introStart);
        }
        if (this.outroStart !== Infinity) {
            if (t > this.outroStart + this.outro.durationMs)
                return undefined;
            if (t >= this.outroStart)
                return this.transitionSample("outro", t, this.outro, this.outroStart);
        }
        return { position: this.motion.positionAt(t), size: 1 };
    }
    transitionSample(phase, t, transition, start) {
        const elapsedMs = Math.max(0, t - start);
        const delta = transition.durationMs === 0 ? 1 : clamp01(elapsedMs / transition.durationMs);
        const input = this.transitionInput(phase, delta, elapsedMs, transition.durationMs, start);
        const output = transition.transition(input);
        return this.applyTransitionOutput(input, output, phase, t);
    }
    /** Take the viewport shape the fly transitions aim out of; unmeasured stays 1. */
    measureAspect() {
        const width = this.target?.clientWidth ?? 0;
        const height = this.target?.clientHeight ?? 0;
        if (width > 0 && height > 0)
            this.aspect = width / height;
    }
    /** How far the object must travel from `from` along `direction` to be fully out of view. */
    leaveViewFrom(from) {
        const aspect = this.aspect;
        return (direction) => this.camera.distanceToLeaveView(from, direction, this.radius, aspect);
    }
    transitionInput(phase, delta, elapsedMs, durationMs, start) {
        if (phase === "intro") {
            const handoff = start + durationMs;
            const velocity = motionVectorAt(this.motion, handoff);
            const position = this.motion.positionAt(handoff);
            return {
                delta,
                position,
                direction: resolveDirection(velocity, { x: 1, y: 0, z: 0 }),
                velocity,
                size: 1,
                durationMs,
                elapsedMs,
                phase,
                distanceToLeaveView: this.leaveViewFrom(position),
            };
        }
        return {
            delta,
            position: this.outroPosition,
            direction: this.outroDirection,
            velocity: this.outroVelocity,
            size: 1,
            durationMs,
            elapsedMs,
            phase,
            distanceToLeaveView: this.leaveViewFrom(this.outroPosition),
        };
    }
    applyTransitionOutput(input, output, phase, t) {
        return {
            position: output.position ?? (phase === "intro" ? this.motion.positionAt(t) : input.position),
            size: output.size ?? input.size ?? 1,
            orientation: output.orientation,
        };
    }
}
