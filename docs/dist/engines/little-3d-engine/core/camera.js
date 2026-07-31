import { multiply, perspective, transformAffine, translation, } from "./math.js";
const DEFAULTS = {
    position: { x: 0, y: 0, z: 4 },
    fov: (55 * Math.PI) / 180,
    near: 0.1,
    far: 100,
};
/** A perspective camera looking down the -Z axis from its `position`. */
export class Camera {
    constructor(options) {
        this.options = { ...DEFAULTS, ...options };
    }
    /** Transform a world-space point into view (camera) space. */
    toView(p) {
        const { position } = this.options;
        return transformAffine(translation(-position.x, -position.y, -position.z), p);
    }
    /** Combined view-projection matrix for the given viewport aspect ratio. */
    viewProjection(aspect) {
        const { position, fov, near, far } = this.options;
        const view = translation(-position.x, -position.y, -position.z);
        const projection = perspective(fov, aspect, near, far);
        return multiply(projection, view);
    }
    /** Convert a normalized device coordinate (-1..1) to a pixel position. */
    toScreen(ndc, width, height) {
        return {
            x: (ndc.x * 0.5 + 0.5) * width,
            y: (1 - (ndc.y * 0.5 + 0.5)) * height,
        };
    }
}
