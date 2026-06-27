import type { ActionType, ApiPrediction, Position, RiskAsset, RiskLevel, WatchItem } from "../types";

export const mapRiskLevel = (category?: string, score?: number): RiskLevel => {
  if (category === "high" || category === "moderate" || category === "low") return category;

  const value = score ?? 50;
  if (value >= 70) return "high";
  if (value >= 40) return "moderate";
  return "low";
};

export const mapAction = (action?: string, score?: number): ActionType => {
  const value = action?.toLowerCase() ?? "";

  if (score !== undefined) {
    if (score >= 70) return "Reduce";
    if (score >= 40) return "Watch";
    return "Hold";
  }

  if (value.includes("reduce") || value.includes("exit") || value.includes("sell")) {
    return "Reduce";
  }

  if (value.includes("hold")) {
    return "Hold";
  }

  return "Watch";
};

export const getCompanyName = (ticker: string) => {
  const known: Record<string, string> = {
    AAPL: "Apple Inc.", AMD: "Advanced Micro Devices, Inc.", NVDA: "NVIDIA Corporation",
    TSLA: "Tesla, Inc.", MSFT: "Microsoft Corporation", META: "Meta Platforms, Inc.",
    AMZN: "Amazon.com, Inc.", GOOGL: "Alphabet Inc.", JPM: "JPMorgan Chase & Co.",
    NFLX: "Netflix, Inc.", CRM: "Salesforce, Inc.", ADBE: "Adobe Inc.",
    INTC: "Intel Corporation", QCOM: "Qualcomm Incorporated", PYPL: "PayPal Holdings, Inc.",
  };

  return known[ticker] ?? `${ticker} Corporation`;
};

export const getLogoClass = (ticker: string) => {
  const known: Record<string, string> = {
    NVDA: "logo-nvda",
    TSLA: "logo-tsla",
    AAPL: "logo-aapl",
    MSFT: "logo-msft",
    AMZN: "logo-amzn",
    GOOGL: "logo-googl",
    META: "logo-meta",
    JPM: "logo-jpm",
  };

  return known[ticker] ?? "logo-jpm";
};

export const getLogoText = (ticker: string) => {
  const normalized = ticker.toUpperCase();

  // Keep the displayed ticker consistent with the actual symbol.
  return normalized;
};

export const createBaseRiskAsset = (ticker: string, isDemo = false): RiskAsset => ({
  isDemo,
  ticker,
  company: getCompanyName(ticker),
  riskScore: 50,
  riskLevel: "moderate",
  action: "Watch",
  explanation: "Generating prediction...",
  predictionStatus: "pending",
  predictionProgress: 0,
  predictionMessage: "Prediction request queued.",
  logo: getLogoText(ticker),
  logoClass: getLogoClass(ticker),
  chart: [18, 24, 20, 28, 26, 31, 29, 34, 32, 38, 35, 40],
  drivers: [],
  supportiveSignals: [],
  newsImpact: undefined,
});

export const createBasePosition = (
  ticker: string,
  shares: number,
  avgBuyPrice: number,
  isDemo = false,
): Position => ({
  ...createBaseRiskAsset(ticker, isDemo),
  shares,
  avgBuyPrice,
  value: shares * avgBuyPrice,
  pnl: 0,
  pnlPct: 0,
  dailyPnl: 0,
  dailyPnlPct: 0,
});

export const createBaseWatchItem = (ticker: string, isDemo = false): WatchItem => ({
  ...createBaseRiskAsset(ticker, isDemo),
});

export const normalizePosition = (position: Partial<Position>): Position => {
  const ticker = (position.ticker ?? "AMD").toUpperCase();
  const shares = Number(position.shares ?? 1);
  const avgBuyPrice = Number(position.avgBuyPrice) ||
    (Number(position.value) && shares > 0 ? Number(position.value) / shares : 100);

  return {
    ...createBasePosition(ticker, shares, avgBuyPrice, Boolean(position.isDemo)),
    ...position,
    ticker,
    company: position.company ?? getCompanyName(ticker),
    shares,
    avgBuyPrice,
    value: Number(position.value ?? shares * avgBuyPrice),
    pnl: Number(position.pnl ?? 0),
    pnlPct: Number(position.pnlPct ?? 0),
    dailyPnl: Number(position.dailyPnl ?? 0),
    dailyPnlPct: Number(position.dailyPnlPct ?? 0),
    riskScore: Number(position.riskScore ?? 50),
    riskLevel: mapRiskLevel(position.riskLevel, position.riskScore),
    action: position.action ?? "Watch",
    drivers: position.drivers ?? [],
    supportiveSignals: position.supportiveSignals ?? [],
    isDemo: Boolean(position.isDemo),
  };
};

export const normalizeWatchItem = (item: Partial<WatchItem>): WatchItem => {
  const ticker = (item.ticker ?? "TSLA").toUpperCase();

  return {
    ...createBaseWatchItem(ticker, Boolean(item.isDemo)),
    ...item,
    ticker,
    company: item.company ?? getCompanyName(ticker),
    riskScore: Number(item.riskScore ?? 50),
    riskLevel: mapRiskLevel(item.riskLevel, item.riskScore),
    action: item.action ?? "Watch",
    drivers: item.drivers ?? [],
    supportiveSignals: item.supportiveSignals ?? [],
    isDemo: Boolean(item.isDemo),
  };
};

export const applyPredictionToAsset = <T extends RiskAsset>(asset: T, data: ApiPrediction): T => ({
  ...asset,
  company: getCompanyName(asset.ticker),
  currentPrice: data.current_price ?? asset.currentPrice,
  previousClose: data.previous_close ?? asset.previousClose,
  dailyChange: data.daily_change ?? asset.dailyChange,
  dailyChangePercent: data.daily_change_percent ?? asset.dailyChangePercent,
  priceTimestamp: data.price_timestamp ?? asset.priceTimestamp,
  riskScore: data.risk_score,
  riskLevel: mapRiskLevel(data.category, data.risk_score),
  action: mapAction(data.action_label ?? data.action, data.risk_score),
  explanation: data.summary ?? data.action_explanation ?? "SellSmart AI prediction loaded.",
  marketRegime: data.market_regime,
  confidence: data.confidence,
  probabilityOfDrop: data.probability_of_drop,
  cacheStatus: data.cache_status,
  cacheGeneratedAt: data.cache_generated_at,
  drivers: [...(data.drivers ?? []), ...(data.stress_signals ?? [])],
  supportiveSignals: data.supportive_signals ?? [],
  newsImpact: data.news_impact ?? asset.newsImpact,
});
