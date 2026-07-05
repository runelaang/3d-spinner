import { Little3dEngine, icosphere, } from "../engines/little-3d-engine/little-3d-engine.js";
import { easeInCubic, easeInOutCubic, easeInQuad, easeOutBack, easeOutCubic, easeOutQuad, } from "../engines/little-tween-engine/core/tweens.js";
const MINIS = 10;
const CAMERA_Z = 3;
const CENTER_SCALE = 0.76;
const MINI_SCALE = 0.36;
const MINI_TRANSPARENCY = { mode: "two-sided", frontOpacity: 0.68, backOpacity: 0.87 };
const ORBIT_RADIUS = 1.2;
const TILT = 0.8;
const TWO_PI = Math.PI * 2;
const CENTER_POP_MS = 500;
const LAUNCH_MS = 550;
const EXIT_HURRY = 2.5;
const SPREAD_TAU_MS = 250;
const EXTRA_PAUSE_MS = 250;
const EXTRA_SPIN_MS = 1300;
const REENTER_MS = 600;
const REENTER_STAGGER_MS = 45;
const CENTER_POP_OUT_AT = REENTER_MS + (MINIS - 1) * REENTER_STAGGER_MS + 150;
const CENTER_POP_OUT_MS = 420;
const PARKED = { x: 0, y: 0, z: 50 };
const CENTER_COLORS = ["#67e8f9", "#22d3ee", "#0ea5e9", "#38bdf8", "#7dd3fc"];
const MINI_COLORS = [
    ["#e0f2fe", "#bae6fd", "#7dd3fc"],
    ["#c7d2fe", "#a5b4fc", "#818cf8"],
    ["#a5f3fc", "#67e8f9", "#22d3ee"],
];
function clamp01(value) {
    return Math.max(0, Math.min(1, value));
}
/**
 * A progress story around a charging orb: the translucent-looking center orb
 * pops straight to full size, then every 10% of progress a mini orb pops out
 * of it and joins an evenly spread ring of satellites (the tenth at 100%). At
 * completion the satellites take one extra lap around the center, dive back
 * into the big orb one after another, and the orb pops away. Satellite motion
 * is time-blended per orb, so progress jumps in either direction stay smooth.
 * {@link satelliteEmitter} exposes the satellites to a particle layer, one
 * stream per orb.
 */
export class ChargedOrbAnimation {
    constructor(options = {}) {
        this.minis = [];
        this.blends = new Array(MINIS).fill(0);
        this.offsets = new Array(MINIS).fill(0);
        this.enterAt = Infinity;
        this.exitAt = Infinity;
        this.allOutAt = Infinity;
        this.lastNow = 0;
        this.finished = false;
        this.orbitPeriodMs = options.orbitPeriodMs ?? 6000;
        this.backend = options.backend;
    }
    mount(target) {
        if (!target.style.position)
            target.style.position = "relative";
        const engine = new Little3dEngine({
            backend: this.backend,
            camera: { position: { x: 0, y: 0, z: CAMERA_Z } },
        });
        this.center = engine.add(icosphere(1, 2, CENTER_COLORS), { scale: 0 });
        for (let i = 0; i < MINIS; i++) {
            const mesh = icosphere(1, 1, MINI_COLORS[i % MINI_COLORS.length]);
            this.minis.push(engine.add(mesh, { scale: 0, transparency: { ...MINI_TRANSPARENCY } }));
        }
        this.engine = engine;
        engine.mount(target).catch((error) => {
            target.textContent = error instanceof Error ? error.message : String(error);
        });
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
    /** Milliseconds after {@link exit} during which the satellites are still flying. */
    get outroEmitMs() {
        return EXTRA_PAUSE_MS + EXTRA_SPIN_MS + CENTER_POP_OUT_AT;
    }
    /**
     * A {@link MotionController} that cycles across the live satellites, one
     * spawn slot per orb, so a particle layer emits one stream per satellite.
     * `spawnGapMs` must match the particle layer's emission gap (`1000 / rate`).
     */
    satelliteEmitter(spawnGapMs) {
        return {
            positionAt: (t) => {
                const live = [];
                for (let i = 0; i < MINIS; i++) {
                    const sample = this.miniSample(i, t);
                    if (sample)
                        live.push(sample.position);
                }
                if (live.length === 0)
                    return PARKED;
                const slot = Math.abs(Math.floor(t / spawnGapMs)) % live.length;
                return live[slot];
            },
        };
    }
    render(now, frame) {
        if (!this.engine || !this.center)
            return;
        if (this.enterAt === Infinity) {
            this.center.transform.scale = 0;
            for (const mini of this.minis)
                mini.transform.scale = 0;
            this.engine.render();
            return;
        }
        const dt = this.lastNow === 0 ? 16 : Math.min(50, now - this.lastNow);
        this.lastNow = now;
        this.updateBlends(dt, frame.progress, now);
        this.updateSpread(dt);
        const t = now - this.enterAt;
        this.center.transform.scale = this.centerScale(now, t);
        this.center.transform.rotation.x = t * 0.0002;
        this.center.transform.rotation.y = t * 0.0005;
        for (let i = 0; i < MINIS; i++) {
            const transform = this.minis[i].transform;
            const sample = this.miniSample(i, now);
            if (!sample) {
                transform.scale = 0;
                continue;
            }
            transform.position.x = sample.position.x;
            transform.position.y = sample.position.y;
            transform.position.z = sample.position.z;
            transform.scale = sample.scale;
            transform.rotation.y = t * 0.0012;
        }
        this.engine.render();
    }
    destroy() {
        this.engine?.destroy();
        this.engine = undefined;
        this.center = undefined;
        this.minis.length = 0;
    }
    updateBlends(dt, progress, now) {
        const exiting = this.exitAt !== Infinity;
        const want = exiting ? MINIS : Math.min(MINIS, Math.floor(progress * MINIS + 1e-9));
        const rate = (dt / LAUNCH_MS) * (exiting ? EXIT_HURRY : 1);
        for (let i = 0; i < MINIS; i++) {
            const target = i < want ? 1 : 0;
            const blend = this.blends[i];
            if (target > blend && (i === 0 || this.blends[i - 1] >= 0.6)) {
                this.blends[i] = Math.min(1, blend + rate);
                if (blend === 0)
                    this.offsets[i] = this.slotAngle(i);
            }
            else if (target < blend && (i === MINIS - 1 || this.blends[i + 1] <= 0.4)) {
                this.blends[i] = Math.max(0, blend - rate);
            }
        }
        if (exiting && this.allOutAt === Infinity && this.blends.every((blend) => blend >= 1)) {
            this.allOutAt = now;
        }
    }
    updateSpread(dt) {
        const ease = 1 - Math.exp(-dt / SPREAD_TAU_MS);
        for (let i = 0; i < MINIS; i++) {
            if (this.blends[i] <= 0)
                continue;
            this.offsets[i] += (this.slotAngle(i) - this.offsets[i]) * ease;
        }
    }
    slotAngle(index) {
        const launched = Math.max(1, this.blends.filter((blend) => blend > 0).length);
        return (TWO_PI * Math.min(index, launched - 1)) / launched;
    }
    baseAngleAt(t) {
        let angle = (-TWO_PI * (t - this.enterAt)) / this.orbitPeriodMs;
        if (this.allOutAt !== Infinity) {
            const u = clamp01((t - this.allOutAt - EXTRA_PAUSE_MS) / EXTRA_SPIN_MS);
            angle -= TWO_PI * easeInOutCubic(u);
        }
        return angle;
    }
    reenterStart() {
        return this.allOutAt + EXTRA_PAUSE_MS + EXTRA_SPIN_MS;
    }
    miniSample(index, t) {
        const blend = this.blends[index];
        if (blend <= 0)
            return undefined;
        let radial = easeOutCubic(blend);
        let scale = MINI_SCALE * easeOutBack(blend);
        if (this.allOutAt !== Infinity) {
            const start = this.reenterStart() + index * REENTER_STAGGER_MS;
            const pull = easeInCubic(clamp01((t - start) / REENTER_MS));
            if (pull >= 1)
                return undefined;
            radial *= 1 - pull;
            scale *= 1 - pull;
        }
        const angle = this.baseAngleAt(t) + this.offsets[index];
        const flat = Math.sin(angle) * ORBIT_RADIUS * radial;
        return {
            position: {
                x: Math.cos(angle) * ORBIT_RADIUS * radial,
                y: flat * Math.cos(TILT),
                z: flat * Math.sin(TILT),
            },
            scale,
        };
    }
    centerScale(now, t) {
        if (this.allOutAt !== Infinity) {
            const w = clamp01((now - this.reenterStart() - CENTER_POP_OUT_AT) / CENTER_POP_OUT_MS);
            if (w >= 1) {
                this.finished = true;
                return 0;
            }
            if (w > 0) {
                return CENTER_SCALE * (w < 0.35
                    ? 1 + 0.18 * easeOutQuad(w / 0.35)
                    : 1.18 * (1 - easeInQuad((w - 0.35) / 0.65)));
            }
        }
        return CENTER_SCALE * easeOutBack(clamp01(t / CENTER_POP_MS));
    }
}
