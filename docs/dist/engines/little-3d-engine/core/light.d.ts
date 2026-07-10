import { type Vec3 } from "./math.js";
import type { Material } from "./mesh.js";
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
 * Per-face surface inputs for {@link shade}/{@link shadeColor} beyond the base
 * color: its MTL {@link Material} and the direction from the face toward the
 * camera. Both are needed for the specular highlight; without them shading
 * falls back to flat Lambert plus any emissive term.
 */
export interface Surface {
    /** MTL-derived specular/shininess/emissive for this face. */
    material?: Material;
    /** Unit vector from the face toward the eye, for the specular highlight. */
    viewDir?: Vec3;
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
export declare function shade(normal: Vec3, color: string, light: LightParams, surface?: Surface): [number, number, number];
/**
 * Shade a face and return an `rgb(...)` string. Thin wrapper over {@link shade};
 * see it for the shading model. Passing no `surface` gives flat Lambert shading.
 */
export declare function shadeColor(normal: Vec3, color: string, light: LightParams, surface?: Surface): string;
/** A single directional light with an ambient term, used for flat shading. */
export declare class Light {
    readonly options: LightOptions;
    /** Resolved values for renderers. */
    readonly params: LightParams;
    constructor(options?: Partial<LightOptions>);
    /** Convenience wrapper around {@link shadeColor} using this light. */
    shade(normal: Vec3, color: string, surface?: Surface): string;
}
