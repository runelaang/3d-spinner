import type { AnimationFrame, AnimationLabel, SpinnerAnimation } from "../animation.js";
import {
  animationLabelOpacity,
  mountAnimationLabel,
  type MountedAnimationLabel,
} from "../animation-label.js";
import {
  Little3dEngine,
  cube,
  type Backend,
  type Mesh,
  type MeshHandle,
  type OneSidedTransparency,
  type Vec3,
} from "../engines/little-3d-engine/little-3d-engine.js";
import {
  easeInCubic,
  easeInOutCubic,
  easeOutCubic,
} from "../engines/little-tween-engine/core/tweens.js";

export interface GridAssemblyOptions {
  /** Meshes (or factories) cycled across the 25 shapes. Defaults to a single pastel dark-blue cube. */
  meshes?: Array<Mesh | (() => Mesh)>;
  /** Uniform shape size in scene units. Default `0.34`. */
  size?: number;
  /** Gap between neighboring grid cells in scene units. Default `0.12`. */
  gap?: number;
  /** Milliseconds for one full orbit revolution. Default `9000`. */
  orbitPeriodMs?: number;
  /** Milliseconds one shape takes to travel between the orbit and its grid cell. Default `800`. */
  dockMs?: number;
  /** Rendering backend. Default `"canvas2d"`. */
  backend?: Backend;
  /** Overlay label shown in indeterminate mode (progress mode shows a percentage). */
  label?: AnimationLabel;
  /** Fade the label with the story's beginning and end. Default `true`. */
  fadeLabel?: boolean;
}

const GRID = 5;
const COUNT = GRID * GRID;
const CAMERA_Z = 4;
const FOV = (55 * Math.PI) / 180;
const TWO_PI = Math.PI * 2;

const INTRO_MS = 900;
const INTRO_STAGGER_MS = 60;
// The orbit ring is fully formed once the last-staggered shape finishes flying in.
const INTRO_DONE_MS = (COUNT - 1) * INTRO_STAGGER_MS + INTRO_MS;
const GATE_DOCK = 0.35;
const GATE_UNDOCK = 0.65;
const EXIT_HURRY = 2.5;
const SPIN_EVERY_MS = 2000;
const SPIN_MS = 380;
const SPIN_STAGGER_MS = 80;
const HOLD_MS = 1000;
const COLLAPSE_MS = 700;
const COLLAPSE_SPREAD_MS = 500; // shapes leave a little staggered, not all at once
const POP_MS = 170;
const LABEL_FADE_MS = 600;

// Every shape is the same pastel dark-blue cube; the six face tints give it depth.
const CUBE_COLORS = ["#8397c6", "#7186b8", "#6176a8", "#93a6cf", "#556a9c", "#7a8fc0"];
const DEFAULT_MESHES: Array<() => Mesh> = [() => cube(1, CUBE_COLORS)];

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function smooth01(value: number): number {
  const x = clamp01(value);
  return x * x * (3 - 2 * x);
}

function resolveMesh(mesh: Mesh | (() => Mesh)): Mesh {
  return typeof mesh === "function" ? mesh() : mesh;
}

// Shortest signed representation of an angle, so easing a tumble back to zero
// never unwinds through full revolutions.
function wrapAngle(angle: number): number {
  const wrapped = angle - TWO_PI * Math.floor(angle / TWO_PI);
  return wrapped > Math.PI ? wrapped - TWO_PI : wrapped;
}

function hash01(index: number, salt: number): number {
  let h = (Math.imul(index + 1, 0x9e3779b9) ^ Math.imul(salt + 1, 0x85ebca6b)) >>> 0;
  h = Math.imul(h ^ (h >>> 16), 0x45d9f3b);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

/**
 * A progress story in three acts: 25 pastel dark-blue cubes fly in and circle
 * just inside the view edge, completing the full ring before any of them move;
 * once the circle is complete they leave the orbit one by one as progress climbs
 * and dock into a 5x5 grid at the center (docked cubes idle with a staggered
 * spin every two seconds); at completion the finished grid holds for a second,
 * then the cubes dive into the center a little staggered, shrinking away and
 * vanishing with a small pop. Docking is driven by time-based blends toward
 * per-shape targets, so a progress jump in either direction stays smooth.
 */
export class GridAssemblyAnimation implements SpinnerAnimation {
  private engine?: Little3dEngine;
  private label?: MountedAnimationLabel;
  private observer?: ResizeObserver;
  private readonly handles: MeshHandle[] = [];
  private readonly blends: number[] = new Array(COUNT).fill(0);
  private readonly dockedAt: number[] = new Array(COUNT).fill(Infinity);
  private readonly tumbleX: number[] = [];
  private readonly tumbleY: number[] = [];
  private readonly collapseDelay: number[] = [];
  private readonly popStarted: boolean[] = new Array(COUNT).fill(false);
  private maxCollapseDelay = 0;
  private readonly fades: OneSidedTransparency[] = [];
  private readonly slots: Vec3[] = [];
  private readonly meshes: Mesh[];
  private readonly size: number;
  private readonly orbitPeriodMs: number;
  private readonly dockMs: number;
  private readonly backend?: Backend;
  private readonly labelContent?: AnimationLabel;
  private readonly fadeLabel: boolean;

  private aspect = 16 / 9;
  private enterAt = Infinity;
  private exitAt = Infinity;
  private allDockedAt = Infinity;
  private collapseAt = Infinity;
  private captured?: Vec3[];
  private lastNow = 0;
  private finished = false;

  constructor(options: GridAssemblyOptions = {}) {
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
      this.collapseDelay.push(hash01(i, 7) * COLLAPSE_SPREAD_MS);
    }
    this.maxCollapseDelay = Math.max(...this.collapseDelay);
  }

  mount(target: HTMLElement): void {
    if (!target.style.position) target.style.position = "relative";
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
    if (this.fadeLabel) this.label.setOpacity(0);
  }

  enter(now: number): void {
    if (this.enterAt === Infinity) this.enterAt = now;
  }

  exit(now: number): void {
    if (this.exitAt === Infinity) this.exitAt = now;
  }

  isFinished(): boolean {
    return this.finished;
  }

  render(now: number, frame: AnimationFrame): void {
    if (!this.engine || !this.label) return;
    if (this.enterAt === Infinity) {
      for (const handle of this.handles) handle.transform.scale = 0;
      this.engine.render();
      return;
    }

    const dt = this.lastNow === 0 ? 16 : Math.min(50, now - this.lastNow);
    this.lastNow = now;

    this.updateBlends(dt, frame.progress, now);

    if (this.exitAt !== Infinity && this.allDockedAt !== Infinity && this.collapseAt === Infinity) {
      this.collapseAt = Math.max(this.exitAt, this.allDockedAt) + HOLD_MS;
    }

    if (now >= this.collapseAt) this.renderCollapse(now);
    else this.renderStory(now, dt);

    this.label.setText(frame.indeterminate
      ? (typeof this.labelContent === "string" ? this.labelContent : "")
      : `${Math.round(frame.progress * 100)}%`);
    if (this.fadeLabel) {
      this.label.setOpacity(animationLabelOpacity(
        now,
        this.enterAt,
        LABEL_FADE_MS,
        this.collapseAt,
        COLLAPSE_MS,
      ));
    }

    if (this.collapseAt !== Infinity && now >= this.collapseAt + this.maxCollapseDelay + COLLAPSE_MS + POP_MS) {
      this.finished = true;
    }
    this.engine.render();
  }

  destroy(): void {
    this.observer?.disconnect();
    this.observer = undefined;
    this.label?.container.remove();
    this.label = undefined;
    this.engine?.destroy();
    this.engine = undefined;
    this.handles.length = 0;
    this.fades.length = 0;
  }

  private updateBlends(dt: number, progress: number, now: number): void {
    const exiting = this.exitAt !== Infinity;
    // Hold every shape on the orbit until the ring is fully formed: no shape
    // starts diving to its grid cell before the circle is complete.
    const ringComplete = now - this.enterAt >= INTRO_DONE_MS;
    const want = !ringComplete
      ? 0
      : exiting ? COUNT : Math.min(COUNT, Math.floor(progress * COUNT + 1e-9));
    const rate = (dt / this.dockMs) * (exiting ? EXIT_HURRY : 1);

    for (let i = 0; i < COUNT; i++) {
      const target = i < want ? 1 : 0;
      const blend = this.blends[i];
      if (target > blend && (i === 0 || this.blends[i - 1] >= GATE_DOCK)) {
        this.blends[i] = Math.min(1, blend + rate);
      } else if (target < blend && (i === COUNT - 1 || this.blends[i + 1] <= GATE_UNDOCK)) {
        this.blends[i] = Math.max(0, blend - rate);
      }
      if (this.blends[i] >= 1) {
        if (this.dockedAt[i] === Infinity) this.dockedAt[i] = now;
      } else {
        this.dockedAt[i] = Infinity;
      }
    }

    const allDocked = want === COUNT && this.blends.every((blend) => blend >= 1);
    if (allDocked) {
      if (this.allDockedAt === Infinity) this.allDockedAt = now;
    } else if (!exiting) {
      this.allDockedAt = Infinity;
    }
  }

  private renderStory(now: number, dt: number): void {
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
      } else {
        const free = 1 - eased;
        transform.rotation.x = this.tumbleX[i] * free;
        transform.rotation.y = this.tumbleY[i] * free;
      }
    }
  }

  private renderCollapse(now: number): void {
    if (!this.captured) {
      this.captured = this.handles.map((handle) => ({ ...handle.transform.position }));
    }

    // Each shape dives and pops on its own small delay, so the grid empties a
    // little staggered instead of all at once.
    for (let i = 0; i < COUNT; i++) {
      const transform = this.handles[i].transform;
      const from = this.captured[i];
      const local = now - this.collapseAt - this.collapseDelay[i];
      if (local <= 0) {
        transform.position.x = from.x;
        transform.position.y = from.y;
        transform.position.z = from.z;
        transform.scale = this.size;
        continue;
      }
      const pull = easeInCubic(clamp01(local / COLLAPSE_MS));
      transform.position.x = from.x * (1 - pull);
      transform.position.y = from.y * (1 - pull);
      transform.position.z = from.z * (1 - pull);
      transform.scale = this.size * (1 - 0.99 * pull);

      if (local >= COLLAPSE_MS) {
        if (!this.popStarted[i]) {
          this.popStarted[i] = true;
          this.handles[i].transparency = this.fades[i];
        }
        const v = clamp01((local - COLLAPSE_MS) / POP_MS);
        this.fades[i].opacity = 1 - v;
        transform.scale = v >= 1 ? 0 : this.size * 0.01 * (1 + 1.6 * Math.sin(Math.PI * v));
      }
    }
  }
}
