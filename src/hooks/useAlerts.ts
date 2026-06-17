import { useMemo } from "react";
import type { AlertSeverity, AppSettings, PortfolioAlert, Position } from "../types";

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
      .map((position) => ({
        id: `risk-${position.ticker}`,
        ticker: position.ticker,
        title: `${position.ticker} high-risk signal`,
        message: `${position.ticker} has a risk score of ${position.riskScore}/100. Suggested action: ${position.action}.`,
        severity: "high" as AlertSeverity,
        type: "risk" as const,
        createdAt: position.cacheGeneratedAt ?? now,
        read: readAlertIds.includes(`risk-${position.ticker}`),
      }));

    const newsAlerts = positions
      .filter(
        (position) =>
          settings.enableNewsAlerts &&
          position.drivers.some((driver) =>
            `${driver.label} ${driver.message}`.toLowerCase().includes("news")
          )
      )
      .map((position) => ({
        id: `news-${position.ticker}`,
        ticker: position.ticker,
        title: `${position.ticker} news risk detected`,
        message: "SellSmart detected news-related pressure among the top risk drivers.",
        severity: "medium" as AlertSeverity,
        type: "news" as const,
        createdAt: position.cacheGeneratedAt ?? now,
        read: readAlertIds.includes(`news-${position.ticker}`),
      }));

    const actionAlerts = positions
      .filter((position) => settings.enableReduceAlerts && position.action === "Reduce")
      .map((position) => ({
        id: `action-${position.ticker}`,
        ticker: position.ticker,
        title: `${position.ticker} reduce signal`,
        message: `${position.ticker} currently has a Reduce signal. Review exposure and risk drivers.`,
        severity: "high" as AlertSeverity,
        type: "action" as const,
        createdAt: position.cacheGeneratedAt ?? now,
        read: readAlertIds.includes(`action-${position.ticker}`),
      }));

    const portfolioAlert =
      overallRisk >= settings.portfolioRiskThreshold
        ? [
            {
              id: "portfolio-risk",
              title: "Portfolio risk requires attention",
              message: `Overall portfolio risk is ${overallRisk}/100. Review high-risk positions before adding more exposure.`,
              severity: overallRisk >= settings.highRiskThreshold ? ("high" as AlertSeverity) : ("medium" as AlertSeverity),
              type: "portfolio" as const,
              createdAt: now,
              read: readAlertIds.includes("portfolio-risk"),
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
    saveReadAlerts(alerts.map((alert) => alert.id));
  };

  return {
    alerts,
    unreadAlertsCount,
    latestAlerts,
    markAlertAsRead,
    markAllAlertsAsRead,
  };
}
