import type { AppearanceMode } from "./types";

const THEME_STORAGE_KEY = "sellsmart.appearance";

export function resolveAppearance(mode: AppearanceMode): "light" | "dark" {
  if (mode === "system") {
    return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
  }

  return mode;
}

export function applyAppearanceMode(mode: AppearanceMode) {
  if (typeof window === "undefined") return;

  const resolvedTheme = resolveAppearance(mode);
  const root = document.documentElement;

  root.dataset.appearance = mode;
  root.dataset.theme = resolvedTheme;
  root.style.colorScheme = resolvedTheme;
  localStorage.setItem(THEME_STORAGE_KEY, mode);
}

export function applyStoredAppearanceBeforeRender() {
  if (typeof window === "undefined") return;

  const stored = localStorage.getItem(THEME_STORAGE_KEY) as AppearanceMode | null;
  const mode: AppearanceMode = stored === "light" || stored === "dark" || stored === "system" ? stored : "system";

  applyAppearanceMode(mode);
}
