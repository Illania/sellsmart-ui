import { useMemo } from "react";
import type { ApiDriver, Position, RiskLevel, ViewType, WatchItem } from "../types";

export type DriverWithTicker = ApiDriver & { ticker: string };

export function usePortfolioAnalytics(activeView: ViewType, positions: Position[], watchlist: WatchItem[]) {
  const totalValue = positions.reduce((sum, item) => sum + item.value, 0);
  const totalPnl = positions.reduce((sum, item) => sum + item.pnl, 0);
  const totalCostBasis = positions.reduce((sum, item) => sum + item.shares * item.avgBuyPrice, 0);
  const totalPnlPct = totalCostBasis > 0 ? (totalPnl / totalCostBasis) * 100 : 0;

  const dailyPnl = positions.reduce((sum, item) => sum + item.dailyPnl, 0);
  const previousPortfolioValue = positions.reduce((sum, item) => {
    if (!item.previousClose) return sum;
    return sum + item.shares * item.previousClose;
  }, 0);
  const dailyPnlPct = previousPortfolioValue > 0 ? (dailyPnl / previousPortfolioValue) * 100 : 0;

  const latestPriceTimestamp = useMemo(() => {
    const timestamps = positions
      .map((position) => position.priceTimestamp)
      .filter((timestamp): timestamp is string => Boolean(timestamp));

    if (!timestamps.length) return undefined;

    return timestamps.sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0];
  }, [positions]);

  const overallRisk =
    positions.length > 0
      ? Math.round(positions.reduce((sum, item) => sum + item.riskScore, 0) / positions.length)
      : 0;

  const overallRiskLevel: RiskLevel = overallRisk >= 70 ? "high" : overallRisk >= 40 ? "moderate" : "low";

  const highRiskPositions = useMemo(
    () => positions.filter((position) => position.riskLevel === "high"),
    [positions]
  );

  const topRiskPosition = useMemo(
    () => [...positions].sort((a, b) => b.riskScore - a.riskScore)[0],
    [positions]
  );

  const reduceSignals = useMemo(
    () => positions.filter((position) => position.action === "Reduce"),
    [positions]
  );

  const riskDistribution = useMemo(() => {
    const source = activeView === "watchlist" ? watchlist : positions;
    const total = source.length || 1;
    const high = source.filter((asset) => asset.riskLevel === "high").length;
    const moderate = source.filter((asset) => asset.riskLevel === "moderate").length;
    const low = source.filter((asset) => asset.riskLevel === "low").length;

    return [
      { value: Math.round((high / total) * 100), level: "high" as RiskLevel },
      { value: Math.round((moderate / total) * 100), level: "moderate" as RiskLevel },
      { value: Math.round((low / total) * 100), level: "low" as RiskLevel },
    ];
  }, [activeView, positions, watchlist]);

  const topDrivers = useMemo<DriverWithTicker[]>(() => {
    const source = activeView === "watchlist" ? watchlist : positions;

    return source
      .flatMap((asset) => asset.drivers.map((driver) => ({ ...driver, ticker: asset.ticker })))
      .sort((a, b) => {
        const rank = { high: 3, medium: 2, low: 1 };
        return rank[b.impact] - rank[a.impact];
      })
      .slice(0, 4);
  }, [activeView, positions, watchlist]);

  const portfolioInsight = useMemo(() => {
    const highest = [...positions].sort((a, b) => b.riskScore - a.riskScore)[0];

    if (!positions.length) return "Add positions to start AI-powered portfolio risk analysis.";

    if (highRiskPositions.length > 0 && highest) {
      return `${highRiskPositions.length} of ${positions.length} positions currently show elevated downside risk. ${highest.ticker} is the main risk contributor with a score of ${highest.riskScore}/100.`;
    }

    return `Portfolio risk is currently controlled. ${positions.length} positions are monitored by SellSmart AI.`;
  }, [positions, highRiskPositions.length]);

  const watchlistOpportunity = useMemo(
    () => [...watchlist].sort((a, b) => a.riskScore - b.riskScore)[0],
    [watchlist]
  );

  return {
    totalValue,
    totalPnl,
    totalPnlPct,
    dailyPnl,
    dailyPnlPct,
    latestPriceTimestamp,
    overallRisk,
    overallRiskLevel,
    highRiskPositions,
    topRiskPosition,
    reduceSignals,
    riskDistribution,
    topDrivers,
    portfolioInsight,
    watchlistOpportunity,
  };
}
