/** Indeterminate spinner options for a prefab's animation, forwarding the shared prefab options. */
export function spinner(animation, options) {
    return {
        type: "indeterminate",
        animation,
        loop: options.loop,
        periodMs: options.periodMs,
        ariaLabel: options.ariaLabel,
    };
}
/** Progress spinner options for a prefab's animation; starts just above zero so the story begins on mount. */
export function progressSpinner(animation, options) {
    return {
        type: "progress",
        animation,
        progress: options.progress ?? 0.001,
        timeoutMs: options.timeoutMs,
        timeout: options.timeout,
        until: options.until,
        ariaLabel: options.ariaLabel,
    };
}
