const STORAGE_KEY = "3d-spinner-examples-theme";
const MODES = ["auto", "light", "dark"];

function getStoredMode() {
  const stored = localStorage.getItem(STORAGE_KEY);
  return MODES.includes(stored) ? stored : "auto";
}

function applyTheme(mode) {
  if (mode === "auto") {
    document.documentElement.removeAttribute("data-theme");
    return;
  }
  document.documentElement.setAttribute("data-theme", mode);
}

function updateThemeButton(button, mode) {
  const labels = { auto: "Auto", light: "Light", dark: "Dark" };
  button.textContent = labels[mode];
  button.dataset.theme = mode;
  button.title = `Color scheme: ${labels[mode]}`;
  button.setAttribute("aria-label", `Color scheme: ${labels[mode]}. Click to change.`);
}

function initThemeToggle() {
  const button = document.getElementById("theme-toggle");
  if (!button) return;

  let mode = getStoredMode();
  applyTheme(mode);
  updateThemeButton(button, mode);

  button.addEventListener("click", () => {
    mode = MODES[(MODES.indexOf(mode) + 1) % MODES.length];
    localStorage.setItem(STORAGE_KEY, mode);
    applyTheme(mode);
    updateThemeButton(button, mode);
  });
}

applyTheme(getStoredMode());

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initThemeToggle);
} else {
  initThemeToggle();
}
