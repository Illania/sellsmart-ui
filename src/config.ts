import type { AppSettings } from "./types";

export const API_BASE_URL = "https://sellsmart-ml-api.onrender.com";

export const defaultSettings: AppSettings = {
  highRiskThreshold: 70,
  portfolioRiskThreshold: 40,
  enableRiskAlerts: true,
  enableReduceAlerts: true,
  enableNewsAlerts: true,
  defaultView: "dashboard",
  appearance: "system",
};
