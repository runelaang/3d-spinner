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
    const { animation } = options;
    const indeterminate = options.type === "indeterminate";
    if (indeterminate &&
        options.periodMs !== undefined &&
        (!Number.isFinite(options.periodMs) || options.periodMs <= 0)) {
        throw new RangeError("3d-spinner: periodMs must be a finite number greater than zero.");
    }
    if (!indeterminate &&
        options.until instanceof Date &&
        Number.isNaN(options.until.getTime())) {
        throw new RangeError("3d-spinner: until must be a valid Date.");
    }
    animation.mount(target);
    const start = performance.now();
    let rafId = 0;
    let stopped = false;
    let destroyed = false;
    let entered = false;
    let exiting = false;
    // Progress source (determinate only).
    let current = 0;
    let targetProgress = 0;
    let deadline = Infinity;
    let lastFrame = start;
    if (!indeterminate) {
        const opts = options;
        if (typeof opts.progress === "number") {
            current = clamp01(opts.progress);
            targetProgress = current;
        }
        if (typeof opts.timeout === "number")
            deadline = Math.min(deadline, start + opts.timeout);
        // `until` is wall-clock time; rAF timestamps share performance.now()'s origin.
        if (opts.until instanceof Date) {
            deadline = Math.min(deadline, start + (opts.until.getTime() - Date.now()));
        }
    }
    function computeProgress(now) {
        if (!indeterminate) {
            if (now >= deadline)
                targetProgress = 1;
            const deltaMs = Math.max(0, now - lastFrame);
            lastFrame = now;
            // Frame-rate independent form of a 0.12 lerp per 60 fps frame.
            const alpha = 1 - Math.pow(1 - 0.12, deltaMs / (1000 / 60));
            current = lerp(current, targetProgress, alpha);
            if (Math.abs(targetProgress - current) < 0.0005)
                current = targetProgress;
            return current;
        }
        const opts = options;
        const period = opts.periodMs ?? 2000;
        const t = (now - start) / period;
        if ((opts.loop ?? "bounce") === "restart")
            return t - Math.floor(t);
        const phase = t - 2 * Math.floor(t / 2); // 0..2
        return phase <= 1 ? phase : 2 - phase; // triangle 0..1..0
    }
    function frame(now) {
        if (stopped)
            return;
        const progress = computeProgress(now);
        if (!entered && (indeterminate || progress > 0)) {
            animation.enter(now);
            entered = true;
        }
        if (!exiting && entered && !indeterminate && progress >= 1 && targetProgress >= 1) {
            animation.exit(now);
            exiting = true;
        }
        const target = indeterminate ? progress : targetProgress;
        animation.render(now, { progress, targetProgress: target, indeterminate });
        if (exiting && animation.isFinished()) {
            halt();
            return;
        }
        rafId = requestAnimationFrame(frame);
    }
    function halt() {
        if (stopped)
            return;
        stopped = true;
        if (rafId)
            cancelAnimationFrame(rafId);
        rafId = 0;
    }
    function setProgress(value) {
        if (!indeterminate)
            targetProgress = clamp01(value);
    }
    function stop() {
        if (stopped || exiting)
            return;
        if (!entered) {
            halt();
            return;
        }
        animation.exit(performance.now());
        exiting = true;
    }
    function destroy() {
        if (destroyed)
            return;
        destroyed = true;
        halt();
        animation.destroy();
    }
    rafId = requestAnimationFrame(frame);
    return { setProgress, stop, destroy };
}
