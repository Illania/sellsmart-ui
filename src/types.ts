export type RiskLevel = "high" | "moderate" | "low";
export type ActionType = "Reduce" | "Watch" | "Hold";
export type ViewType = "dashboard" | "portfolio" | "watchlist" | "alerts" | "insights" | "reports" | "settings" | "help";
export type AlertSeverity = "high" | "medium" | "low";

export type PortfolioAlert = {
  id: string;
  ticker?: string;
  title: string;
  message: string;
  severity: AlertSeverity;
  type: "risk" | "news" | "portfolio" | "action";
  createdAt: string;
  read: boolean;
};

export type ApiDriver = {
  label: string;
  value: number;
  impact: "high" | "medium" | "low";
  feature: string;
  message: string;
  direction: "negative" | "positive";
};

export type ApiPrediction = {
  action: string;
  action_label?: string;
  action_explanation?: string;
  ticker: string;
  drivers?: ApiDriver[];
  stress_signals?: ApiDriver[];
  supportive_signals?: ApiDriver[];
  summary?: string;
  category?: string;
  confidence?: string;
  risk_score: number;
  current_price?: number;
  market_regime?: string;
  probability_of_drop?: number;
  cache_status?: string;
  cache_generated_at?: string;
};

export type RiskAsset = {
  ticker: string;
  company: string;
  riskScore: number;
  riskLevel: RiskLevel;
  action: ActionType;
  explanation: string;
  logo: string;
  logoClass: string;
  chart: number[];
  currentPrice?: number;
  marketRegime?: string;
  confidence?: string;
  probabilityOfDrop?: number;
  cacheStatus?: string;
  cacheGeneratedAt?: string;
  drivers: ApiDriver[];
  supportiveSignals: ApiDriver[];
};

export type Position = RiskAsset & {
  shares: number;
  avgBuyPrice: number;
  value: number;
  pnl: number;
  pnlPct: number;
};

export type WatchItem = RiskAsset;

export type AppSettings = {
  highRiskThreshold: number;
  portfolioRiskThreshold: number;
  enableRiskAlerts: boolean;
  enableReduceAlerts: boolean;
  enableNewsAlerts: boolean;
  defaultView: ViewType;
};
