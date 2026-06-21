export class ProgressBarSpinner {
    mount(target) {
        const el = document.createElement("div");
        el.className = "spinner-3d-progress-bar";
        target.appendChild(el);
        this.el = el;
    }
    render(_now, state) {
        if (!this.el)
            return;
        this.el.textContent = state.determinate
            ? `progress bar stub - ${Math.round(state.progress * 100)}%`
            : "progress bar stub";
    }
    destroy() {
        this.el?.remove();
        this.el = undefined;
    }
}
