import { useMemo } from "react";
import type { AlertSeverity, Position, WatchItem } from "../types";

export type SellSmartInsight = {
  id: string;
  title: string;
  text: string;
  severity: AlertSeverity;
  ticker?: string;
  reason?: string;
};

export function useInsights(
  positions: Position[],
  watchlist: WatchItem[],
  overallRisk: number,
  highRiskPositionsCount: number
) {
  return useMemo<SellSmartInsight[]>(() => {
    const items: SellSmartInsight[] = [];
    const highestRisk = [...positions].sort((a, b) => b.riskScore - a.riskScore)[0];

    if (highestRisk) {
      items.push({
        id: "top-risk",
        ticker: highestRisk.ticker,
        severity: highestRisk.riskScore >= 70 ? "high" : highestRisk.riskScore >= 40 ? "medium" : "low",
        title: `${highestRisk.ticker} is your main risk contributor`,
        text: `${highestRisk.ticker} currently has a risk score of ${highestRisk.riskScore}/100 and contributes the most downside risk to your portfolio. Suggested action: ${highestRisk.action}.`,
        reason: "Portfolio concentration",
      });
    }

    if (overallRisk >= 40) {
      items.push({
        id: "portfolio-risk-insight",
        severity: overallRisk >= 70 ? "high" : "medium",
        title: "Portfolio risk requires attention",
        text: `${highRiskPositionsCount} of ${positions.length} positions are currently high risk. Overall portfolio risk is ${overallRisk}/100.`,
        reason: "Portfolio-level signal",
      });
    }

    positions
      .filter((position) => position.action === "Reduce")
      .forEach((position) => {
        items.push({
          id: `reduce-${position.ticker}`,
          ticker: position.ticker,
          severity: "high",
          title: `${position.ticker} has a Reduce signal`,
          text: position.explanation || `${position.ticker} currently shows elevated downside risk.`,
          reason: "Action signal",
        });
      });

    positions.forEach((position) => {
      position.drivers.slice(0, 2).forEach((driver) => {
        items.push({
          id: `${position.ticker}-${driver.feature}`,
          ticker: position.ticker,
          severity: driver.impact === "high" ? "high" : driver.impact === "medium" ? "medium" : "low",
          title: `${position.ticker}: ${driver.label}`,
          text: driver.message,
          reason: driver.direction === "negative" ? "Risk driver" : "Supportive context",
        });
      });
    });

    watchlist
      .filter((item) => item.riskLevel === "low")
      .slice(0, 2)
      .forEach((item) => {
        items.push({
          id: `watchlist-opportunity-${item.ticker}`,
          ticker: item.ticker,
          severity: "low",
          title: `${item.ticker} looks lower risk on your watchlist`,
          text: `${item.ticker} currently has a risk score of ${item.riskScore}/100. This may be worth monitoring as a potential lower-risk opportunity.`,
          reason: "Watchlist opportunity",
        });
      });

    return items.slice(0, 20);
  }, [positions, watchlist, overallRisk, highRiskPositionsCount]);
}
