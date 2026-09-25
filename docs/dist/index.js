import { damp } from "./engines/little-tween-engine/core/damp.js";
import { mountAnimation } from "./mount-host.js";
function clamp01(value) {
    if (Number.isNaN(value))
        return 0;
    return Math.min(1, Math.max(0, value));
}
function lerp(from, to, t) {
    return from + (to - from) * t;
}
const usedAnimations = new WeakSet();
// Visually hidden but read by assistive technology.
const PROGRESSBAR_STYLE = "position:absolute;width:1px;height:1px;margin:-1px;padding:0;border:0;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap";
/**
 * True when the user has asked the system to reduce motion
 * (`prefers-reduced-motion: reduce`). The spinner does not act on it by itself;
 * use it to choose a calmer animation, a slower spin, or no spinner at all.
 */
export function prefersReducedMotion() {
    return typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
}
/**
 * Add the spinner's accessible progress bar to `target`: an ARIA `progressbar`
 * named `label`. The visual labels are hidden from assistive technology, so this
 * is the one element that reports progress. An indeterminate spinner has no
 * value. `update` writes the value only when the rounded percentage changes.
 */
function mountProgressbar(target, label, indeterminate) {
    const element = document.createElement("div");
    element.style.cssText = PROGRESSBAR_STYLE;
    element.setAttribute("role", "progressbar");
    element.setAttribute("aria-label", label);
    if (!indeterminate) {
        element.setAttribute("aria-valuemin", "0");
        element.setAttribute("aria-valuemax", "100");
    }
    target.appendChild(element);
    let shown = -1;
    return {
        element,
        update(progress) {
            if (indeterminate)
                return;
            const percent = Math.round(progress * 100);
            if (percent === shown)
                return;
            shown = percent;
            element.setAttribute("aria-valuenow", String(percent));
        },
    };
}
/**
 * Mount `options.animation` inside `target` and start its animation loop.
 * Throws before mounting anything on invalid options or a reused animation
 * instance; setup failures after that are reported through {@link Spinner.ready}.
 */
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
    if (!indeterminate && options.until instanceof Date && Number.isNaN(options.until.getTime())) {
        throw new RangeError("3d-spinner: until must be a valid Date.");
    }
    const timeoutMs = indeterminate ? undefined : (options.timeoutMs ?? options.timeout);
    if (Number.isNaN(timeoutMs)) {
        throw new RangeError("3d-spinner: timeoutMs must be a number of milliseconds, not NaN.");
    }
    if (usedAnimations.has(animation)) {
        throw new Error("3d-spinner: this animation instance is already in use. Animations are single-use; create a new one for each spinner.");
    }
    usedAnimations.add(animation);
    const mounting = mountAnimation(animation, target);
    const progressbar = mountProgressbar(target, options.ariaLabel ?? "Loading", indeterminate);
    const ready = Promise.resolve(mounting).catch((error) => {
        halt();
        throw error;
    });
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
        if (typeof options.progress === "number") {
            current = clamp01(options.progress);
            targetProgress = current;
        }
        if (typeof timeoutMs === "number")
            deadline = Math.min(deadline, start + timeoutMs);
        // `until` is wall-clock time; rAF timestamps share performance.now()'s origin.
        if (options.until instanceof Date) {
            deadline = Math.min(deadline, start + (options.until.getTime() - Date.now()));
        }
    }
    function computeProgress(now) {
        if (!indeterminate) {
            if (now >= deadline)
                targetProgress = 1;
            const deltaMs = now - lastFrame;
            lastFrame = now;
            current = lerp(current, targetProgress, damp(0.12, deltaMs));
            if (Math.abs(targetProgress - current) < 0.0005)
                current = targetProgress;
            return current;
        }
        const period = options.periodMs ?? 2000;
        const t = (now - start) / period;
        if ((options.loop ?? "bounce") === "restart")
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
        progressbar.update(progress);
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
        try {
            animation.destroy();
        }
        finally {
            progressbar.element.remove();
        }
    }
    rafId = requestAnimationFrame(frame);
    return { ready, setProgress, stop, destroy };
}
