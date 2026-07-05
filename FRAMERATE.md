# Experimental: frame-rate monitoring and adaptive quality

This branch carries the experimental frame-rate feature set. It is not part of the main
package surface and may change or be dropped entirely.

What lives here:

- `src/frame-rate.ts` - `FrameRateMonitor`, a rolling frames-per-second measurement
  (subpath export `3d-spinner/frame-rate`).
- `Spinner.getFrameRate()` in `src/index.ts` - poll the current FPS of a running spinner.
- `src/plugin.ts` - `SpinnerPlugin` / `SpinnerPluginContext`, the frame-loop hook interface,
  and the `plugins` option on `createSpinner`.
- `src/quality.ts` - `AdjustableQuality` / `AdjustableQualitySetting`, the generic
  runtime-quality-knob interface implemented by `ParticlesAnimation` and aggregated by
  `CompositeAnimation`.
- `src/plugins/adaptive-quality.ts` - the `adaptiveQuality()` plugin: samples FPS once per
  second and fluidly reduces or restores quality settings (particle count today) toward a
  target FPS (subpath export `3d-spinner/plugins/adaptive-quality`).
- Tests: `tests/frame-rate.test.mjs`, `tests/adaptive-quality.test.mjs`, plus quality
  assertions in `tests/composite-animation.test.mjs`.

These features were removed from the `texture` branch to keep the package lean; this branch
preserves them for when they are wanted again.
