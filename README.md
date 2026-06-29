# 3d-spinner and beyond

[![tests](https://img.shields.io/github/actions/workflow/status/runelaang/3d-spinner/ci.yml?label=tests&logo=github)](https://github.com/runelaang/3d-spinner/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/3d-spinner?logo=npm)](https://www.npmjs.com/package/3d-spinner)
[![license](https://img.shields.io/github/license/runelaang/3d-spinner)](LICENSE)

A zero-dependency 3D spinner, loader, and progress indicator for the browser. It renders to a
canvas and ships as ES modules split across separate import paths, so a consumer loads only the
animation, motion path, and rendering backend they actually use - nothing else is pulled in.

## Install

```sh
npm install 3d-spinner
```

## Quick start

A spinner is a renderer (the `animation`) plus a mode. The simplest case is an indeterminate
spinner that runs until you stop it:

```js
import { createSpinner } from "3d-spinner";
import { SpinAnimation } from "3d-spinner/animations/spin";

const spinner = createSpinner(document.getElementById("app"), {
  type: "indeterminate",
  animation: new SpinAnimation(),
});

// When the work is done:
spinner.stop();    // play the outro, then stop (leaves the element in place)
spinner.destroy(); // stop now and remove the element
```

## Reporting progress

Drop the `type` (it defaults to `"progress"`) and report progress yourself as work completes.
Give `SpinAnimation` a `progressAnimation` to make it pop in, scale with progress, and show a
label:

```js
import { createSpinner } from "3d-spinner";
import { SpinAnimation } from "3d-spinner/animations/spin";

const spinner = createSpinner(document.getElementById("app"), {
  animation: new SpinAnimation({ progressAnimation: {} }),
});

spinner.setProgress(0.4); // smoothly advances toward 40%
spinner.setProgress(1);   // reaching 1 plays the outro
```

## Choosing a shape

`SpinAnimation` spins a cube by default. Pass any built-in shape, or your own mesh:

```js
import { SpinAnimation } from "3d-spinner/animations/spin";
import { tetrahedron } from "3d-spinner/engines/little-3d-engine";

new SpinAnimation({ shape: tetrahedron(), color: "#3b82f6" });
```

Shapes exported from `3d-spinner/engines/little-3d-engine` include `cube`, `tetrahedron`,
`octahedron`, `pyramid`, and several spheres (`uvSphere`, `icosphere`, `octaSphere`,
`cubeSphere`).

## How it fits together

A spinner is assembled from a few independent pieces, so you can swap one without touching the
others:

- **`createSpinner`** mounts the spinner into an element and runs a single animation loop.
- **Spinner type** decides how progress is driven. `progress` is determinate - you report a value
  from 0 to 1 with `setProgress`. `indeterminate` is self-driving - it loops a synthetic progress
  on a timer until you `stop()`. Any animation works with either type.
- **Animation** is the visual that plays (a spinning shape, a moving object). Each one lives at its
  own import path, so you load only the animation you use.
- **Intro and outro** are the entrance and exit. The loop plays the intro once when the spinner
  starts and the outro when it finishes - progress reaching 1, or `stop()`. `destroy()` skips the
  outro and removes the element immediately.
- **Motion controller** (for `ObjectMotionAnimation`) is a small, separate object that decides
  *how* a thing moves - a circle, square, figure-8, or wander. Swap the controller to change the
  path without changing the animation.
- **Transition** (for `ObjectMotionAnimation`) is the optional intro/outro effect - grow or shrink
  in place, or fly in and out along the path.
- **The 3D engine** is the renderer underneath: a small, dependency-free engine that draws shapes
  and meshes to a canvas, with swappable Canvas 2D, WebGL, and WebGPU backends.

## Animations

Each animation is imported from its own subpath, so you only pull in the one you use.

| Import | Class | Description |
| --- | --- | --- |
| `3d-spinner/animations/spin` | `SpinAnimation` | A spinning 3D shape, a cube by default. |
| `3d-spinner/animations/object-motion` | `ObjectMotionAnimation` | A mesh that follows a motion path, with an intro/outro you choose. |

`ObjectMotionAnimation` takes a motion controller from `3d-spinner/motion` (`circleMotion`,
`squareMotion`, `figureEightMotion`, `wanderMotion`) and optional entrance/exit transitions from
`3d-spinner/motion/transitions` (`grow`, `shrink`, `enterFromObjectDirection`,
`leaveInObjectDirection`) - for example a figure-8 path with a fly-in and fly-out.

## API

### `createSpinner(target, options)`

Mounts a spinner inside `target` (an `HTMLElement`) and returns a `Spinner`. The options depend
on the mode.

**Progress** (the default, `type: "progress"`):

| Option | Type | Description |
| --- | --- | --- |
| `animation` | `SpinnerAnimation` | The renderer to play. Required. |
| `progress` | `number` | Initial progress `0..1`. A value above 0 plays the intro immediately. |
| `timeout` | `number` | Auto-complete after this many milliseconds. |
| `until` | `Date` | Auto-complete at this time. If both are set, the earlier wins. |

**Indeterminate** (`type: "indeterminate"`):

| Option | Type | Description |
| --- | --- | --- |
| `animation` | `SpinnerAnimation` | The renderer to play. Required. |
| `loop` | `"bounce" \| "restart"` | `"bounce"` ramps 0 to 1 and back; `"restart"` repeats 0 to 1. Default `"bounce"`. |
| `periodMs` | `number` | Milliseconds for one sweep. Must be finite and greater than zero. Default `2000`. |

### `Spinner`

| Method | Description |
| --- | --- |
| `setProgress(target)` | Advance progress toward `target` (`0..1`). No-op for an indeterminate spinner. |
| `stop()` | Play the outro, then stop animating. Keeps the injected element. |
| `destroy()` | Stop immediately and remove the injected element. Safe to call more than once. |

## Rendering backend

By default the spinner uses a Canvas 2D software renderer, which has no dependencies and runs
anywhere a canvas does. The engine can also render through WebGL or WebGPU; pass `backend` to
any of the 3D animations to switch. Backends are loaded on demand, so the code for the ones you
do not use is never fetched.

```js
new SpinAnimation({ backend: "webgl" }); // "canvas2d" (default), "webgl", or "webgpu"
```

## The engine

The renderer is a small, self-contained 3D engine, exported on its own in case you want it
directly:

- `3d-spinner/engines/little-3d-engine` - the engine (`Little3dEngine`), shapes, and math.
- `3d-spinner/engines/little-3d-engine/loaders/obj` - a minimal OBJ loader (`parseObj`).
- `3d-spinner/engines/little-tween-engine` - a standalone tween and easing engine
  (`LittleTweenEngine`).

Each has no dependencies of its own.

## Module format

ES modules only, for the browser. Use a bundler or native `<script type="module">`; the engine
draws to a canvas, so there is no server-side rendering. ES modules do not load over `file://`,
so serve the page over HTTP rather than opening the file directly.

## Development

```sh
npm install
npm run build   # compile src/ to dist/ (ESM + type declarations)
npm test        # build, then run the unit tests
npm run dev     # serve this folder; open /examples/index.html
```

## License

MIT (c) RuneL
