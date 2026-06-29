import { useMemo } from "react";
import type { AlertSeverity, AppSettings, PortfolioAlert, Position } from "../types";

const alertDateKey = (value?: string) => {
  const parsed = value ? new Date(value) : new Date();

  if (Number.isNaN(parsed.getTime())) {
    return new Date().toISOString().slice(0, 10);
  }

  return parsed.toISOString().slice(0, 10);
};

const buildAlertId = (type: PortfolioAlert["type"], tickerOrScope: string, createdAt?: string) =>
  `${type}-${tickerOrScope.trim().toUpperCase()}-${alertDateKey(createdAt)}`;

export function useAlerts(
  positions: Position[],
  overallRisk: number,
  settings: AppSettings,
  readAlertIds: string[],
  saveReadAlerts: (ids: string[]) => void
) {
  const alerts = useMemo<PortfolioAlert[]>(() => {
    const now = new Date().toISOString();

    const highRiskAlerts = positions
      .filter(
        (position) =>
          settings.enableRiskAlerts &&
          (position.riskLevel === "high" || position.riskScore >= settings.highRiskThreshold)
      )
      .map((position) => {
        const createdAt = position.cacheGeneratedAt ?? now;
        const id = buildAlertId("risk", position.ticker, createdAt);

        return {
          id,
          ticker: position.ticker,
          title: `${position.ticker} high-risk signal`,
          message: `${position.ticker} has a risk score of ${position.riskScore}/100. Suggested action: ${position.action}.`,
          severity: "high" as AlertSeverity,
          type: "risk" as const,
          createdAt,
          read: readAlertIds.includes(id),
        };
      });

    const newsAlerts = positions
      .filter(
        (position) =>
          settings.enableNewsAlerts &&
          position.drivers.some((driver) =>
            `${driver.label} ${driver.message}`.toLowerCase().includes("news")
          )
      )
      .map((position) => {
        const createdAt = position.cacheGeneratedAt ?? now;
        const id = buildAlertId("news", position.ticker, createdAt);

        return {
          id,
          ticker: position.ticker,
          title: `${position.ticker} news risk detected`,
          message: "SellSmart detected news-related pressure among the top risk drivers.",
          severity: "medium" as AlertSeverity,
          type: "news" as const,
          createdAt,
          read: readAlertIds.includes(id),
        };
      });

    const actionAlerts = positions
      .filter((position) => settings.enableReduceAlerts && position.action === "Reduce")
      .map((position) => {
        const createdAt = position.cacheGeneratedAt ?? now;
        const id = buildAlertId("action", position.ticker, createdAt);

        return {
          id,
          ticker: position.ticker,
          title: `${position.ticker} reduce signal`,
          message: `${position.ticker} currently has a Reduce signal. Review exposure and risk drivers.`,
          severity: "high" as AlertSeverity,
          type: "action" as const,
          createdAt,
          read: readAlertIds.includes(id),
        };
      });

    const portfolioCreatedAt = now;
    const portfolioAlertId = buildAlertId("portfolio", "risk", portfolioCreatedAt);
    const portfolioAlert =
      overallRisk >= settings.portfolioRiskThreshold
        ? [
            {
              id: portfolioAlertId,
              title: "Portfolio risk requires attention",
              message: `Overall portfolio risk is ${overallRisk}/100. Review high-risk positions before adding more exposure.`,
              severity: overallRisk >= settings.highRiskThreshold ? ("high" as AlertSeverity) : ("medium" as AlertSeverity),
              type: "portfolio" as const,
              createdAt: portfolioCreatedAt,
              read: readAlertIds.includes(portfolioAlertId),
            },
          ]
        : [];

    return [...portfolioAlert, ...highRiskAlerts, ...actionAlerts, ...newsAlerts];
  }, [positions, overallRisk, readAlertIds, settings]);

  const unreadAlertsCount = alerts.filter((alert) => !alert.read).length;
  const latestAlerts = alerts.slice(0, 3);

  const markAlertAsRead = (alertId: string) => {
    saveReadAlerts(Array.from(new Set([...readAlertIds, alertId])));
  };

  const markAllAlertsAsRead = () => {
    saveReadAlerts(Array.from(new Set([...readAlertIds, ...alerts.map((alert) => alert.id)])));
  };

  return {
    alerts,
    unreadAlertsCount,
    latestAlerts,
    markAlertAsRead,
    markAllAlertsAsRead,
  };
}
