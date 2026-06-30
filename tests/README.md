# Tests

Zero-dependency unit tests for the pure logic in this package, using Node's built-in test
runner (`node:test`) and `assert` - no external test framework, no `devDependencies`.

They run against the compiled output in `dist/`, i.e. exactly what consumers get from npm.
Tests are excluded from the published package by the `files` field in `package.json`, so they
add nothing to the npm tarball while staying visible in the repository.

## Run

```sh
npm test          # rebuilds dist, then runs every *.test.mjs
```

`pretest` runs the build first, so the tests always check a fresh `dist/`. To run without
rebuilding (dist must already exist):

```sh
node --test tests/*.test.mjs
```

## What is covered

Zero-dependency lifecycle and pure logic:

- `motion.test.mjs` - the motion controllers (`figureEightMotion`, `circleMotion`,
  `squareMotion`, `wanderMotion`): loop seamlessness, the circle radius invariant, the square
  perimeter bound, the wander in-frame guarantee, seed reproducibility, and `positionAt` purity.
- `transitions.test.mjs` - the object-motion intro/outro transitions: `enterFromObjectDirection`
  lands on the handoff, matches the path velocity when fast, and falls back to `distance` when
  slow; `leaveInObjectDirection` starts at the handoff and flies off.
- `math.test.mjs` - the engine math helpers: matrix identity/inverse, normalize, cross/dot, and
  the `Rz` rotation convention.
- `renderer.test.mjs` - opaque/transparent render ordering, opacity defaults/clamping, and the
  two-sided opacity shorthand.
- `mesh.test.mjs` - `centerAndScaleMesh`: origin centering, uniform fit to `targetSize`, and
  input immutability.
- `progress-animation.test.mjs` - every observable progress-animation lifecycle stage, including
  done-label fading and immediate completion when the fade is disabled.
- `spinner-lifecycle.test.mjs` - `createSpinner` mounting, reported and timed completion,
  indeterminate stop, immediate/idempotent destroy, and invalid-period rejection using a fake
  animation, element, and animation-frame scheduler.

Real DOM/canvas rendering (mounting the engine, drawing) is intentionally **not** covered here -
it would require a DOM environment (jsdom or a browser runner) and thus an external dependency.
Keeping this suite dependency-free is a deliberate constraint.
