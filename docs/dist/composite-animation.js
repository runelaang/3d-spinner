/** Run multiple animations through one spinner lifecycle in stacked layers. */
export class CompositeAnimation {
    constructor(layers) {
        this.elements = [];
        this.layers = layers.map((layer) => "animation" in layer ? layer : { animation: layer });
    }
    mount(target) {
        target.style.position = "relative";
        for (const [index, layer] of this.layers.entries()) {
            const element = document.createElement("div");
            element.style.cssText = `position:absolute;inset:0;z-index:${layer.zIndex ?? index}`;
            target.appendChild(element);
            this.elements.push(element);
            layer.animation.mount(element);
        }
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
    destroy() {
        for (const layer of this.layers)
            layer.animation.destroy();
        for (const element of this.elements)
            element.remove();
        this.elements.length = 0;
    }
}
