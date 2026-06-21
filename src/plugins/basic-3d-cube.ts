import type { SpinnerPlugin, SpinnerPluginState } from "../plugin.js";
import { ThreeDEngine, cube, type MeshHandle } from "../engines/3dengine.js";

export class Basic3dCubeSpinner implements SpinnerPlugin {
  private engine?: ThreeDEngine;
  private cubeHandle?: MeshHandle;

  mount(target: HTMLElement): void {
    const engine = new ThreeDEngine({ camera: { position: { x: 0, y: 0, z: 3.2 } } });
    engine.mount(target);
    this.cubeHandle = engine.add(cube(1.4));
    this.engine = engine;
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
