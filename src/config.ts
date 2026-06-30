import type { AppSettings } from "./types";

export const API_BASE_URL =
  import.meta.env.DEV
    ? "http://localhost:8000"
    : "https://sellsmart-ml-api.onrender.com";

export const defaultSettings: AppSettings = {
  highRiskThreshold: 70,
  portfolioRiskThreshold: 40,
  enableRiskAlerts: true,
  enableReduceAlerts: true,
  enableNewsAlerts: true,
  defaultView: "dashboard",
  appearance: "system",
  alertHistoryDays: 90,
  alertQuickFilters: ["all", "unread", "read", "high", "today"],
};
