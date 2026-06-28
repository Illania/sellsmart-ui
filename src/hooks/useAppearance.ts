import { useEffect } from "react";
import type { AppearanceMode } from "../types";
import { applyAppearanceMode } from "../themeScript";

export function useAppearance(mode: AppearanceMode) {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: light)");

    const applyAppearance = () => {
      applyAppearanceMode(mode);
    };

    applyAppearance();

    if (mode === "system") {
      mediaQuery.addEventListener("change", applyAppearance);
      return () => mediaQuery.removeEventListener("change", applyAppearance);
    }
  }, [mode]);
}
