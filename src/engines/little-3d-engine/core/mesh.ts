import type { Vec3 } from "./math.js";

/**
 * Surface response of a face, derived from Wavefront MTL properties. All fields
 * are optional; a face with no material is flat-shaded from its `color` alone,
 * exactly as before materials existed.
 */
export interface Material {
  /**
   * Specular reflectivity (`Ks`) as linear `0..1` RGB. Drives the color and
   * strength of the highlight. Omit or `[0,0,0]` for a matte surface.
   */
  specular?: [number, number, number];
  /**
   * Specular exponent (`Ns`, Wavefront range `0..1000`). Higher is a tighter,
   * glossier highlight; lower is broad and soft. Ignored without `specular`.
   */
  shininess?: number;
  /**
   * Emissive color (`Ke`) as linear `0..1` RGB, added on top of shading so the
   * face appears self-lit. Omit or `[0,0,0]` for no self-illumination.
   */
  emissive?: [number, number, number];
}

/** A single flat polygon: indices into the mesh `vertices` plus a base color. */
export interface Face {
  /** Vertex indices, wound counter-clockwise when viewed from outside. */
  indices: number[];
  /** Base CSS color, for example `"#3b82f6"`. Shading is applied on top of it. */
  color: string;
  /**
   * Optional surface material (specular, shininess, emissive) from an MTL
   * file. When absent the face is flat Lambert-shaded from `color`.
   */
  material?: Material;
}

/** Geometry: a list of vertices and the colored faces that connect them. */
export interface Mesh {
  vertices: Vec3[];
  faces: Face[];
}

/** Draw only outward-facing transparent surfaces. */
export interface OneSidedTransparency {
  mode: "one-sided";
  /** Surface opacity from `0` (invisible) to `1` (opaque). Default `0.35`. */
  opacity?: number;
}

/** Draw back surfaces before front surfaces to suggest a transparent solid. */
export interface TwoSidedTransparency {
  mode: "two-sided";
  /** Front opacity shorthand; back opacity is derived as two-thirds of front. */
  opacity?: number;
  /** Back-surface opacity from `0` to `1`. Default `0.84`. */
  backOpacity?: number;
  /** Front-surface opacity from `0` to `1`. Default `0.56`. */
  frontOpacity?: number;
}

/** Transparency mode for one mesh instance. */
export type Transparency = OneSidedTransparency | TwoSidedTransparency;

/** Position and orientation (Euler radians) applied to a mesh when rendered. */
export interface Transform {
  position: Vec3;
  rotation: Vec3;
  /** Uniform scale multiplier. Default `1`. */
  scale: number;
}

/** Create a {@link Transform} with sensible defaults (origin, no rotation). */
export function transform(init?: Partial<Transform>): Transform {
  return {
    position: init?.position ?? { x: 0, y: 0, z: 0 },
    rotation: init?.rotation ?? { x: 0, y: 0, z: 0 },
    scale: init?.scale ?? 1,
  };
}
