import type { Vec3 } from "./math.js";

/**
 * Surface response of a face, derived from Wavefront MTL properties. All fields
 * are optional; a face with no material is flat-shaded from its `color` alone,
 * exactly as before materials existed.
 */
export interface Material {
  /**
   * Ambient reflectivity (`Ka`) as linear `0..1` RGB. Scales the scene ambient
   * fill per channel before it multiplies the face color (`Kd`). Omit or
   * `[1,1,1]` for the full scene ambient (the engine default - not Wavefront's
   * usual `0.2` fallback, which would darken every material that never sets
   * `Ka`). `[0,0,0]` kills the ambient fill so only the directional term remains.
   */
  ambient?: [number, number, number];
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
  /**
   * Dissolve (`d`, or `1 - Tr`) as linear `0..1`. `1` is fully opaque, `0` is
   * fully transparent. Omit or `1` for an opaque face. Combined with instance
   * `transparency` by multiplying the two alphas. Applied on Canvas 2D; WebGL
   * and WebGPU still use instance `transparency` only.
   */
  opacity?: number;
}

/** A single flat polygon: indices into the mesh `vertices` plus a base color. */
export interface Face {
  /**
   * Vertex indices (three or more), wound counter-clockwise when viewed from
   * outside. Typed as a plain array so meshes built from computed arrays still
   * type-check; the OBJ loader validates count and range at the input boundary.
   */
  indices: number[];
  /** Base CSS color, for example `"#3b82f6"`. Shading is applied on top of it. */
  color: string;
  /**
   * Optional surface material (ambient, specular, shininess, emissive, opacity)
   * from an MTL file. When absent the face is flat Lambert-shaded from `color`.
   */
  material?: Material;
}

/** Geometry: a list of vertices and the colored faces that connect them. */
export interface Mesh {
  /**
   * Vertex positions. A mesh is treated as immutable once drawn: GPU backends
   * cache it per object, so build a new `Mesh` to change it.
   */
  vertices: Vec3[];
  faces: Face[];
}

/**
 * Assign one {@link Material} to every face of a mesh, in place, and return it.
 * A no-op when `material` is omitted. Shape builders use this to apply a uniform
 * surface material (ambient, specular, shininess, emissive) across all their faces.
 */
export function attachMaterial(mesh: Mesh, material?: Material): Mesh {
  if (material) {
    for (const face of mesh.faces) face.material = material;
  }
  return mesh;
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
