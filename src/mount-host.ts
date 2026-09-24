/**
 * Make `target` the positioning context for the absolutely placed canvas, label,
 * and layers, without overriding a position the page already gives it.
 *
 * Spinners render straight into the element the consumer passes, not into a
 * wrapper of their own: the consumer sizes and places the spinner with their own
 * CSS, and the canvas and label fill that element. Only `static` (the default)
 * needs changing; a `relative`, `absolute`, `fixed`, or `sticky` host already
 * positions its children and is left untouched, whether set inline or by a class.
 */
export function prepareHost(target: HTMLElement): void {
  const position = getComputedStyle(target).position;
  if (position === "static" || position === "") target.style.position = "relative";
}
