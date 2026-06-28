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

export function getStoredAppearanceMode(): AppearanceMode {
  if (typeof window === "undefined") return "system";

  const stored = localStorage.getItem(THEME_STORAGE_KEY) as AppearanceMode | null;
  return stored === "light" || stored === "dark" || stored === "system"
    ? stored
    : "system";
}

export function applyStoredAppearanceBeforeRender() {
  if (typeof window === "undefined") return;

  applyAppearanceMode(getStoredAppearanceMode());
}
