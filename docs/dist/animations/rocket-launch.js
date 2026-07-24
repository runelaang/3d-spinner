import { animationLabelOpacity, mountAnimationLabel, } from "../animation-label.js";
import { Little3dEngine, pyramid, quad, resolveBackend, } from "../engines/little-3d-engine/little-3d-engine.js";
import { canvasTexture } from "../engines/little-3d-engine/textures/dynamic/canvas-texture.js";
import { easeOutBack } from "../engines/little-tween-engine/core/tweens.js";
const ROCKETS = 20; // one per 5% of progress
const CAMERA_Z = 3;
const FOV = (55 * Math.PI) / 180;
const HALF_HEIGHT = Math.tan(FOV / 2) * CAMERA_Z;
const SIZE = 0.12;
const ROW_Y = -0.5; // the row sits just under the centered progress text
const PARTICLE_Z = 0.3; // in front of the rockets so exhaust and smoke read clearly
const SLIDE_MS = 460; // cartoon slide-in from the right
const SLIDE_GATE = 0.45; // a rocket starts sliding once its left neighbor is this far in
const EXIT_HURRY = 2.5; // at 100% any stragglers rush in before the row can launch
const LAUNCH_SPREAD_MS = 620; // staggered blast-off window at 100%
const ASCENT_G = 5.2; // climb acceleration, scene units per second squared
const FINISH_PAD_MS = 2000; // time after the last blast-off before the scene is done
const TURNERS = 3; // rockets that veer off mid-climb
const TURN_MIN_Y = 0.2;
const TURN_MAX_Y = 0.8; // "about halfway", jittered so no two turn at the same height
const TURN_MIN_DEG = 30;
const TURN_MAX_DEG = 50;
const DEG = Math.PI / 180;
const SMOKE_LIFE_MS = 1400;
const SMOKE_GAP_MS = 320; // low rate: a lazy idle wisp per rocket
const SMOKE_RISE = 0.55;
const SMOKE_SIZE = 0.17;
const SMOKE_PEAK = 0.16; // very transparent
const SMOKE_POOL = 104;
const FIRE_LIFE_MS = 420;
const FIRE_GAP_MS = 55;
const FIRE_ON_MS = 950; // stop the exhaust once the rocket has cleared the view
const FIRE_TRAIL = 0.25; // how fast a puff drifts back off the nozzle
const FIRE_SPREAD = 0.09;
const FIRE_SIZE = 0.15;
const FIRE_PEAK = 0.9;
const FIRE_POOL = 140;
const SMOKE_COLORS = ["#e2e8f0", "#cbd5e1"];
const FIRE_COLORS = ["#fef3c7", "#fde047", "#fb923c", "#ef4444"];
const ROCKET_COLORS = ["#e2e8f0", "#f8fafc", "#cbd5e1", "#94a3b8", "#e2e8f0"];
function clamp01(value) {
    return Math.max(0, Math.min(1, value));
}
function smoothstep(edge0, edge1, value) {
    const x = clamp01((value - edge0) / (edge1 - edge0));
    return x * x * (3 - 2 * x);
}
function hash01(index, salt) {
    let h = (Math.imul(index + 1, 0x9e3779b9) ^ Math.imul(salt + 1, 0x85ebca6b)) >>> 0;
    h = Math.imul(h ^ (h >>> 16), 0x45d9f3b);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
}
/** A soft round puff for tinting: white so the face color sets the hue, alpha falls off radially. */
function puffTexture(coreAlpha, coreStop) {
    return canvasTexture((ctx) => {
        const g = ctx.createRadialGradient(48, 48, 1, 48, 48, 47);
        g.addColorStop(0, `rgba(255,255,255,${coreAlpha})`);
        g.addColorStop(coreStop, `rgba(255,255,255,${coreAlpha * 0.6})`);
        g.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, 96, 96);
    });
}
/**
 * A progress story told by a launch pad. Every 5% of progress a small rocket
 * slides in cartoon-style from the right and lines up left-to-right under the
 * progress text, idling with a thin wisp of smoke. At 100% the whole row blasts
 * off in a loose stagger on columns of fire; partway up three of them suddenly
 * veer 30-50 degrees and streak away. Rocket count follows the reported
 * progress, so scrubbing in either direction stays smooth.
 */
export class RocketLaunchAnimation {
    constructor(options = {}) {
        this.rockets = [];
        this.smoke = [];
        this.fire = [];
        this.smokeFades = [];
        this.fireFades = [];
        this.blends = new Array(ROCKETS).fill(0);
        this.groundedAt = new Array(ROCKETS).fill(Infinity);
        // Per-rocket veer parameters (turnS = Infinity for a rocket that climbs straight).
        this.turnS = new Array(ROCKETS).fill(Infinity);
        this.turnDir = [];
        this.turnRoll = new Array(ROCKETS).fill(0);
        this.stagger = new Array(ROCKETS).fill(0);
        this.aspect = 16 / 9;
        this.enterAt = Infinity;
        this.exitAt = Infinity;
        this.launchedAt = Infinity;
        this.lastNow = 0;
        this.finished = false;
        this.backend = options.backend;
        this.labelContent = options.label;
        this.fadeLabel = options.fadeLabel ?? true;
        for (let i = 0; i < ROCKETS; i++) {
            this.turnDir.push({ x: 0, y: 1 });
            this.stagger[i] = hash01(i, 7) * LAUNCH_SPREAD_MS;
        }
        // Pick the three veering rockets deterministically, then give each its own
        // turn height, angle, and side.
        const order = Array.from({ length: ROCKETS }, (_, i) => i).sort((a, b) => hash01(a, 11) - hash01(b, 11));
        for (const i of order.slice(0, TURNERS)) {
            const height = TURN_MIN_Y + hash01(i, 12) * (TURN_MAX_Y - TURN_MIN_Y);
            const angle = (TURN_MIN_DEG + hash01(i, 13) * (TURN_MAX_DEG - TURN_MIN_DEG)) * DEG;
            const sign = hash01(i, 14) < 0.5 ? -1 : 1;
            this.turnS[i] = height - ROW_Y;
            this.turnDir[i] = { x: sign * Math.sin(angle), y: Math.cos(angle) };
            this.turnRoll[i] = -sign * angle;
        }
    }
    mount(target) {
        if (!target.style.position)
            target.style.position = "relative";
        const smokeMeshes = SMOKE_COLORS.map((color) => quad(1, [color]));
        const fireMeshes = FIRE_COLORS.map((color) => quad(1, [color]));
        const smokeTexture = puffTexture(0.85, 0.5);
        const fireTexture = puffTexture(1, 0.32);
        const backend = async (rendererOptions) => {
            const picked = await resolveBackend(this.backend ?? "auto");
            const renderer = picked === "webgpu"
                ? new (await import("../engines/little-3d-engine/renderers/webgpu-textured.js")).WebGPUTexturedRenderer(rendererOptions)
                : picked === "webgl"
                    ? new (await import("../engines/little-3d-engine/renderers/webgl-textured.js")).WebGLTexturedRenderer(rendererOptions)
                    : new (await import("../engines/little-3d-engine/renderers/canvas2d-textured.js")).Canvas2DTexturedRenderer(rendererOptions);
            for (const mesh of smokeMeshes)
                renderer.setTexture(mesh, smokeTexture);
            for (const mesh of fireMeshes)
                renderer.setTexture(mesh, fireTexture);
            return renderer;
        };
        const engine = new Little3dEngine({
            backend,
            camera: { position: { x: 0, y: 0, z: CAMERA_Z }, fov: FOV },
        });
        // Untextured pyramids render lit through the inner renderer; the textured
        // smoke and fire quads draw over them as billboards.
        const rocketMesh = pyramid(1, ROCKET_COLORS);
        for (let i = 0; i < ROCKETS; i++)
            this.rockets.push(engine.add(rocketMesh, { scale: 0 }));
        for (let s = 0; s < SMOKE_POOL; s++) {
            const fade = { mode: "one-sided", opacity: 0 };
            this.smokeFades.push(fade);
            this.smoke.push(engine.add(smokeMeshes[s % smokeMeshes.length], { scale: 0, transparency: fade }));
        }
        for (let f = 0; f < FIRE_POOL; f++) {
            const fade = { mode: "one-sided", opacity: 0 };
            this.fireFades.push(fade);
            this.fire.push(engine.add(fireMeshes[f % fireMeshes.length], { scale: 0, transparency: fade }));
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
        for (const handle of this.rockets)
            handle.transform.scale = 0;
        for (const fade of this.smokeFades)
            fade.opacity = 0;
        for (const fade of this.fireFades)
            fade.opacity = 0;
        for (const handle of this.smoke)
            handle.transform.scale = 0;
        for (const handle of this.fire)
            handle.transform.scale = 0;
        if (this.enterAt === Infinity) {
            this.engine.render();
            return;
        }
        const dt = this.lastNow === 0 ? 16 : Math.min(50, now - this.lastNow);
        this.lastNow = now;
        // At 100% the runner calls exit(): hurry any stragglers onto the pad, then
        // launch only once the whole row is grounded, so a hard scrub straight to
        // 100% still plays every rocket's slide-in instead of snapping them in.
        const exiting = this.exitAt !== Infinity;
        this.updateBlends(dt, frame.progress, now, exiting);
        if (exiting && this.launchedAt === Infinity && this.blends.every((blend) => blend >= 1)) {
            this.launchedAt = now;
        }
        const launched = this.launchedAt !== Infinity;
        const halfWidth = HALF_HEIGHT * this.aspect;
        const rowHalf = Math.min(halfWidth * 0.8, 1.18);
        const spawnX = halfWidth + 0.6;
        let smokeCursor = 0;
        let fireCursor = 0;
        for (let i = 0; i < ROCKETS; i++) {
            const homeX = -rowHalf + (2 * rowHalf * i) / (ROCKETS - 1);
            const launchAt = launched ? this.launchedAt + this.stagger[i] : Infinity;
            const la = now - launchAt;
            if (launched && la >= 0) {
                this.renderAscent(i, homeX, la, halfWidth);
                fireCursor = this.emitFire(i, homeX, la, fireCursor);
                continue;
            }
            // Grounded: slide in and idle.
            const blend = this.blends[i];
            if (blend <= 0)
                continue;
            const transform = this.rockets[i].transform;
            transform.position.x = spawnX + (homeX - spawnX) * easeOutBack(blend);
            transform.position.y = ROW_Y;
            transform.position.z = 0;
            transform.rotation.x = 0;
            transform.rotation.y = 0;
            transform.rotation.z = 0;
            transform.scale = SIZE * smoothstep(0, 0.6, blend);
            if (this.groundedAt[i] !== Infinity) {
                smokeCursor = this.emitSmoke(i, homeX, now, launchAt, smokeCursor);
            }
        }
        this.label.setText(frame.indeterminate
            ? (typeof this.labelContent === "string" ? this.labelContent : "")
            : `${Math.round(frame.progress * 100)}%`);
        if (this.fadeLabel) {
            this.label.setOpacity(animationLabelOpacity(now, this.enterAt, SLIDE_MS, this.launchedAt, LAUNCH_SPREAD_MS));
        }
        if (launched && now >= this.launchedAt + LAUNCH_SPREAD_MS + FINISH_PAD_MS) {
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
        this.rockets.length = 0;
        this.smoke.length = 0;
        this.fire.length = 0;
        this.smokeFades.length = 0;
        this.fireFades.length = 0;
    }
    updateBlends(dt, progress, now, exiting) {
        // One rocket per 5%; round so the twentieth lands ~97.5% and is grounded
        // before the 100% blast-off, never colliding with it.
        const want = exiting ? ROCKETS : Math.min(ROCKETS, Math.round(progress * ROCKETS));
        const rate = (dt / SLIDE_MS) * (exiting ? EXIT_HURRY : 1);
        for (let i = 0; i < ROCKETS; i++) {
            const target = i < want ? 1 : 0;
            const blend = this.blends[i];
            if (target > blend && (i === 0 || this.blends[i - 1] >= SLIDE_GATE)) {
                this.blends[i] = Math.min(1, blend + rate);
            }
            else if (target < blend && (i === ROCKETS - 1 || this.blends[i + 1] <= 1 - SLIDE_GATE)) {
                this.blends[i] = Math.max(0, blend - rate);
            }
            if (this.blends[i] >= 1) {
                if (this.groundedAt[i] === Infinity)
                    this.groundedAt[i] = now;
            }
            else {
                this.groundedAt[i] = Infinity;
            }
        }
    }
    /** Along-track distance climbed `la` ms after this rocket's own blast-off. */
    ascentDistance(la) {
        const seconds = la / 1000;
        return 0.5 * ASCENT_G * seconds * seconds;
    }
    /** Rocket center, nose direction, and roll `la` ms into its climb. */
    ascentPose(i, homeX, la) {
        const s = this.ascentDistance(la);
        const turnS = this.turnS[i];
        if (s <= turnS) {
            return { pos: { x: homeX, y: ROW_Y + s }, dir: { x: 0, y: 1 }, roll: 0 };
        }
        const post = s - turnS;
        const dir = this.turnDir[i];
        return {
            pos: { x: homeX + dir.x * post, y: ROW_Y + turnS + dir.y * post },
            dir,
            roll: this.turnRoll[i],
        };
    }
    renderAscent(i, homeX, la, halfWidth) {
        const { pos, roll } = this.ascentPose(i, homeX, la);
        if (pos.y > HALF_HEIGHT + 0.4 || Math.abs(pos.x) > halfWidth + 0.4)
            return; // gone
        const transform = this.rockets[i].transform;
        transform.position.x = pos.x;
        transform.position.y = pos.y;
        transform.position.z = 0;
        transform.rotation.x = 0;
        transform.rotation.y = 0;
        transform.rotation.z = roll;
        transform.scale = SIZE;
    }
    emitFire(i, homeX, la, cursor) {
        const gap = FIRE_GAP_MS;
        const last = Math.min(Math.floor(la / gap), Math.floor(FIRE_ON_MS / gap));
        const first = Math.max(0, Math.ceil((la - FIRE_LIFE_MS) / gap));
        for (let n = first; n <= last; n++) {
            if (cursor >= this.fire.length)
                return cursor;
            const emitLa = n * gap;
            const age = la - emitLa;
            if (age < 0 || age >= FIRE_LIFE_MS)
                continue;
            const life = age / FIRE_LIFE_MS;
            const seconds = age / 1000;
            const pose = this.ascentPose(i, homeX, emitLa);
            const back = { x: -pose.dir.x, y: -pose.dir.y };
            const perp = { x: -pose.dir.y, y: pose.dir.x };
            const lat = (hash01(i * 97 + n, 1) - 0.5) * FIRE_SPREAD;
            const baseX = pose.pos.x + back.x * SIZE * 0.5;
            const baseY = pose.pos.y + back.y * SIZE * 0.5;
            const transform = this.fire[cursor].transform;
            transform.position.x = baseX + back.x * FIRE_TRAIL * seconds + perp.x * lat;
            transform.position.y = baseY + back.y * FIRE_TRAIL * seconds + perp.y * lat - 0.12 * seconds * seconds;
            transform.position.z = PARTICLE_Z;
            transform.rotation.z = hash01(i * 97 + n, 2) * Math.PI * 2;
            transform.scale = FIRE_SIZE * (0.7 + 0.5 * hash01(i * 97 + n, 3)) * (1 - 0.55 * life);
            this.fireFades[cursor].opacity =
                FIRE_PEAK * smoothstep(0, 0.15, life) * (1 - smoothstep(0.55, 1, life));
            cursor++;
        }
        return cursor;
    }
    emitSmoke(i, homeX, now, launchAt, cursor) {
        const start = this.groundedAt[i];
        const tr = now - start;
        const gap = SMOKE_GAP_MS;
        // Stop spawning once this rocket is about to launch; live wisps still drift off.
        const emitUntil = Number.isFinite(launchAt) ? launchAt - start : tr;
        const last = Math.min(Math.floor(tr / gap), Math.floor(emitUntil / gap));
        const first = Math.max(0, Math.ceil((tr - SMOKE_LIFE_MS) / gap));
        const baseY = ROW_Y - SIZE * 0.4;
        for (let n = first; n <= last; n++) {
            if (cursor >= this.smoke.length)
                return cursor;
            const age = tr - n * gap;
            if (age < 0 || age >= SMOKE_LIFE_MS)
                continue;
            const life = age / SMOKE_LIFE_MS;
            const drift = (hash01(i * 131 + n, 1) - 0.5) * 0.14;
            const transform = this.smoke[cursor].transform;
            transform.position.x = homeX + drift * life;
            transform.position.y = baseY + SMOKE_RISE * life;
            transform.position.z = PARTICLE_Z;
            transform.rotation.z = hash01(i * 131 + n, 2) * Math.PI * 2;
            transform.scale = SMOKE_SIZE * (0.5 + 0.8 * life) * (0.7 + 0.6 * hash01(i * 131 + n, 3));
            this.smokeFades[cursor].opacity =
                SMOKE_PEAK * smoothstep(0, 0.25, life) * (1 - smoothstep(0.5, 1, life));
            cursor++;
        }
        return cursor;
    }
}
