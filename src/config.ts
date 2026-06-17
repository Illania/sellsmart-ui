import type { AppSettings } from "./types";

export const API_BASE_URL = "https://sellsmart-ml-api.onrender.com";
export const POSITIONS_STORAGE_KEY = "sellsmart_positions";
export const WATCHLIST_STORAGE_KEY = "sellsmart_watchlist";
export const ALERTS_READ_STORAGE_KEY = "sellsmart_alerts_read";
export const SETTINGS_STORAGE_KEY = "sellsmart_settings";

export const defaultSettings: AppSettings = {
  highRiskThreshold: 70,
  portfolioRiskThreshold: 40,
  enableRiskAlerts: true,
  enableReduceAlerts: true,
  enableNewsAlerts: true,
  defaultView: "dashboard",
};
