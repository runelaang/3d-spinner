# 3d-spinner

A lightweight, customizable 3D spinner for loading, generating, processing, and other waiting
states in modern web apps.

## Install

```sh
npm install 3d-spinner
```

## Usage

```js
import { createSpinner } from "3d-spinner";
import { TestSpinner } from "3d-spinner/plugins/test";

const spinner = createSpinner(document.getElementById("app"), {
  plugin: new TestSpinner(),
  timeout: 5000, // optional: auto-stop after 5s
});

// Later, when you have progress to report (0..1):
spinner.setProgress(0.42); // smoothly advances toward 42%

// When done:
spinner.stop();    // stop animating, keep the element
spinner.destroy(); // stop and remove the element
```

## API

### `createSpinner(target, options?)`

Mounts a spinner inside `target` (an `HTMLElement`) and returns a `Spinner`.

**Options** (all optional, and independent of each other):

| Option            | Type            | Description                                                        |
| ----------------- | --------------- | ------------------------------------------------------------------ |
| `plugin`          | `SpinnerPlugin` | Renderer used for the spinner graphics and animation.              |
| `timeout`         | `number`        | Auto-stop after this many milliseconds.                            |
| `until`           | `Date`          | Auto-stop at this absolute time. If both set, the earlier wins.    |
| `progress`        | `number`        | Initial progress `0..1`. Providing it makes the spinner determinate. |

### `Spinner`

| Method               | Description                                                                 |
| -------------------- | --------------------------------------------------------------------------- |
| `setProgress(target)`| Smoothly advance progress toward `target` (`0..1`). Call repeatedly as work completes. |
| `stop()`             | Stop the animation but keep the injected DOM.                               |
| `destroy()`          | Stop and remove the injected DOM.                                           |

## Development

```sh
npm install
npm run build   # compile src/ -> dist/ (ESM + type declarations)
npm run dev     # serve this folder; open /examples/index.html
```

> ES modules don't load over `file://` - use `npm run dev` (or any static server), not a
> direct file open. Run `npm run build` first so `dist/` exists.

## License

MIT © RuneL
