/**
 * Frame-rate independent smoothing factor. `perFrame` is the fraction of the
 * remaining distance to cover in one 60 fps frame; the result is the fraction to
 * cover over `deltaMs`, so `current += (target - current) * damp(0.12, deltaMs)`
 * looks the same at 30, 60, or 144 fps.
 */
export declare function damp(perFrame: number, deltaMs: number): number;
