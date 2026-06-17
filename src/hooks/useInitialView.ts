import { useState } from "react";
import { SETTINGS_STORAGE_KEY } from "../config";
import type { ViewType } from "../types";

export function useInitialView() {
  return useState<ViewType>(() => {
    try {
      const savedSettings = localStorage.getItem(SETTINGS_STORAGE_KEY);

      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        return settings.defaultView ?? "dashboard";
      }
    } catch { }

    return "dashboard";
  });
}
