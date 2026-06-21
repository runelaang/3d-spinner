import { type Vec3 } from "./math.js";
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
/**
 * Flat-shade a face: brighten its base `color` by how directly its `normal`
 * faces the light, floored at the ambient level. Returns an `rgb(...)` string.
 */
export declare function shadeColor(normal: Vec3, color: string, light: LightParams): string;
/** A single directional light with an ambient term, used for flat shading. */
export declare class Light {
    readonly options: LightOptions;
    /** Resolved values for renderers. */
    readonly params: LightParams;
    constructor(options?: Partial<LightOptions>);
    /** Convenience wrapper around {@link shadeColor} using this light. */
    shade(normal: Vec3, color: string): string;
}
