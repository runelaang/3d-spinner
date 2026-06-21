import type { Vec3 } from "./math.js";

/** A single flat polygon: indices into the mesh `vertices` plus a base color. */
export interface Face {
  /** Vertex indices, wound counter-clockwise when viewed from outside. */
  indices: number[];
  /** Base CSS color, for example `"#3b82f6"`. Shading is applied on top of it. */
  color: string;
}

/** Geometry: a list of vertices and the colored faces that connect them. */
export interface Mesh {
  vertices: Vec3[];
  faces: Face[];
}

/** Position and orientation (Euler radians) applied to a mesh when rendered. */
export interface Transform {
  position: Vec3;
  rotation: Vec3;
}

/** Create a {@link Transform} with sensible defaults (origin, no rotation). */
export function transform(init?: Partial<Transform>): Transform {
  return {
    position: init?.position ?? { x: 0, y: 0, z: 0 },
    rotation: init?.rotation ?? { x: 0, y: 0, z: 0 },
  };
}
