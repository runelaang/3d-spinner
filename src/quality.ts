/** A numeric rendering-quality setting that can be adjusted while an animation runs. */
export interface AdjustableQualitySetting {
  /** Stable setting name, such as `"particles"` or `"trails"`. */
  readonly name: string;
  /** Maximum value originally requested by the consumer. */
  readonly requested: number;
  /** Lowest useful value accepted by this setting. */
  readonly minimum: number;
  /** Current effective value. */
  readonly current: number;
  /** Apply a new effective value. Implementations clamp it to their supported range. */
  set(value: number): void;
}

/** Implemented by animations that expose runtime-adjustable quality settings. */
export interface AdjustableQuality {
  getQualitySettings(): ReadonlyArray<AdjustableQualitySetting>;
}

/** Test whether an animation or other object exposes adjustable quality settings. */
export function hasAdjustableQuality(value: unknown): value is AdjustableQuality {
  return typeof value === "object" && value !== null &&
    "getQualitySettings" in value &&
    typeof value.getQualitySettings === "function";
}
