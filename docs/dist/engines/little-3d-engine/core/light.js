import { dot, normalize, scale } from "./math.js";
import { parseColor } from "./geometry.js";
const DEFAULTS = {
    direction: { x: -0.4, y: -0.7, z: -0.6 },
    intensity: 0.85,
    ambient: 0.25,
};
function clamp01(value) {
    return Math.min(1, Math.max(0, value));
}
/**
 * Flat-shade a face: brighten its base `color` by how directly its `normal`
 * faces the light, floored at the ambient level. Returns an `rgb(...)` string.
 */
export function shadeColor(normal, color, light) {
    const lambert = Math.max(0, dot(normal, light.toLight));
    const brightness = clamp01(light.ambient + light.intensity * lambert);
    const [r, g, b] = parseColor(color);
    return `rgb(${Math.round(r * brightness)}, ${Math.round(g * brightness)}, ${Math.round(b * brightness)})`;
}
/** A single directional light with an ambient term, used for flat shading. */
export class Light {
    constructor(options) {
        this.options = { ...DEFAULTS, ...options };
        this.params = {
            toLight: normalize(scale(this.options.direction, -1)),
            intensity: this.options.intensity,
            ambient: this.options.ambient,
        };
    }
    /** Convenience wrapper around {@link shadeColor} using this light. */
    shade(normal, color) {
        return shadeColor(normal, color, this.params);
    }
}
