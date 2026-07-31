import { Little3dEngine, cube, } from "../engines/little-3d-engine/little-3d-engine.js";
import { ProgressAnimation, } from "../progress-animation.js";
const LABEL_STYLE = [
    "position:absolute",
    "inset:0",
    "display:flex",
    "align-items:center",
    "justify-content:center",
    "pointer-events:none",
    "font:600 1.1rem/1.2 system-ui,sans-serif",
    "letter-spacing:0.06em",
    "text-transform:lowercase",
    "color:rgba(255,255,255,0.65)",
    "z-index:1",
].join(";");
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
function applyMaterial(mesh, material) {
    if (!material)
        return mesh;
    return { vertices: mesh.vertices, faces: mesh.faces.map((f) => ({ ...f, material })) };
}
/**
 * A spinning, flat-lit 3D shape (a cube by default). With `progressAnimation`
 * set it pops in/out and its scale tracks progress, with an optional label;
 * otherwise it just spins at a constant size.
 */
export class SpinAnimation {
    constructor(options = {}) {
        this.exited = false;
        this.mesh = applyMaterial(applyColor(resolveMesh(options.shape), options.color), options.material);
        this.spinX = options.spinX ?? 0.0007;
        this.spinY = options.spinY ?? 0.0011;
        this.backend = options.backend;
        this.transparency = options.transparency;
        this.progress = options.progressAnimation
            ? new ProgressAnimation(options.progressAnimation)
            : undefined;
    }
    mount(target) {
        if (!target.style.position)
            target.style.position = "relative";
        const engine = new Little3dEngine({
            backend: this.backend,
            camera: { position: { x: 0, y: 0, z: 2.8 } },
        });
        this.handle = engine.add(this.mesh, { transparency: this.transparency });
        this.engine = engine;
        engine.mount(target).catch((error) => {
            target.textContent = error instanceof Error ? error.message : String(error);
        });
        if (this.progress) {
            const label = document.createElement("div");
            label.style.cssText = LABEL_STYLE;
            label.setAttribute("aria-hidden", "true");
            label.hidden = true;
            target.appendChild(label);
            this.label = label;
        }
    }
    enter(now) {
        this.progress?.enter(now);
    }
    exit(now) {
        this.exited = true;
        this.progress?.exit(now);
    }
    isFinished() {
        return this.progress ? this.progress.isFinished() : this.exited;
    }
    render(now, frame) {
        if (!this.engine || !this.handle)
            return;
        const rotation = this.handle.transform.rotation;
        rotation.x = now * this.spinX;
        rotation.y = now * this.spinY;
        if (this.progress) {
            const visual = this.progress.update(now, frame.progress, frame.targetProgress);
            this.handle.transform.scale = visual.hidden ? 0 : visual.scale;
            this.applyLabel(visual);
        }
        else {
            this.handle.transform.scale = 1;
        }
        this.engine.render();
    }
    destroy() {
        this.label?.remove();
        this.label = undefined;
        this.engine?.destroy();
        this.engine = undefined;
        this.handle = undefined;
    }
    applyLabel(visual) {
        if (!this.label)
            return;
        if (visual.hidden || visual.text == null) {
            this.label.hidden = true;
            this.label.textContent = "";
            return;
        }
        this.label.hidden = false;
        this.label.textContent = visual.text;
        this.label.style.opacity = String(visual.textOpacity);
    }
}
