# Changelog

Notable changes, newest first. Versions before 0.9.26 are described in the git history. Not
every version was published to npm; each one includes all changes of the versions below it.

## 0.9.31

### Changed

- Mesh, particle, and engine background colors must be hex (`#rgb` or `#rrggbb`). Other values
  used to draw as black or a wrong color without notice; now the spinner's `ready` rejects with a
  `RangeError` (a `Little3dEngine` with such a `background` throws when constructed).
- The WebGL and WebGPU textured renderers request texture URLs with CORS, so an image from
  another origin loads when its server allows it. Canvas 2D loads them as before.

### Fixed

- An empty `colors` list on particles or a built-in shape falls back to the default palette
  instead of breaking the render.
- A texture that fails to load or decode logs one console warning and the mesh keeps its plain
  color, instead of an unhandled promise rejection or nothing at all.
- The WebGPU textured renderer frees a replaced texture once the frames that used it are done,
  instead of keeping every replaced texture until the renderer is destroyed.
- Time options that are `NaN` or infinite throw a `RangeError` when the animation or motion path
  is created. They used to make the object vanish or keep a stopped spinner running forever. This
  covers motion path and orbit periods (zero too), tail gaps, intro/outro durations, `dockMs`,
  `popDurationMs`, `doneFadeDurationMs`, and a numeric particle `outroMs`. A particle `outroMs`
  function that returns such a value counts as `0`.

### Internal

- A test installs the `npm pack` tarball into a new project and imports, requires, and
  type-checks every subpath from there.
- Browser tests also run in Firefox and WebKit.
- Regression tests for each fix above.

## 0.9.30

### Changed

- `package.json` declares `"sideEffects": false`: no module does anything when imported, so
  bundlers can drop the parts of the package you do not use.

## 0.9.29

### Internal

- Browser tests on Linux run WebGPU, Vulkan, and ANGLE on SwiftShader. Headless Chromium there
  otherwise loses the WebGPU device right after creating it, so CI now really tests WebGPU.
- The tests badge in the README shows the status of `main`.

## 0.9.28

### Added

- When the GPU device or the WebGL context is lost after mounting (a driver reset, or the browser
  reclaiming contexts), `"auto"` switches to the next backend and keeps animating. A pinned
  backend has nothing to switch to, so its canvas is removed and a console warning says why.
  Custom renderers can report a loss through the new optional `Renderer.onLost`.

### Fixed

- A WebGPU setup that the GPU rejects with a validation error now counts as a failed start, so
  `"auto"` falls back, instead of leaving a renderer that draws nothing.

### Internal

- The engine keeps the canvas, size observer, and renderer of each backend attempt together and
  releases them together, so a failed attempt cannot leave anything behind.
- The engine's WebGPU types are exact (value sets instead of plain strings, no loosely typed
  descriptors) and a test checks them against `@webgpu/types`. That package is a dev dependency
  only; the published package still has no dependencies.
- Regression tests for every fix in 0.9.26 to 0.9.28, including pixel-value checks in a real
  browser.
- CI runs on pushes to `dev` as well as `main`, and fails when the browser tests could not
  exercise WebGPU instead of skipping those tests silently.

## 0.9.27

### Added

- Engine option `rendererFor`: build the renderer for each backend `"auto"` tries, for example a
  textured variant, without giving up the fallback.
- `ObjectMotionAnimation.outroDelayMs`, and `ParticlesAnimation`'s `outroMs` also accepts a
  function, so a trail can follow a fly-out that starts late.

### Fixed

- Textured particle layers (as in `planeStarTrail` and `rocketLaunch`) now fall back from a
  failing WebGPU to WebGL and Canvas 2D on `"auto"`, like every other animation.
- `spinner.ready` resolves when the spinner is destroyed while a backend is still starting,
  instead of staying pending forever.
- A custom animation whose `mount()` throws at once no longer makes `createSpinner` throw with
  DOM left behind: you get a spinner, and `ready` rejects with the error.
- An error thrown by one animation's `destroy()` no longer stops the spinner, a composite, or the
  engine from removing everything else it owns. The first error is rethrown afterwards.
- `setTexture` replaces a texture that is already on screen (WebGL and WebGPU). Before, the old
  texture kept showing.
- A plane stopped during its intro keeps emitting its star trail until its fly-out ends. Before,
  the trail stopped up to two seconds early.
- WebGPU pipelines are created asynchronously, so an invalid pipeline fails the start and
  `"auto"` falls back, instead of failing silently.

## 0.9.26

### Fixed

- WebGL wrote half the intended alpha for semi-transparent surfaces on a transparent canvas.
  It now blends like WebGPU.
- Cameras shared one default position object, so moving one default camera moved the others.
  Each camera now has its own copy, also of a `position` you pass in.
- `tail.count` of `Infinity` or `NaN` made mounting loop forever. It now throws a `RangeError`.
- With `"auto"`, a renderer that failed its first resize could break the next backend attempt.
