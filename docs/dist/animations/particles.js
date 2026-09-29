import { prepareHost } from "../mount-host.js";
import { finite } from "../validate.js";
import { animationLabelOpacity, mountAnimationLabel, } from "../animation-label.js";
import { Little3dEngine, quad, } from "../engines/little-3d-engine/little-3d-engine.js";
import { FADE_IN_END, particleField } from "./particle-field.js";
import { createTexturedRenderer } from "../engines/little-3d-engine/textured-renderer.js";
const DEFAULT_COLORS = ["#fde047", "#fb923c", "#f472b6", "#60a5fa"];
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
        this.colors = [...(options.colors?.length ? options.colors : DEFAULT_COLORS)];
        this.backend = options.backend;
        this.texture = options.texture;
        this.labelContent = options.label;
        this.fadeLabel = options.fadeLabel ?? true;
        this.emitter = options.emitter;
        const outroMs = options.outroMs ?? 0;
        if (typeof outroMs === "number")
            finite(outroMs, "outroMs");
        this.outroMs = () => {
            const value = typeof outroMs === "function" ? outroMs() : outroMs;
            return Number.isFinite(value) ? Math.max(0, value) : 0;
        };
    }
    mount(target) {
        prepareHost(target);
        const meshes = this.colors.map((color) => quad(1, [color]));
        const texture = this.texture;
        const engine = new Little3dEngine({
            backend: this.backend,
            rendererFor: texture
                ? (backend, options) => createTexturedRenderer(backend, options, new Map(meshes.map((mesh) => [mesh, texture])))
                : undefined,
            camera: { position: { x: 0, y: 0, z: 3 } },
            light: { intensity: 0, ambient: 1 },
        });
        for (let slot = 0; slot < this.field.maxLive; slot++) {
            const fade = { mode: "one-sided", opacity: 0 };
            this.fades.push(fade);
            this.handles.push(engine.add(meshes[slot % meshes.length], { scale: 0, transparency: fade }));
        }
        this.engine = engine;
        const mounting = engine.mount(target);
        this.label = mountAnimationLabel(target, this.labelContent);
        if (this.fadeLabel)
            this.label.setOpacity(0);
        return mounting;
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
        const emitEnd = this.exitAt === Infinity ? Infinity : this.exitAt + this.outroMs();
        if (now >= emitEnd + this.field.lifeMs)
            this.finished = true;
        for (const handle of this.handles)
            handle.transform.scale = 0;
        if (this.enterAt !== Infinity) {
            const t = now - this.enterAt;
            const gap = this.field.spawnGapMs;
            let first = Math.max(0, Math.ceil((t - this.field.lifeMs) / gap));
            let last = Math.floor(t / gap);
            if (emitEnd !== Infinity) {
                last = Math.min(last, Math.floor((emitEnd - this.enterAt) / gap));
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
            ? typeof this.labelContent === "string"
                ? this.labelContent
                : ""
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
