import { type Vec3, dot, normalize, scale } from "./math.js";
import { parseColor } from "./geometry.js";

/** Directional light configuration. */
export interface LightOptions {
  /** Direction the light travels. Default points down-forward into the scene. */
  direction: Vec3;
  /** Direct light strength `0..1`. Default `0.85`. */
  intensity: number;
  /** Base illumination on unlit faces `0..1`. Default `0.25`. */
  ambient: number;
}

/** Resolved light values passed to a renderer each frame. */
export interface LightParams {
  /** Unit vector pointing toward the light. */
  toLight: Vec3;
  intensity: number;
  ambient: number;
}

const DEFAULTS: LightOptions = {
  direction: { x: -0.4, y: -0.7, z: -0.6 },
  intensity: 0.85,
  ambient: 0.25,
};

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

/**
 * Flat-shade a face: brighten its base `color` by how directly its `normal`
 * faces the light, floored at the ambient level. Returns an `rgb(...)` string.
 */
export function shadeColor(normal: Vec3, color: string, light: LightParams): string {
  const lambert = Math.max(0, dot(normal, light.toLight));
  const brightness = clamp01(light.ambient + light.intensity * lambert);
  const [r, g, b] = parseColor(color);
  return `rgb(${Math.round(r * brightness)}, ${Math.round(g * brightness)}, ${Math.round(
    b * brightness,
  )})`;
}

/** A single directional light with an ambient term, used for flat shading. */
export class Light {
  readonly options: LightOptions;
  /** Resolved values for renderers. */
  readonly params: LightParams;

  constructor(options?: Partial<LightOptions>) {
    this.options = { ...DEFAULTS, ...options };
    this.params = {
      toLight: normalize(scale(this.options.direction, -1)),
      intensity: this.options.intensity,
      ambient: this.options.ambient,
    };
  }

  /** Convenience wrapper around {@link shadeColor} using this light. */
  shade(normal: Vec3, color: string): string {
    return shadeColor(normal, color, this.params);
  }
}
