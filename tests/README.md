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
node --test
```

## What is covered

Pure, DOM-free logic only:

- `motion.test.mjs` - the motion controllers (`figureEightMotion`, `circleMotion`,
  `squareMotion`, `wanderMotion`): loop seamlessness, the circle radius invariant, the square
  perimeter bound, the wander in-frame guarantee, seed reproducibility, and `positionAt` purity.
- `math.test.mjs` - the engine math helpers: matrix identity/inverse, normalize, cross/dot, and
  the `Rz` rotation convention.
- `mesh.test.mjs` - `centerAndScaleMesh`: origin centering, uniform fit to `targetSize`, and
  input immutability.

DOM/canvas rendering (mounting the engine, drawing) is intentionally **not** covered here - it
would require a DOM environment (jsdom or a browser runner) and thus an external dependency.
Keeping this suite dependency-free is a deliberate constraint.
