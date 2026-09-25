import { mountAnimation, prepareHost } from "./mount-host.js";
/** Run multiple animations through one spinner lifecycle in stacked layers. */
export class CompositeAnimation {
    constructor(layers) {
        this.elements = [];
        this.layers = layers.map((layer) => ("animation" in layer ? layer : { animation: layer }));
    }
    /** Mount every layer in its own stacked element; resolves once all layers can draw. */
    mount(target) {
        prepareHost(target);
        const mounting = [];
        for (const [index, layer] of this.layers.entries()) {
            const element = document.createElement("div");
            element.style.cssText = `position:absolute;inset:0;z-index:${layer.zIndex ?? index}`;
            target.appendChild(element);
            this.elements.push(element);
            mounting.push(mountAnimation(layer.animation, element));
        }
        return Promise.all(mounting).then(() => undefined);
    }
    enter(now) {
        for (const layer of this.layers)
            layer.animation.enter(now);
    }
    exit(now) {
        for (const layer of this.layers)
            layer.animation.exit(now);
    }
    render(now, frame) {
        for (const layer of this.layers)
            layer.animation.render(now, frame);
    }
    isFinished() {
        return this.layers.every((layer) => layer.animation.isFinished());
    }
    /** Destroy every layer even if one throws, then rethrow the first error. */
    destroy() {
        // Deliberately not an AggregateError: only a faulty custom layer throws here, and the
        // first error is enough to find it. What matters is that every other layer is cleaned up.
        let failed = false;
        let firstError;
        for (const layer of this.layers) {
            try {
                layer.animation.destroy();
            }
            catch (error) {
                if (!failed)
                    firstError = error;
                failed = true;
            }
        }
        for (const element of this.elements)
            element.remove();
        this.elements.length = 0;
        if (failed)
            throw firstError;
    }
}
