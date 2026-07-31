import type { SpinnerPlugin, SpinnerPluginState } from "../plugin.js";
import {
  Little3dEngine,
  cube,
  type Backend,
  type MeshHandle,
} from "../engines/little-3d-engine/little-3d-engine.js";

export interface Basic3dCubeOptions {
  /** Rendering backend. Default `"canvas2d"`. */
  backend?: Backend;
}

export class Basic3dCubeSpinner implements SpinnerPlugin {
  private engine?: Little3dEngine;
  private cubeHandle?: MeshHandle;

  constructor(private readonly options: Basic3dCubeOptions = {}) { }

  mount(target: HTMLElement): void {
    const engine = new Little3dEngine({
      backend: this.options.backend,
      camera: { position: { x: 0, y: 0, z: 3.2 } },
    });
    this.cubeHandle = engine.add(cube(1.4, ["#333355", "#333355", "#333355", "#333355", "#333355", "#333355"]));
    this.engine = engine;
    engine.mount(target).catch((error) => {
      target.textContent = error instanceof Error ? error.message : String(error);
    });
  }

  render(now: number, state: SpinnerPluginState): void {
    if (!this.engine || !this.cubeHandle) return;
    const rotation = this.cubeHandle.transform.rotation;
    rotation.y = now * 0.0011;
    rotation.x = now * 0.0007;
    if (state.determinate) {
      this.cubeHandle.transform.position.y = (0.5 - state.progress) * 0.6;
    }
    this.engine.render();
  }

  destroy(): void {
    this.engine?.destroy();
    this.engine = undefined;
    this.cubeHandle = undefined;
  }
}
