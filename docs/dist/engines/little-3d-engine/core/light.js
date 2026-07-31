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
function clamp255(value) {
    return Math.round(Math.min(255, Math.max(0, value)));
}
/**
 * Shade a face and return `0..255` RGB channels.
 *
 * The diffuse term is flat Lambert: the base `color` brightened by how directly
 * `normal` faces the light, floored at the ambient level. When a {@link Surface}
 * supplies a specular material and a `viewDir`, a Blinn-Phong highlight (`Ks`
 * tinted, tightened by `Ns`) is added; an emissive material (`Ke`) is always
 * added on top. With no material this reduces exactly to the previous flat
 * shading.
 */
export function shade(normal, color, light, surface) {
    const lambert = Math.max(0, dot(normal, light.toLight));
    const brightness = clamp01(light.ambient + light.intensity * lambert);
    const [baseR, baseG, baseB] = parseColor(color);
    let r = baseR * brightness;
    let g = baseG * brightness;
    let b = baseB * brightness;
    const material = surface?.material;
    const specular = material?.specular;
    const viewDir = surface?.viewDir;
    if (specular && viewDir && lambert > 0) {
        const half = normalize({
            x: light.toLight.x + viewDir.x,
            y: light.toLight.y + viewDir.y,
            z: light.toLight.z + viewDir.z,
        });
        const shininess = material?.shininess ?? 32;
        const highlight = Math.pow(Math.max(0, dot(normal, half)), shininess) * light.intensity * 255;
        r += highlight * specular[0];
        g += highlight * specular[1];
        b += highlight * specular[2];
    }
    const emissive = material?.emissive;
    if (emissive) {
        r += emissive[0] * 255;
        g += emissive[1] * 255;
        b += emissive[2] * 255;
    }
    return [clamp255(r), clamp255(g), clamp255(b)];
}
/**
 * Shade a face and return an `rgb(...)` string. Thin wrapper over {@link shade};
 * see it for the shading model. Passing no `surface` gives flat Lambert shading.
 */
export function shadeColor(normal, color, light, surface) {
    const [r, g, b] = shade(normal, color, light, surface);
    return `rgb(${r}, ${g}, ${b})`;
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
    shade(normal, color, surface) {
        return shadeColor(normal, color, this.params, surface);
    }
}
