import { type Vec3, dot, normalize, scale } from "./math.js";

/** Directional light configuration. */
export interface LightOptions {
  /** Direction the light travels. Default points down-forward into the scene. */
  direction: Vec3;
  /** Direct light strength `0..1`. Default `0.85`. */
  intensity: number;
  /** Base illumination on unlit faces `0..1`. Default `0.25`. */
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

function parseColor(color: string): [number, number, number] {
  const hex = color.trim().replace("#", "");
  const full =
    hex.length === 3
      ? hex
          .split("")
          .map((c) => c + c)
          .join("")
      : hex;
  const n = parseInt(full, 16);
  return [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff];
}

/** A single directional light with an ambient term, used for flat shading. */
export class Light {
  readonly options: LightOptions;
  private readonly toLight: Vec3;

  constructor(options?: Partial<LightOptions>) {
    this.options = { ...DEFAULTS, ...options };
    this.toLight = normalize(scale(this.options.direction, -1));
  }

  /**
   * Flat-shade a face: brightens its base `color` by how directly its
   * `normal` faces the light, floored at the ambient level.
   *
   * @param normal Unit-length world-space face normal.
   * @param color Base CSS hex color, for example `"#3b82f6"`.
   * @returns An `rgb(...)` string.
   */
  shade(normal: Vec3, color: string): string {
    const lambert = Math.max(0, dot(normal, this.toLight));
    const brightness = clamp01(this.options.ambient + this.options.intensity * lambert);
    const [r, g, b] = parseColor(color);
    return `rgb(${Math.round(r * brightness)}, ${Math.round(g * brightness)}, ${Math.round(
      b * brightness,
    )})`;
  }
}
