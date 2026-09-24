/**
 * Show a spinner's setup failure in its stage, for example when the picker pins
 * a backend this browser lacks. Returns the spinner unchanged.
 */
export function showSetupFailure(spinner, stage) {
  spinner.ready.catch((error) => {
    const note = document.createElement("div");
    note.className = "stage-hint";
    note.textContent = error instanceof Error ? error.message : String(error);
    stage.appendChild(note);
  });
  return spinner;
}
