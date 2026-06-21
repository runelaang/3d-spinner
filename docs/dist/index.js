function clamp01(value) {
    if (Number.isNaN(value))
        return 0;
    return Math.min(1, Math.max(0, value));
}
function lerp(from, to, t) {
    return from + (to - from) * t;
}
export function createSpinner(target, options) {
    if (!(target instanceof HTMLElement)) {
        throw new Error("3d-spinner: createSpinner requires a target HTMLElement.");
    }
    const determinateInitially = typeof options.progress === "number";
    let determinate = determinateInitially;
    let current = determinateInitially ? clamp01(options.progress) : 0;
    let targetProgress = current;
    const { plugin } = options;
    plugin.mount(target);
    let rafId = 0;
    let stopped = false;
    const start = performance.now();
    let deadline = Infinity;
    if (typeof options.timeout === "number") {
        deadline = Math.min(deadline, start + options.timeout);
    }
    if (options.until instanceof Date) {
        deadline = Math.min(deadline, options.until.getTime());
    }
    function render(now) {
        if (determinate) {
            current = lerp(current, targetProgress, 0.12);
            if (Math.abs(targetProgress - current) < 0.0005)
                current = targetProgress;
        }
        plugin.render(now, { determinate, progress: current });
    }
    function frame(now) {
        if (stopped)
            return;
        if (now >= deadline) {
            render(now);
            stop();
            return;
        }
        render(now);
        rafId = requestAnimationFrame(frame);
    }
    function stop() {
        if (stopped)
            return;
        stopped = true;
        if (rafId)
            cancelAnimationFrame(rafId);
        rafId = 0;
    }
    function destroy() {
        stop();
        plugin.destroy();
    }
    function setProgress(value) {
        determinate = true;
        targetProgress = clamp01(value);
        if (stopped) {
            current = targetProgress;
            plugin.render(performance.now(), { determinate, progress: current });
        }
    }
    rafId = requestAnimationFrame(frame);
    return { setProgress, stop, destroy };
}
