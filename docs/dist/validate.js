/** Return `value`, or throw a `RangeError` naming `name` if it is `NaN` or infinite. */
export function finite(value, name) {
    if (!Number.isFinite(value)) {
        throw new RangeError(`3d-spinner: ${name} must be a finite number.`);
    }
    return value;
}
/** Return `value`, or throw a `RangeError` naming `name` unless it is finite and not zero. */
export function finiteNonZero(value, name) {
    if (!Number.isFinite(value) || value === 0) {
        throw new RangeError(`3d-spinner: ${name} must be a finite number other than zero.`);
    }
    return value;
}
/** Return `value`, or throw a `RangeError` naming `name` unless it is finite and above zero. */
export function positiveFinite(value, name) {
    if (!Number.isFinite(value) || value <= 0) {
        throw new RangeError(`3d-spinner: ${name} must be a finite number greater than zero.`);
    }
    return value;
}
