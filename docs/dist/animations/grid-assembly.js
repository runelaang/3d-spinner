import { animationLabelOpacity, mountAnimationLabel, } from "../animation-label.js";
import { Little3dEngine, cube, tetrahedron, octahedron, pyramid, icosphere, } from "../engines/little-3d-engine/little-3d-engine.js";
import { easeInCubic, easeInOutCubic, easeOutCubic, } from "../engines/little-tween-engine/core/tweens.js";
const GRID = 5;
const COUNT = GRID * GRID;
const CAMERA_Z = 4;
const FOV = (55 * Math.PI) / 180;
const TWO_PI = Math.PI * 2;
const INTRO_MS = 900;
const INTRO_STAGGER_MS = 60;
const GATE_DOCK = 0.35;
const GATE_UNDOCK = 0.65;
const EXIT_HURRY = 2.5;
const SPIN_EVERY_MS = 2000;
const SPIN_MS = 380;
const SPIN_STAGGER_MS = 80;
const HOLD_MS = 1000;
const COLLAPSE_MS = 700;
const POP_MS = 170;
const LABEL_FADE_MS = 600;
const DEFAULT_MESHES = [
    () => cube(1, ["#60a5fa", "#3b82f6", "#2563eb", "#38bdf8", "#0ea5e9", "#1d4ed8"]),
    () => tetrahedron(1, ["#f472b6", "#ec4899", "#db2777", "#f9a8d4"]),
    () => octahedron(1, ["#34d399", "#10b981", "#059669", "#6ee7b7", "#a7f3d0", "#047857", "#4ade80", "#065f46"]),
    () => pyramid(1, ["#fbbf24", "#f59e0b", "#d97706", "#fde68a", "#fcd34d"]),
    () => icosphere(1, 1, ["#a78bfa", "#8b5cf6", "#7c3aed", "#c4b5fd"]),
];
function clamp01(value) {
    return Math.max(0, Math.min(1, value));
}
function smooth01(value) {
    const x = clamp01(value);
    return x * x * (3 - 2 * x);
}
function resolveMesh(mesh) {
    return typeof mesh === "function" ? mesh() : mesh;
}
// Shortest signed representation of an angle, so easing a tumble back to zero
// never unwinds through full revolutions.
function wrapAngle(angle) {
    const wrapped = angle - TWO_PI * Math.floor(angle / TWO_PI);
    return wrapped > Math.PI ? wrapped - TWO_PI : wrapped;
}
function hash01(index, salt) {
    let h = (Math.imul(index + 1, 0x9e3779b9) ^ Math.imul(salt + 1, 0x85ebca6b)) >>> 0;
    h = Math.imul(h ^ (h >>> 16), 0x45d9f3b);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
}
/**
 * A progress story in three acts: 25 shapes fly in and circle just inside the
 * view edge; as progress climbs they leave the orbit one by one and dock into
 * a 5x5 grid at the center (docked shapes idle with a staggered spin every two
 * seconds); at completion the finished grid holds for a second, then every
 * shape dives into the center while shrinking away and vanishes with a small
 * pop. Docking is driven by time-based blends toward per-shape targets, so a
 * progress jump in either direction stays smooth.
 */
export class GridAssemblyAnimation {
    constructor(options = {}) {
        this.handles = [];
        this.blends = new Array(COUNT).fill(0);
        this.dockedAt = new Array(COUNT).fill(Infinity);
        this.tumbleX = [];
        this.tumbleY = [];
        this.fades = [];
        this.slots = [];
        this.aspect = 16 / 9;
        this.enterAt = Infinity;
        this.exitAt = Infinity;
        this.allDockedAt = Infinity;
        this.collapseAt = Infinity;
        this.lastNow = 0;
        this.popFading = false;
        this.finished = false;
        const sources = options.meshes && options.meshes.length > 0 ? options.meshes : DEFAULT_MESHES;
        this.meshes = sources.map(resolveMesh);
        this.size = options.size ?? 0.34;
        this.orbitPeriodMs = options.orbitPeriodMs ?? 9000;
        this.dockMs = options.dockMs ?? 800;
        this.backend = options.backend;
        this.labelContent = options.label;
        this.fadeLabel = options.fadeLabel ?? true;
        const spacing = this.size + (options.gap ?? 0.12);
        for (let i = 0; i < COUNT; i++) {
            const row = Math.floor(i / GRID);
            const col = i % GRID;
            this.slots.push({ x: (col - 2) * spacing, y: (2 - row) * spacing, z: 0 });
            this.tumbleX.push(TWO_PI * hash01(i, 2) - Math.PI);
            this.tumbleY.push(TWO_PI * hash01(i, 4) - Math.PI);
        }
    }
    mount(target) {
        if (!target.style.position)
            target.style.position = "relative";
        const engine = new Little3dEngine({
            backend: this.backend,
            camera: { position: { x: 0, y: 0, z: CAMERA_Z }, fov: FOV },
        });
        for (let i = 0; i < COUNT; i++) {
            this.fades.push({ mode: "one-sided", opacity: 1 });
            this.handles.push(engine.add(this.meshes[i % this.meshes.length], { scale: 0 }));
        }
        this.engine = engine;
        engine.mount(target).catch((error) => {
            target.textContent = error instanceof Error ? error.message : String(error);
        });
        const measure = () => {
            if (target.clientWidth > 0 && target.clientHeight > 0) {
                this.aspect = target.clientWidth / target.clientHeight;
            }
        };
        measure();
        this.observer = new ResizeObserver(measure);
        this.observer.observe(target);
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
        if (this.enterAt === Infinity) {
            for (const handle of this.handles)
                handle.transform.scale = 0;
            this.engine.render();
            return;
        }
        const dt = this.lastNow === 0 ? 16 : Math.min(50, now - this.lastNow);
        this.lastNow = now;
        this.updateBlends(dt, frame.progress, now);
        if (this.exitAt !== Infinity && this.allDockedAt !== Infinity && this.collapseAt === Infinity) {
            this.collapseAt = Math.max(this.exitAt, this.allDockedAt) + HOLD_MS;
        }
        if (now >= this.collapseAt)
            this.renderCollapse(now);
        else
            this.renderStory(now, dt);
        this.label.setText(frame.indeterminate
            ? (typeof this.labelContent === "string" ? this.labelContent : "")
            : `${Math.round(frame.progress * 100)}%`);
        if (this.fadeLabel) {
            this.label.setOpacity(animationLabelOpacity(now, this.enterAt, LABEL_FADE_MS, this.collapseAt, COLLAPSE_MS));
        }
        if (this.collapseAt !== Infinity && now >= this.collapseAt + COLLAPSE_MS + POP_MS) {
            this.finished = true;
        }
        this.engine.render();
    }
    destroy() {
        this.observer?.disconnect();
        this.observer = undefined;
        this.label?.container.remove();
        this.label = undefined;
        this.engine?.destroy();
        this.engine = undefined;
        this.handles.length = 0;
        this.fades.length = 0;
    }
    updateBlends(dt, progress, now) {
        const exiting = this.exitAt !== Infinity;
        const want = exiting ? COUNT : Math.min(COUNT, Math.floor(progress * COUNT + 1e-9));
        const rate = (dt / this.dockMs) * (exiting ? EXIT_HURRY : 1);
        for (let i = 0; i < COUNT; i++) {
            const target = i < want ? 1 : 0;
            const blend = this.blends[i];
            if (target > blend && (i === 0 || this.blends[i - 1] >= GATE_DOCK)) {
                this.blends[i] = Math.min(1, blend + rate);
            }
            else if (target < blend && (i === COUNT - 1 || this.blends[i + 1] <= GATE_UNDOCK)) {
                this.blends[i] = Math.max(0, blend - rate);
            }
            if (this.blends[i] >= 1) {
                if (this.dockedAt[i] === Infinity)
                    this.dockedAt[i] = now;
            }
            else {
                this.dockedAt[i] = Infinity;
            }
        }
        const allDocked = want === COUNT && this.blends.every((blend) => blend >= 1);
        if (allDocked) {
            if (this.allDockedAt === Infinity)
                this.allDockedAt = now;
        }
        else if (!exiting) {
            this.allDockedAt = Infinity;
        }
    }
    renderStory(now, dt) {
        const t = now - this.enterAt;
        const halfHeight = Math.tan(FOV / 2) * CAMERA_Z;
        const halfWidth = halfHeight * this.aspect;
        const radius = Math.max(0.6, Math.min(halfWidth, halfHeight) - this.size * 0.55);
        const spawnFactor = (Math.max(halfWidth, halfHeight) * 1.25 + this.size * 2) / radius;
        for (let i = 0; i < COUNT; i++) {
            const transform = this.handles[i].transform;
            const eased = smooth01(this.blends[i]);
            const introT = clamp01((t - i * INTRO_STAGGER_MS) / INTRO_MS);
            const reach = 1 + (spawnFactor - 1) * (1 - easeOutCubic(introT));
            const angle = Math.PI / 2 - (i / COUNT) * TWO_PI - (t / this.orbitPeriodMs) * TWO_PI;
            const orbitX = Math.cos(angle) * radius * reach;
            const orbitY = Math.sin(angle) * radius * reach;
            const slot = this.slots[i];
            transform.position.x = orbitX + (slot.x - orbitX) * eased;
            transform.position.y = orbitY + (slot.y - orbitY) * eased;
            transform.position.z = 0;
            transform.scale = this.size;
            // The tumble angle only advances while a shape is fully free, so easing it to
            // zero during docking never crosses the +-pi seam and cannot visibly snap.
            if (this.blends[i] === 0) {
                this.tumbleX[i] = wrapAngle(this.tumbleX[i] + (0.0004 + 0.0008 * hash01(i, 1)) * dt);
                this.tumbleY[i] = wrapAngle(this.tumbleY[i] + (0.0006 + 0.001 * hash01(i, 3)) * dt);
            }
            transform.rotation.z = 0;
            if (this.blends[i] >= 1) {
                const phase = (t + i * SPIN_STAGGER_MS) % SPIN_EVERY_MS;
                const spinning = phase < SPIN_MS && now - phase >= this.dockedAt[i];
                transform.rotation.x = 0;
                transform.rotation.y = spinning ? TWO_PI * easeInOutCubic(phase / SPIN_MS) : 0;
            }
            else {
                const free = 1 - eased;
                transform.rotation.x = this.tumbleX[i] * free;
                transform.rotation.y = this.tumbleY[i] * free;
            }
        }
    }
    renderCollapse(now) {
        if (!this.captured) {
            this.captured = this.handles.map((handle) => ({ ...handle.transform.position }));
        }
        const u = clamp01((now - this.collapseAt) / COLLAPSE_MS);
        const pull = easeInCubic(u);
        for (let i = 0; i < COUNT; i++) {
            const transform = this.handles[i].transform;
            const from = this.captured[i];
            transform.position.x = from.x * (1 - pull);
            transform.position.y = from.y * (1 - pull);
            transform.position.z = from.z * (1 - pull);
            transform.scale = this.size * (1 - 0.99 * pull);
        }
        if (u >= 1) {
            if (!this.popFading) {
                this.popFading = true;
                for (let i = 0; i < COUNT; i++)
                    this.handles[i].transparency = this.fades[i];
            }
            const v = clamp01((now - this.collapseAt - COLLAPSE_MS) / POP_MS);
            for (let i = 0; i < COUNT; i++) {
                this.fades[i].opacity = 1 - v;
                this.handles[i].transform.scale =
                    v >= 1 ? 0 : this.size * 0.01 * (1 + 1.6 * Math.sin(Math.PI * v));
            }
        }
    }
}
