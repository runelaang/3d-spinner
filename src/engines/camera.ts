import {
  type Mat4,
  type Vec3,
  multiply,
  perspective,
  transformAffine,
  translation,
} from "./math.js";

/** Camera configuration. */
export interface CameraOptions {
  /** Eye position. Default `{ x: 0, y: 0, z: 4 }` (looking toward -Z). */
  position: Vec3;
  /** Vertical field of view in radians. Default `~0.96` (55 degrees). */
  fov: number;
  /** Near clip distance. Default `0.1`. */
  near: number;
  /** Far clip distance. Default `100`. */
  far: number;
}

const DEFAULTS: CameraOptions = {
  position: { x: 0, y: 0, z: 4 },
  fov: (55 * Math.PI) / 180,
  near: 0.1,
  far: 100,
};

/** A perspective camera looking down the -Z axis from its `position`. */
export class Camera {
  readonly options: CameraOptions;

  constructor(options?: Partial<CameraOptions>) {
    this.options = { ...DEFAULTS, ...options };
  }

  /** Transform a world-space point into view (camera) space. */
  toView(p: Vec3): Vec3 {
    const { position } = this.options;
    return transformAffine(translation(-position.x, -position.y, -position.z), p);
  }

  /** Combined view-projection matrix for the given viewport aspect ratio. */
  viewProjection(aspect: number): Mat4 {
    const { position, fov, near, far } = this.options;
    const view = translation(-position.x, -position.y, -position.z);
    const projection = perspective(fov, aspect, near, far);
    return multiply(projection, view);
  }

  /** Convert a normalized device coordinate (-1..1) to a pixel position. */
  toScreen(ndc: Vec3, width: number, height: number): { x: number; y: number } {
    return {
      x: (ndc.x * 0.5 + 0.5) * width,
      y: (1 - (ndc.y * 0.5 + 0.5)) * height,
    };
  }
}
