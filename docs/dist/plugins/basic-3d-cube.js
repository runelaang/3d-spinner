import { Basic3dSpinSpinner } from "./basic-3d-spin.js";
/** A spinning cube. Thin wrapper around {@link Basic3dSpinSpinner} with default options. */
export class Basic3dCubeSpinner {
    constructor(options = {}) {
        this.spin = new Basic3dSpinSpinner({ backend: options.backend });
    }
    mount(target) {
        this.spin.mount(target);
    }
    render(now, state) {
        this.spin.render(now, state);
    }
    destroy() {
        this.spin.destroy();
    }
}
