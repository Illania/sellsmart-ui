import { useEffect } from "react";
import type { AppearanceMode } from "../types";

const THEME_STORAGE_KEY = "sellsmart.appearance";

function resolveAppearance(mode: AppearanceMode): "light" | "dark" {
  if (mode === "system") {
    return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
  }

  return mode;
}

export function useAppearance(mode: AppearanceMode) {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const root = document.documentElement;
    const mediaQuery = window.matchMedia("(prefers-color-scheme: light)");

    const applyAppearance = () => {
      const resolvedTheme = resolveAppearance(mode);
      root.dataset.appearance = mode;
      root.dataset.theme = resolvedTheme;
      root.style.colorScheme = resolvedTheme;
      localStorage.setItem(THEME_STORAGE_KEY, mode);
    };

    applyAppearance();

    if (mode === "system") {
      mediaQuery.addEventListener("change", applyAppearance);
      return () => mediaQuery.removeEventListener("change", applyAppearance);
    }
  }, [mode]);
}
