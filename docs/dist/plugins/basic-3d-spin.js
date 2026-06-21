import { Little3dEngine, cube, } from "../engines/little-3d-engine/little-3d-engine.js";
function resolveMesh(shape) {
    if (!shape)
        return cube();
    return typeof shape === "function" ? shape() : shape;
}
function applyColor(mesh, color) {
    if (color === undefined || (Array.isArray(color) && color.length === 0))
        return mesh;
    const pick = Array.isArray(color) ? (i) => color[i % color.length] : () => color;
    return { vertices: mesh.vertices, faces: mesh.faces.map((f, i) => ({ ...f, color: pick(i) })) };
}
/** A spinning, flat-lit 3D shape. Defaults to a cube; any shape and colors work. */
export class Basic3dSpinSpinner {
    constructor(options = {}) {
        this.mesh = applyColor(resolveMesh(options.shape), options.color);
        this.spinX = options.spinX ?? 0.0007;
        this.spinY = options.spinY ?? 0.0011;
        this.backend = options.backend;
    }
    mount(target) {
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
    render(now, state) {
        if (!this.engine || !this.handle)
            return;
        const rotation = this.handle.transform.rotation;
        rotation.x = now * this.spinX;
        rotation.y = now * this.spinY;
        if (state.determinate) {
            this.handle.transform.position.y = (0.5 - state.progress) * 0.6;
        }
        this.engine.render();
    }
    destroy() {
        this.engine?.destroy();
        this.engine = undefined;
        this.handle = undefined;
    }
}
