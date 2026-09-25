# Tests

Tests for this package, using Node's built-in test runner (`node:test`) and `assert` - no
external test framework. The unit tests need nothing beyond the package's own build tooling
(TypeScript for the consumer type check); the browser tests drive headless Chromium through the
`playwright` dev dependency. Neither adds a runtime dependency.

They run against the compiled output in `dist/`, i.e. exactly what consumers get from npm.
Tests are excluded from the published package by the `files` field in `package.json`, so they
add nothing to the npm tarball while staying visible in the repository.

## Run

```sh
npm test               # rebuilds dist, then runs every tests/*.test.mjs
npm run test:browser   # rebuilds dist, then runs tests/browser/*.test.mjs in headless Chromium
```

The browser tests need Chromium once: `npx playwright install chromium`.

`pretest` runs the build first, so the tests always check a fresh `dist/`. To run without
rebuilding (dist must already exist):

```sh
node --test tests/*.test.mjs
```

## What is covered

Lifecycle, engine, and pure logic:

- `motion.test.mjs` - the motion controllers (`figureEightMotion`, `circleMotion`,
  `squareMotion`, `wanderMotion`): loop seamlessness, the circle radius invariant, the square
  perimeter bound, the wander in-frame guarantee, seed reproducibility, and `positionAt` purity.
- `transitions.test.mjs` - the object-motion intro/outro transitions: `enterFromObjectDirection`
  lands on the handoff, matches the path velocity when fast, and falls back to `distance` when
  slow; `leaveInObjectDirection` starts at the handoff and flies off.
- `math.test.mjs` - the engine math helpers: matrix identity/inverse, normalize, cross/dot, the
  `Rz` rotation convention, and the Euler round trip (matrix -> Euler -> matrix, gimbal lock
  included).
- `renderer.test.mjs` - opaque/transparent render ordering, opacity defaults/clamping, and the
  two-sided opacity shorthand.
- `mesh.test.mjs` - `centerAndScaleMesh`: origin centering, uniform fit to `targetSize`, and
  input immutability.
- `progress-animation.test.mjs` - every observable progress-animation lifecycle stage, including
  done-label fading and immediate completion when the fade is disabled.
- `spinner-lifecycle.test.mjs` - `createSpinner` mounting, reported and timed completion,
  indeterminate stop, immediate/idempotent destroy, and option validation (`periodMs`,
  `until`, `timeout`) using a fake animation, element, and animation-frame scheduler. A mount
  that throws at once still returns a spinner and rejects `ready`; a throwing `destroy()` still
  removes the progress bar.
- `engine-fallback.test.mjs` - `Little3dEngine` mounting with fake canvases: `"auto"` falls
  back when a backend fails, rejects with every backend's error when none starts, releases a
  partially initialized WebGPU device, refuses a second mount, remounts after destroy, frees
  a mesh's GPU buffers with its last instance, and replaces a renderer whose first resize fails.
- `engine-webgpu.test.mjs` - `Little3dEngine` with a fake WebGPU that starts: a device lost
  after mounting makes `"auto"` switch to the next backend, a pinned backend removes its canvas
  with a warning, and destroying the engine is not mistaken for a loss.
- `obj-loader.test.mjs` / `mtl-material.test.mjs` - OBJ parsing (MTL colors and materials,
  line-numbered errors for malformed vertices and faces).
- `consumer-types.test.mjs` - every `exports` subpath type-checks by package name for ESM and
  CommonJS consumers (`node16`, `nodenext`, `bundler`), with declaration files checked.
- `camera.test.mjs` - cameras never share a position object with each other or the caller.
- `object-motion.test.mjs` - a tail count that is not finite is rejected.
- `composite-animation.test.mjs` - layer composition; a layer whose mount throws rejects the
  composite's mount, and a layer whose `destroy()` throws does not stop the others.
- `geometry`, `light`, `particles`, `grid-assembly`, `animation-label`, `tween` - GPU triangle
  expansion, shading, the particle field, prefab story logic, label fading and accessibility,
  and the tween engine (including its deprecated aliases).

Real rendering, in `tests/browser/spinner.test.mjs` (headless Chromium over a local file
server):

- Canvas 2D and WebGL draw visible pixels; WebGPU too when the browser has an adapter (skipped
  otherwise, as are the WebGL checks on a machine without WebGL2).
- `"auto"` falls back and still draws when WebGPU fails to create a device.
- A textured particle layer on `"auto"` falls back the same way and still draws.
- When no backend can start, `spinner.ready` rejects and the host's own content is untouched.
- `destroy()` during renderer setup leaves only the host's content.
- A host positioned by a CSS class (`position: fixed`) keeps its position and children; a static
  host becomes `relative`.
- 24 mount/destroy cycles on WebGL leave no canvases and no context-limit warnings.
- The hidden progress bar reports the value once, with no live regions, for a prefab that stacks
  two labels.
- `spinner.ready` resolves when the spinner is destroyed while WebGPU never finishes starting,
  for a plain animation and for a composite prefab.
- WebGL keeps a 50% transparent surface at alpha 128 on a clear canvas (checks the pixel value,
  not just that something was drawn).
- `setTexture` replaces a texture that is already on screen (WebGL, and WebGPU when available).
- A plane stopped during its intro keeps its trail emitting until its fly-out ends.
- A lost WebGL context makes `"auto"` switch to Canvas 2D, which draws.

## Not covered, on purpose

- **An installed tarball.** The consumer type check resolves the package by self-reference, not
  from an `npm pack` result installed into a clean project. `files` ships all of `dist/`, the
  same files self-reference resolves, so a separate install test would mostly re-check npm.
