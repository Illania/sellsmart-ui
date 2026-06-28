export type RiskLevel = "high" | "moderate" | "low";
export type ActionType = "Reduce" | "Watch" | "Hold";
export type ViewType = "dashboard" | "portfolio" | "watchlist" | "alerts" | "insights" | "reports" | "settings" | "help" | "profile" ;
export type AlertSeverity = "high" | "medium" | "low";
export type AppearanceMode = "light" | "dark" | "system";

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
  previous_close?: number;
  daily_change?: number;
  daily_change_percent?: number;
  price_timestamp?: string;
  market_regime?: string;
  probability_of_drop?: number;
  cache_status?: string;
  cache_generated_at?: string;
};


export type PredictionJobStatus = "pending" | "processing" | "completed" | "failed" | "cancelled";

export type PredictionJob = {
  job_id?: string | null;
  ticker: string;
  status: PredictionJobStatus;
  progress?: number;
  message?: string | null;
  prediction?: ApiPrediction | null;
  prediction_json?: ApiPrediction | null;
  error_message?: string | null;
  created_at?: string;
  updated_at?: string;
  started_at?: string | null;
  completed_at?: string | null;
};

export type RiskAsset = {
  isDemo?: boolean;
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
  previousClose?: number;
  dailyChange?: number;
  dailyChangePercent?: number;
  priceTimestamp?: string;
  marketRegime?: string;
  confidence?: string;
  probabilityOfDrop?: number;
  cacheStatus?: string;
  cacheGeneratedAt?: string;
  drivers: ApiDriver[];
  supportiveSignals: ApiDriver[];
  predictionStatus?: PredictionJobStatus;
  predictionJobId?: string;
  predictionProgress?: number;
  predictionMessage?: string;
};

export type Position = RiskAsset & {
  shares: number;
  avgBuyPrice: number;
  value: number;
  pnl: number;
  pnlPct: number;
  dailyPnl: number;
  dailyPnlPct: number;
};

export type WatchItem = RiskAsset;

export type AppSettings = {
  highRiskThreshold: number;
  portfolioRiskThreshold: number;
  enableRiskAlerts: boolean;
  enableReduceAlerts: boolean;
  enableNewsAlerts: boolean;
  defaultView: ViewType;
  appearance: AppearanceMode;
};

export type SymbolSearchResult = {
  symbol: string;
  companyName: string;
  exchange?: string;
  exchangeName?: string;
  country?: string;
  currency?: string;
  type: string;
  logoUrl?: string;
  provider?: string;
  providerSymbol?: string;
};
