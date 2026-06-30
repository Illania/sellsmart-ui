import { useMemo } from "react";
import type { AlertSeverity, AppSettings, PortfolioAlert, Position, ReadAlertRecord } from "../types";

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
  readAlerts: ReadAlertRecord[],
  saveReadAlerts: (ids: string[]) => void
) {
  const readAlertMap = useMemo(
    () => new Map(readAlerts.map((alert) => [alert.alertId, alert])),
    [readAlerts],
  );

  const alerts = useMemo<PortfolioAlert[]>(() => {
    const now = new Date().toISOString();
    const withReadStatus = <T extends Omit<PortfolioAlert, "read" | "readAt">>(alert: T): PortfolioAlert => {
      const readRecord = readAlertMap.get(alert.id);

      return {
        ...alert,
        read: Boolean(readRecord),
        readAt: readRecord?.readAt,
        historyCleared: Boolean(readRecord?.clearedAt),
      };
    };

    const highRiskAlerts = positions
      .filter(
        (position) =>
          settings.enableRiskAlerts &&
          (position.riskLevel === "high" || position.riskScore >= settings.highRiskThreshold)
      )
      .map((position) => {
        const createdAt = position.cacheGeneratedAt ?? now;
        const id = buildAlertId("risk", position.ticker, createdAt);

        return withReadStatus({
          id,
          ticker: position.ticker,
          title: `${position.ticker} high-risk signal`,
          message: `${position.ticker} has a risk score of ${position.riskScore}/100. Suggested action: ${position.action}.`,
          severity: "high" as AlertSeverity,
          type: "risk" as const,
          createdAt,
        });
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

        return withReadStatus({
          id,
          ticker: position.ticker,
          title: `${position.ticker} news risk detected`,
          message: "SellSmart detected news-related pressure among the top risk drivers.",
          severity: "medium" as AlertSeverity,
          type: "news" as const,
          createdAt,
        });
      });

    const actionAlerts = positions
      .filter((position) => settings.enableReduceAlerts && position.action === "Reduce")
      .map((position) => {
        const createdAt = position.cacheGeneratedAt ?? now;
        const id = buildAlertId("action", position.ticker, createdAt);

        return withReadStatus({
          id,
          ticker: position.ticker,
          title: `${position.ticker} reduce signal`,
          message: `${position.ticker} currently has a Reduce signal. Review exposure and risk drivers.`,
          severity: "high" as AlertSeverity,
          type: "action" as const,
          createdAt,
        });
      });

    const portfolioCreatedAt = now;
    const portfolioAlertId = buildAlertId("portfolio", "risk", portfolioCreatedAt);
    const portfolioAlert =
      overallRisk >= settings.portfolioRiskThreshold
        ? [
            withReadStatus({
              id: portfolioAlertId,
              title: "Portfolio risk requires attention",
              message: `Overall portfolio risk is ${overallRisk}/100. Review high-risk positions before adding more exposure.`,
              severity: overallRisk >= settings.highRiskThreshold ? ("high" as AlertSeverity) : ("medium" as AlertSeverity),
              type: "portfolio" as const,
              createdAt: portfolioCreatedAt,
            }),
          ]
        : [];

    return [...portfolioAlert, ...highRiskAlerts, ...actionAlerts, ...newsAlerts];
  }, [positions, overallRisk, readAlertMap, settings]);

  const unreadAlertsCount = alerts.filter((alert) => !alert.read).length;
  const latestAlerts = alerts.slice(0, 3);

  const markAlertAsRead = (alertId: string) => {
    saveReadAlerts([alertId]);
  };

  const markAllAlertsAsRead = () => {
    saveReadAlerts(alerts.filter((alert) => !alert.read).map((alert) => alert.id));
  };

  return {
    alerts,
    unreadAlertsCount,
    latestAlerts,
    markAlertAsRead,
    markAllAlertsAsRead,
  };
}
