export function spinner(animation, options) {
    return {
        type: "indeterminate",
        animation,
        loop: options.loop,
        periodMs: options.periodMs,
    };
}
export function progressSpinner(animation, options) {
    return {
        type: "progress",
        animation,
        progress: options.progress ?? 0.001,
        timeout: options.timeout,
        until: options.until,
    };
}
