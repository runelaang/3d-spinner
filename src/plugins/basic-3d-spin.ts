import type { SpinnerPlugin, SpinnerPluginState } from "../plugin.js";
import {
  Little3dEngine,
  cube,
  type Backend,
  type Mesh,
  type MeshHandle,
} from "../engines/little-3d-engine/little-3d-engine.js";

export interface Basic3dSpinOptions {
  /** Shape to spin: a mesh, or a factory that returns one. Default: a cube. */
  shape?: Mesh | (() => Mesh);
  /** Face color(s): one color for every face, or an array applied per face. */
  color?: string | string[];
  /** Rotation speed around the X axis, in radians per millisecond. Default `0.0007`. */
  spinX?: number;
  /** Rotation speed around the Y axis, in radians per millisecond. Default `0.0011`. */
  spinY?: number;
  /** Rendering backend. Default `"canvas2d"`. */
  backend?: Backend;
  /**
   * When set, determinate progress drives mesh scale via this callback instead of
   * bobbing on the Y axis. Return the uniform scale to apply (0 = invisible).
   */
  resolveProgressScale?: (progress: number, now: number) => number;
}

function resolveMesh(shape: Basic3dSpinOptions["shape"]): Mesh {
  if (!shape) return cube();
  return typeof shape === "function" ? shape() : shape;
}

function applyColor(mesh: Mesh, color: Basic3dSpinOptions["color"]): Mesh {
  if (color === undefined || (Array.isArray(color) && color.length === 0)) return mesh;
  const pick = Array.isArray(color) ? (i: number) => color[i % color.length] : () => color;
  return { vertices: mesh.vertices, faces: mesh.faces.map((f, i) => ({ ...f, color: pick(i) })) };
}

/** A spinning, flat-lit 3D shape. Defaults to a cube; any shape and colors work. */
export class Basic3dSpinSpinner implements SpinnerPlugin {
  private engine?: Little3dEngine;
  private handle?: MeshHandle;
  private readonly mesh: Mesh;
  private readonly spinX: number;
  private readonly spinY: number;
  private readonly backend?: Backend;
  private readonly resolveProgressScale?: Basic3dSpinOptions["resolveProgressScale"];

  constructor(options: Basic3dSpinOptions = {}) {
    this.mesh = applyColor(resolveMesh(options.shape), options.color);
    this.spinX = options.spinX ?? 0.0007;
    this.spinY = options.spinY ?? 0.0011;
    this.backend = options.backend;
    this.resolveProgressScale = options.resolveProgressScale;
  }

  mount(target: HTMLElement): void {
    const engine = new Little3dEngine({
      backend: this.backend,
      camera: { position: { x: 0, y: 0, z: 2.8 } },
    });
    this.handle = engine.add(this.mesh);
    this.engine = engine;
    engine.mount(target).catch((error) => {
      target.textContent = error instanceof Error ? error.message : String(error);
    });
  }

  render(now: number, state: SpinnerPluginState): void {
    if (!this.engine || !this.handle) return;
    const rotation = this.handle.transform.rotation;
    rotation.x = now * this.spinX;
    rotation.y = now * this.spinY;
    if (state.determinate) {
      if (this.resolveProgressScale) {
        this.handle.transform.scale = this.resolveProgressScale(state.progress, now);
      } else {
        this.handle.transform.position.y = (0.5 - state.progress) * 0.6;
        this.handle.transform.scale = 1;
      }
    }
    this.engine.render();
  }

  destroy(): void {
    this.engine?.destroy();
    this.engine = undefined;
    this.handle = undefined;
  }
}
