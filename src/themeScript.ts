import type { AppearanceMode } from "./types";

const THEME_STORAGE_KEY = "sellsmart.appearance";

export function applyStoredAppearanceBeforeRender() {
  if (typeof window === "undefined") return;

  const stored = localStorage.getItem(THEME_STORAGE_KEY) as AppearanceMode | null;
  const mode: AppearanceMode = stored === "light" || stored === "dark" || stored === "system" ? stored : "system";
  const resolvedTheme = mode === "system"
    ? (window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark")
    : mode;

  document.documentElement.dataset.appearance = mode;
  document.documentElement.dataset.theme = resolvedTheme;
  document.documentElement.style.colorScheme = resolvedTheme;
}
