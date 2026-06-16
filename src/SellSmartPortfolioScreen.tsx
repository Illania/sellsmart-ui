import React, { useEffect, useMemo, useState } from "react";
import {
  Bell,
  Brain,
  ChevronRight,
  CircleHelp,
  FileText,
  Grid2X2,
  Home,
  Import,
  LayoutDashboard,
  LineChart,
  List,
  LogOut,
  Plus,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  TrendingDown,
  WalletCards,
} from "lucide-react";

import "./SellSmartPortfolioScreen.css";

type RiskLevel = "high" | "moderate" | "low";
type ActionType = "Reduce" | "Watch" | "Hold";
type ViewType = "dashboard" | "portfolio" | "watchlist" | "alerts" | "insights" | "reports";
type AlertSeverity = "high" | "medium" | "low";

type PortfolioAlert = {
  id: string;
  ticker?: string;
  title: string;
  message: string;
  severity: AlertSeverity;
  type: "risk" | "news" | "portfolio" | "action";
  createdAt: string;
  read: boolean;
};

type ApiDriver = {
  label: string;
  value: number;
  impact: "high" | "medium" | "low";
  feature: string;
  message: string;
  direction: "negative" | "positive";
};

type ApiPrediction = {
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

type RiskAsset = {
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

type Position = RiskAsset & {
  shares: number;
  avgBuyPrice: number;
  value: number;
  pnl: number;
  pnlPct: number;
};

type WatchItem = RiskAsset;

const API_BASE_URL = "https://sellsmart-ml-api.onrender.com";
const POSITIONS_STORAGE_KEY = "sellsmart_positions";
const WATCHLIST_STORAGE_KEY = "sellsmart_watchlist";
const ALERTS_READ_STORAGE_KEY = "sellsmart_alerts_read";

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

const mapRiskLevel = (category?: string, score?: number): RiskLevel => {
  if (category === "high" || category === "moderate" || category === "low") return category;

  const value = score ?? 50;
  if (value >= 70) return "high";
  if (value >= 40) return "moderate";
  return "low";
};

const mapAction = (action?: string): ActionType => {
  const value = action?.toLowerCase() ?? "";

  if (value.includes("reduce") || value.includes("exit") || value.includes("sell")) return "Reduce";
  if (value.includes("hold")) return "Hold";

  return "Watch";
};

const getCompanyName = (ticker: string) => {
  const known: Record<string, string> = {
    AAPL: "Apple Inc.",
    AMD: "Advanced Micro Devices, Inc.",
    NVDA: "NVIDIA Corporation",
    TSLA: "Tesla, Inc.",
    MSFT: "Microsoft Corporation",
    META: "Meta Platforms, Inc.",
    AMZN: "Amazon.com, Inc.",
    GOOGL: "Alphabet Inc.",
    JPM: "JPMorgan Chase & Co.",
    NFLX: "Netflix, Inc.",
    CRM: "Salesforce, Inc.",
    ADBE: "Adobe Inc.",
    INTC: "Intel Corporation",
    QCOM: "Qualcomm Incorporated",
    PYPL: "PayPal Holdings, Inc.",
  };

  return known[ticker] ?? `${ticker} Corporation`;
};

const getLogoClass = (ticker: string) => {
  const known: Record<string, string> = {
    NVDA: "logo-nvda",
    TSLA: "logo-tsla",
    AAPL: "logo-aapl",
    MSFT: "logo-msft",
    AMZN: "logo-amzn",
  };

  return known[ticker] ?? "logo-jpm";
};

const createBaseRiskAsset = (ticker: string): RiskAsset => ({
  ticker,
  company: getCompanyName(ticker),
  riskScore: 50,
  riskLevel: "moderate",
  action: "Watch",
  explanation: "Loading SellSmart AI prediction...",
  logo: ticker.slice(0, 3),
  logoClass: getLogoClass(ticker),
  chart: [18, 24, 20, 28, 26, 31, 29, 34, 32, 38, 35, 40],
  drivers: [],
  supportiveSignals: [],
});

const createBasePosition = (ticker: string, shares: number, avgBuyPrice: number): Position => ({
  ...createBaseRiskAsset(ticker),
  shares,
  avgBuyPrice,
  value: shares * avgBuyPrice,
  pnl: 0,
  pnlPct: 0,
});

const createBaseWatchItem = (ticker: string): WatchItem => ({
  ...createBaseRiskAsset(ticker),
});

const normalizePosition = (position: Partial<Position>): Position => {
  const ticker = (position.ticker ?? "AMD").toUpperCase();
  const shares = Number(position.shares ?? 1);
  const avgBuyPrice =
    Number(position.avgBuyPrice) ||
    (Number(position.value) && shares > 0 ? Number(position.value) / shares : 100);

  return {
    ...createBasePosition(ticker, shares, avgBuyPrice),
    ...position,
    ticker,
    company: position.company ?? getCompanyName(ticker),
    shares,
    avgBuyPrice,
    value: Number(position.value ?? shares * avgBuyPrice),
    pnl: Number(position.pnl ?? 0),
    pnlPct: Number(position.pnlPct ?? 0),
    riskScore: Number(position.riskScore ?? 50),
    riskLevel: mapRiskLevel(position.riskLevel, position.riskScore),
    action: position.action ?? "Watch",
    drivers: position.drivers ?? [],
    supportiveSignals: position.supportiveSignals ?? [],
  };
};

const normalizeWatchItem = (item: Partial<WatchItem>): WatchItem => {
  const ticker = (item.ticker ?? "TSLA").toUpperCase();

  return {
    ...createBaseWatchItem(ticker),
    ...item,
    ticker,
    company: item.company ?? getCompanyName(ticker),
    riskScore: Number(item.riskScore ?? 50),
    riskLevel: mapRiskLevel(item.riskLevel, item.riskScore),
    action: item.action ?? "Watch",
    drivers: item.drivers ?? [],
    supportiveSignals: item.supportiveSignals ?? [],
  };
};

const demoPositions: Position[] = [
  createBasePosition("NVDA", 10, 180),
  createBasePosition("AMD", 20, 120),
  createBasePosition("AAPL", 15, 190),
  createBasePosition("MSFT", 8, 430),
  createBasePosition("TSLA", 12, 260),
  createBasePosition("INTC", 50, 28),
  createBasePosition("META", 6, 620),
  createBasePosition("GOOGL", 10, 180),
  createBasePosition("AMZN", 8, 210),
  createBasePosition("JPM", 12, 250),
];

const demoWatchlist: WatchItem[] = [
  createBaseWatchItem("TSLA"),
  createBaseWatchItem("META"),
  createBaseWatchItem("GOOGL"),
  createBaseWatchItem("NFLX"),
];

const fetchPrediction = async (ticker: string): Promise<ApiPrediction> => {
  const response = await fetch(
    `${API_BASE_URL}/predict?ticker=${encodeURIComponent(ticker)}&live=false`
  );

  if (!response.ok) {
    throw new Error(`Failed to load prediction for ${ticker}`);
  }

  return response.json();
};

const applyPredictionToAsset = <T extends RiskAsset>(asset: T, data: ApiPrediction): T => ({
  ...asset,
  company: getCompanyName(asset.ticker),
  currentPrice: data.current_price ?? asset.currentPrice,
  riskScore: data.risk_score,
  riskLevel: mapRiskLevel(data.category, data.risk_score),
  action: mapAction(data.action_label ?? data.action),
  explanation: data.summary ?? data.action_explanation ?? "SellSmart AI prediction loaded.",
  marketRegime: data.market_regime,
  confidence: data.confidence,
  probabilityOfDrop: data.probability_of_drop,
  cacheStatus: data.cache_status,
  cacheGeneratedAt: data.cache_generated_at,
  drivers: [...(data.drivers ?? []), ...(data.stress_signals ?? [])],
  supportiveSignals: data.supportive_signals ?? [],
});

const enrichPositionWithApi = async (position: Position): Promise<Position> => {
  const data = await fetchPrediction(position.ticker);
  const currentPrice = data.current_price ?? position.currentPrice ?? position.avgBuyPrice;
  const value = position.shares * currentPrice;
  const costBasis = position.shares * position.avgBuyPrice;
  const pnl = value - costBasis;
  const pnlPct = costBasis > 0 ? (pnl / costBasis) * 100 : 0;

  return {
    ...applyPredictionToAsset(position, data),
    currentPrice,
    value,
    pnl,
    pnlPct,
  };
};

const enrichWatchItemWithApi = async (item: WatchItem): Promise<WatchItem> => {
  const data = await fetchPrediction(item.ticker);
  return applyPredictionToAsset(item, data);
};

export default function SellSmartPortfolioScreen() {
  const [activeView, setActiveView] = useState<ViewType>("dashboard");

  const [positions, setPositions] = useState<Position[]>([]);
  const [watchlist, setWatchlist] = useState<WatchItem[]>([]);
  const [readAlertIds, setReadAlertIds] = useState<string[]>([]);

  const [sortBy, setSortBy] = useState("risk");
  const [expandedTicker, setExpandedTicker] = useState<string | null>(null);
  const [isLoadingPredictions, setIsLoadingPredictions] = useState(false);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTicker, setNewTicker] = useState("");
  const [newShares, setNewShares] = useState("");
  const [newAvgBuyPrice, setNewAvgBuyPrice] = useState("");

  const [isWatchModalOpen, setIsWatchModalOpen] = useState(false);
  const [newWatchTicker, setNewWatchTicker] = useState("");

  const savePositions = (nextPositions: Position[]) => {
    setPositions(nextPositions);
    localStorage.setItem(POSITIONS_STORAGE_KEY, JSON.stringify(nextPositions));
  };

  const saveWatchlist = (nextWatchlist: WatchItem[]) => {
    setWatchlist(nextWatchlist);
    localStorage.setItem(WATCHLIST_STORAGE_KEY, JSON.stringify(nextWatchlist));
  };

  const saveReadAlerts = (nextReadAlertIds: string[]) => {
    setReadAlertIds(nextReadAlertIds);
    localStorage.setItem(ALERTS_READ_STORAGE_KEY, JSON.stringify(nextReadAlertIds));
  };

  const refreshPositions = async (basePositions: Position[]) => {
    setIsLoadingPredictions(true);

    try {
      const enriched = await Promise.all(
        basePositions.map(async (position) => {
          try {
            return await enrichPositionWithApi(position);
          } catch (error) {
            console.error(error);
            return {
              ...position,
              explanation: `Could not load API prediction for ${position.ticker}.`,
            };
          }
        })
      );

      savePositions(enriched);
    } finally {
      setIsLoadingPredictions(false);
    }
  };

  const refreshWatchlist = async (baseWatchlist: WatchItem[]) => {
    setIsLoadingPredictions(true);

    try {
      const enriched = await Promise.all(
        baseWatchlist.map(async (item) => {
          try {
            return await enrichWatchItemWithApi(item);
          } catch (error) {
            console.error(error);
            return {
              ...item,
              explanation: `Could not load API prediction for ${item.ticker}.`,
            };
          }
        })
      );

      saveWatchlist(enriched);
    } finally {
      setIsLoadingPredictions(false);
    }
  };

  useEffect(() => {
    const savedReadAlerts = localStorage.getItem(ALERTS_READ_STORAGE_KEY);
    setReadAlertIds(savedReadAlerts ? JSON.parse(savedReadAlerts) : []);

    const savedPositions = localStorage.getItem(POSITIONS_STORAGE_KEY);
    const rawPositions = savedPositions ? JSON.parse(savedPositions) : demoPositions;
    const basePositions: Position[] = rawPositions.map(normalizePosition);

    const savedWatchlist = localStorage.getItem(WATCHLIST_STORAGE_KEY);
    const rawWatchlist = savedWatchlist ? JSON.parse(savedWatchlist) : demoWatchlist;
    const baseWatchlist: WatchItem[] = rawWatchlist.map(normalizeWatchItem);

    setPositions(basePositions);
    setWatchlist(baseWatchlist);

    localStorage.setItem(POSITIONS_STORAGE_KEY, JSON.stringify(basePositions));
    localStorage.setItem(WATCHLIST_STORAGE_KEY, JSON.stringify(baseWatchlist));

    refreshPositions(basePositions);
    refreshWatchlist(baseWatchlist);
  }, []);

  const importDemoPortfolio = () => {
    savePositions(demoPositions);
    saveWatchlist(demoWatchlist);
    saveReadAlerts([]);
    refreshPositions(demoPositions);
    refreshWatchlist(demoWatchlist);
  };

  const addPosition = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const ticker = newTicker.trim().toUpperCase();
    const shares = Number(newShares);
    const avgBuyPrice = Number(newAvgBuyPrice);

    if (!ticker || shares <= 0 || avgBuyPrice <= 0) {
      alert("Please fill ticker, shares and average buy price.");
      return;
    }

    const basePosition = createBasePosition(ticker, shares, avgBuyPrice);
    const nextPositions = [...positions.filter((p) => p.ticker !== ticker), basePosition];

    savePositions(nextPositions);

    setNewTicker("");
    setNewShares("");
    setNewAvgBuyPrice("");
    setIsAddModalOpen(false);
    setExpandedTicker(ticker);
    setActiveView("portfolio");

    try {
      const enrichedPosition = await enrichPositionWithApi(basePosition);
      savePositions(nextPositions.map((position) => (position.ticker === ticker ? enrichedPosition : position)));
    } catch (error) {
      console.error(error);
    }
  };

  const addWatchItem = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const ticker = newWatchTicker.trim().toUpperCase();

    if (!ticker) {
      alert("Please enter ticker.");
      return;
    }

    const baseItem = createBaseWatchItem(ticker);
    const nextWatchlist = [...watchlist.filter((item) => item.ticker !== ticker), baseItem];

    saveWatchlist(nextWatchlist);

    setNewWatchTicker("");
    setIsWatchModalOpen(false);
    setExpandedTicker(ticker);
    setActiveView("watchlist");

    try {
      const enrichedItem = await enrichWatchItemWithApi(baseItem);
      saveWatchlist(nextWatchlist.map((item) => (item.ticker === ticker ? enrichedItem : item)));
    } catch (error) {
      console.error(error);
    }
  };

  const sortedPositions = useMemo(() => {
    return [...positions].sort((a, b) => {
      if (sortBy === "risk") return b.riskScore - a.riskScore;
      if (sortBy === "value") return b.value - a.value;
      return b.pnlPct - a.pnlPct;
    });
  }, [positions, sortBy]);

  const sortedWatchlist = useMemo(() => {
    return [...watchlist].sort((a, b) => b.riskScore - a.riskScore);
  }, [watchlist]);

  const totalValue = positions.reduce((sum, item) => sum + item.value, 0);
  const totalPnl = positions.reduce((sum, item) => sum + item.pnl, 0);
  const totalCostBasis = positions.reduce((sum, item) => sum + item.shares * item.avgBuyPrice, 0);
  const totalPnlPct = totalCostBasis > 0 ? (totalPnl / totalCostBasis) * 100 : 0;

  const overallRisk =
    positions.length > 0
      ? Math.round(positions.reduce((sum, item) => sum + item.riskScore, 0) / positions.length)
      : 0;

  const overallRiskLevel: RiskLevel =
    overallRisk >= 70 ? "high" : overallRisk >= 40 ? "moderate" : "low";

  const riskDistribution = useMemo(() => {
    const source = activeView === "watchlist" ? watchlist : positions;
    const total = source.length || 1;
    const high = source.filter((p) => p.riskLevel === "high").length;
    const moderate = source.filter((p) => p.riskLevel === "moderate").length;
    const low = source.filter((p) => p.riskLevel === "low").length;

    return [
      { value: Math.round((high / total) * 100), level: "high" as RiskLevel },
      { value: Math.round((moderate / total) * 100), level: "moderate" as RiskLevel },
      { value: Math.round((low / total) * 100), level: "low" as RiskLevel },
    ];
  }, [activeView, positions, watchlist]);

  const topDrivers = useMemo(() => {
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
    const highRisk = positions.filter((p) => p.riskLevel === "high");
    const highest = [...positions].sort((a, b) => b.riskScore - a.riskScore)[0];

    if (!positions.length) return "Add positions to start AI-powered portfolio risk analysis.";

    if (highRisk.length > 0 && highest) {
      return `${highRisk.length} of ${positions.length} positions currently show elevated downside risk. ${highest.ticker} is the main risk contributor with a score of ${highest.riskScore}/100.`;
    }

    return `Portfolio risk is currently controlled. ${positions.length} positions are monitored by SellSmart AI.`;
  }, [positions]);

  const highRiskPositions = positions.filter(
    (position) => position.riskLevel === "high"
  );

  const topRiskPosition = [...positions].sort(
    (a, b) => b.riskScore - a.riskScore
  )[0];

  const reduceSignals = positions.filter(
    (position) => position.action === "Reduce"
  );

  const insights = useMemo(() => {
    const items: {
      id: string;
      title: string;
      text: string;
      severity: AlertSeverity;
      ticker?: string;
      reason?: string;
    }[] = [];

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
        text: `${highRiskPositions.length} of ${positions.length} positions are currently high risk. Overall portfolio risk is ${overallRisk}/100.`,
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
  }, [positions, watchlist, overallRisk]);

  const alerts = useMemo<PortfolioAlert[]>(() => {
    const now = new Date().toISOString();

    const highRiskAlerts = positions
      .filter((position) => position.riskLevel === "high" || position.riskScore >= 70)
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
      .filter((position) =>
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
      .filter((position) => position.action === "Reduce")
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
      overallRisk >= 40
        ? [
            {
              id: "portfolio-risk",
              title: "Portfolio risk requires attention",
              message: `Overall portfolio risk is ${overallRisk}/100. Review high-risk positions before adding more exposure.`,
              severity: overallRisk >= 70 ? ("high" as AlertSeverity) : ("medium" as AlertSeverity),
              type: "portfolio" as const,
              createdAt: now,
              read: readAlertIds.includes("portfolio-risk"),
            },
          ]
        : [];

    return [...portfolioAlert, ...highRiskAlerts, ...actionAlerts, ...newsAlerts];
  }, [positions, overallRisk, readAlertIds]);

  const unreadAlertsCount = alerts.filter((alert) => !alert.read).length;
  const latestAlerts = alerts.slice(0, 3);
  const watchlistOpportunity = [...watchlist].sort((a, b) => a.riskScore - b.riskScore)[0];

  const markAlertAsRead = (alertId: string) => {
    saveReadAlerts(Array.from(new Set([...readAlertIds, alertId])));
  };

  const markAllAlertsAsRead = () => {
    saveReadAlerts(alerts.map((alert) => alert.id));
  };

  const reportGeneratedAt = new Date();

  const pageTitle =
    activeView === "dashboard"
      ? "Dashboard"
      : activeView === "portfolio"
        ? "My Portfolio"
        : activeView === "watchlist"
          ? "Watchlist"
          : activeView === "alerts"
            ? "Alerts"
            : activeView === "insights"
              ? "Insights"
              : "Reports";

  const pageSubtitle =
    activeView === "dashboard"
      ? "Your AI-powered risk command center"
      : activeView === "portfolio"
        ? "AI-powered risk analysis of your investments"
        : activeView === "watchlist"
          ? "Track stocks before adding them to your portfolio"
          : activeView === "alerts"
            ? "Real-time risk alerts from SellSmart AI"
            : activeView === "insights"
              ? "AI-generated explanations behind portfolio risk"
              : "Portfolio risk reports and AI-generated summaries";

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">
            <span />
            <span />
            <span />
            <span />
          </div>
          <strong>
            Sell<span>Smart</span>
          </strong>
        </div>

        <nav className="nav-list">
          {[
            { label: "Dashboard", icon: Home, view: "dashboard" as ViewType },
            { label: "Portfolio", icon: WalletCards, view: "portfolio" as ViewType },
            { label: "Watchlist", icon: ShieldCheck, view: "watchlist" as ViewType },
            { label: "Alerts", icon: Bell, view: "alerts" as ViewType },
            { label: "Insights", icon: LineChart, view: "insights" as ViewType },
            { label: "Reports", icon: FileText, view: "reports" as ViewType },
            { label: "Settings", icon: Settings },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = item.view === activeView;

            return (
              <button
                key={item.label}
                className={`nav-item ${isActive ? "active" : ""}`}
                onClick={() => item.view && setActiveView(item.view)}
              >
                <Icon size={19} />
                {item.label}
                {item.label === "Alerts" && unreadAlertsCount > 0 && (
                  <span className="nav-badge">{unreadAlertsCount}</span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="demo-card">
          <div className="demo-icon">♙</div>
          <div>
            <strong>{isLoadingPredictions ? "Loading AI" : "SellSmart AI"}</strong>
            <p>
              <span /> Risk Intelligence
            </p>
          </div>
        </div>

        <div className="sidebar-footer">
          <button className="nav-item">
            <CircleHelp size={18} />
            Help Center
          </button>
          <button className="nav-item">
            <LogOut size={18} />
            Log out
          </button>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div />
          <div className="topbar-actions">
            {activeView === "portfolio" ? (
              <button className="secondary-button" onClick={() => setIsAddModalOpen(true)}>
                <Plus size={18} />
                Add Position
              </button>
            ) : activeView === "watchlist" ? (
              <button className="secondary-button" onClick={() => setIsWatchModalOpen(true)}>
                <Plus size={18} />
                Add Ticker
              </button>
            ) : activeView === "alerts" ? (
              <button className="secondary-button" onClick={markAllAlertsAsRead}>
                Mark All Read
              </button>
            ) : activeView === "reports" ? (
              <button className="secondary-button" onClick={() => window.print()}>
                <FileText size={18} />
                Export PDF
              </button>
            ) : (
              <button className="secondary-button" onClick={() => setIsAddModalOpen(true)}>
                <Plus size={18} />
                Add Position
              </button>
            )}

            <button className="secondary-button" onClick={importDemoPortfolio}>
              <Import size={16} />
              Import Demo
            </button>

           <button
          type="button"
          className="icon-button top-alert-button"
          onClick={() => setActiveView("alerts")}
          aria-label="Open alerts"
        >
          <Bell size={20} />

          {unreadAlertsCount > 0 && (
            <span className="top-alert-badge" aria-hidden="true" />
          )}
        </button>

            <button className="avatar">AS</button>
          </div>
        </header>

        <section className="page-header">
          <div>
            <h1>{pageTitle}</h1>
            <p>{pageSubtitle}</p>
          </div>
          <div className="market-status">
            <strong>
              <span /> Market Analysis Ready
            </strong>
            <p>Real-time portfolio risk insights</p>
          </div>
        </section>

        {activeView === "dashboard" ? (
          <section className="dashboard-page">
            <section className="summary-grid">
              <SummaryCard title="Portfolio Risk">
                <div className="score-line">
                  <strong>{overallRisk}</strong>
                  <span>/100</span>
                </div>
                <p className={overallRiskLevel === "high" ? "negative" : overallRiskLevel === "moderate" ? "warning" : "positive"}>
                  {overallRiskLevel === "high"
                    ? "High Risk"
                    : overallRiskLevel === "moderate"
                      ? "Moderate Risk"
                      : "Low Risk"}
                </p>
                <div className="risk-meter">
                  <span style={{ width: `${overallRisk}%` }} />
                </div>
              </SummaryCard>

              <SummaryCard title="Active Alerts">
                <h2>{unreadAlertsCount}</h2>
                <p className={unreadAlertsCount > 0 ? "negative" : "positive"}>
                  {unreadAlertsCount > 0 ? "Needs review" : "All clear"}
                </p>
                <button className="mini-link-button" onClick={() => setActiveView("alerts")}>
                  View alerts <ChevronRight size={16} />
                </button>
              </SummaryCard>

              <SummaryCard title="High-Risk Positions">
                <h2>{highRiskPositions.length}</h2>
                <p className={highRiskPositions.length > 0 ? "negative" : "positive"}>
                  {highRiskPositions.length > 0 ? "Elevated downside risk" : "No high-risk positions"}
                </p>
              </SummaryCard>

              <SummaryCard title="Reduce Signals">
                <h2>{reduceSignals.length}</h2>
                <p className={reduceSignals.length > 0 ? "negative" : "positive"}>
                  {reduceSignals.length > 0 ? "Action suggested" : "No reduce signals"}
                </p>
              </SummaryCard>
            </section>

            <section className="dashboard-grid">
              <article className="dashboard-card large">
                <div className="dashboard-card-header">
                  <div>
                    <h2>Today’s Risk Brief</h2>
                    <p>SellSmart AI summary based on your current portfolio.</p>
                  </div>
                  <Brain size={30} />
                </div>

                <p className="dashboard-brief">{portfolioInsight}</p>

                {topRiskPosition && (
                  <div className="dashboard-highlight">
                    <span>Main risk contributor</span>
                    <strong>{topRiskPosition.ticker}</strong>
                    <p>
                      Risk score {topRiskPosition.riskScore}/100 · Suggested action:{" "}
                      {topRiskPosition.action}
                    </p>
                  </div>
                )}
              </article>

              <article className="dashboard-card">
                <div className="dashboard-card-header">
                  <div>
                    <h2>Top Alerts</h2>
                    <p>Most important alerts right now.</p>
                  </div>
                  <Bell size={26} />
                </div>

                <div className="dashboard-alert-list">
                  {latestAlerts.length > 0 ? (
                    latestAlerts.map((alert) => (
                      <button
                        key={alert.id}
                        className="dashboard-alert-item"
                        onClick={() => setActiveView("alerts")}
                      >
                        <span className={`alert-dot ${alert.severity}`} />
                        <div>
                          <strong>{alert.title}</strong>
                          <p>{alert.message}</p>
                        </div>
                      </button>
                    ))
                  ) : (
                    <p className="muted-text">No active alerts.</p>
                  )}
                </div>
              </article>

              <article className="dashboard-card">
                <div className="dashboard-card-header">
                  <div>
                    <h2>Watchlist Opportunity</h2>
                    <p>Lowest-risk ticker on your watchlist.</p>
                  </div>
                  <ShieldCheck size={26} />
                </div>

                {watchlistOpportunity ? (
                  <div className="dashboard-highlight compact">
                    <span>{watchlistOpportunity.company}</span>
                    <strong>{watchlistOpportunity.ticker}</strong>
                    <p>
                      Risk score {watchlistOpportunity.riskScore}/100 ·{" "}
                      {watchlistOpportunity.action}
                    </p>
                  </div>
                ) : (
                  <p className="muted-text">Add tickers to your watchlist.</p>
                )}

                <button className="primary-button full" onClick={() => setActiveView("watchlist")}>
                  Open Watchlist <ChevronRight size={18} />
                </button>
              </article>
            </section>
          </section>
        ) : activeView === "insights" ? (
          <section className="insights-page">
            <div className="panel-header">
              <div>
                <h2>AI Insights</h2>
                <p className="muted-text">
                  Explainable risk intelligence generated from portfolio and watchlist data.
                </p>
              </div>

              <button className="secondary-button" onClick={() => setActiveView("portfolio")}>
                Review Portfolio
              </button>
            </div>

            <section className="insights-hero">
              <div className="insight-copy">
                <Brain size={34} />
                <div>
                  <h2>Today’s AI Explanation</h2>
                  <p>{portfolioInsight}</p>
                </div>
              </div>

              <div className="insights-hero-stats">
                <div>
                  <span>Portfolio risk</span>
                  <strong>{overallRisk}/100</strong>
                </div>
                <div>
                  <span>High-risk positions</span>
                  <strong>{highRiskPositions.length}</strong>
                </div>
                <div>
                  <span>Reduce signals</span>
                  <strong>{reduceSignals.length}</strong>
                </div>
              </div>
            </section>

            <div className="insights-grid">
              {insights.length > 0 ? (
                insights.map((insight) => (
                  <article key={insight.id} className={`insight-driver-card ${insight.severity}`}>
                    <div className="insight-driver-header">
                      <Brain size={22} />
                      <span>{insight.reason ?? insight.severity.toUpperCase()}</span>
                    </div>

                    <h3>{insight.title}</h3>
                    <p>{insight.text}</p>

                    {insight.ticker && (
                      <button
                        className="mini-link-button"
                        onClick={() => {
                          setExpandedTicker(insight.ticker ?? null);
                          setActiveView("portfolio");
                        }}
                      >
                        Open {insight.ticker} <ChevronRight size={16} />
                      </button>
                    )}
                  </article>
                ))
              ) : (
                <div className="empty-alerts">
                  <Brain size={34} />
                  <h3>No insights available</h3>
                  <p>Add positions to generate AI explanations.</p>
                </div>
              )}
            </div>
          </section>
         ) : activeView === "reports" ? (
          <section className="reports-page">
            <div className="panel-header">
              <div>
                <h2>Weekly AI Risk Report</h2>
                <p className="muted-text">
                  Generated {reportGeneratedAt.toLocaleDateString()} · Based on current SellSmart AI signals.
                </p>
              </div>

              <button className="secondary-button" onClick={() => window.print()}>
                <FileText size={18} />
                Export PDF
              </button>
            </div>

            <section className="reports-grid">
              <article className="report-card">
                <span>Portfolio Risk</span>
                <strong>{overallRisk}/100</strong>
                <p>
                  {overallRiskLevel === "high"
                    ? "High risk"
                    : overallRiskLevel === "moderate"
                      ? "Moderate risk"
                      : "Low risk"}
                </p>
              </article>

              <article className="report-card">
                <span>High-Risk Positions</span>
                <strong>{highRiskPositions.length}</strong>
                <p>Positions with elevated downside risk</p>
              </article>

              <article className="report-card">
                <span>Reduce Signals</span>
                <strong>{reduceSignals.length}</strong>
                <p>Positions requiring review</p>
              </article>
            </section>

            <article className="report-preview">
              <div className="report-preview-header">
                <div>
                  <h3>Portfolio Risk Summary</h3>
                  <p className="muted-text">
                    AI-generated report for your current portfolio snapshot.
                  </p>
                </div>

                <FileText size={30} />
              </div>

              <section className="report-section first">
                <h4>Executive summary</h4>
                <p>{portfolioInsight}</p>
              </section>

              {topRiskPosition && (
                <section className="report-section">
                  <h4>Main risk contributor</h4>
                  <p>
                    <strong>{topRiskPosition.ticker}</strong> has a risk score of{" "}
                    <strong>{topRiskPosition.riskScore}/100</strong>. Suggested action:{" "}
                    <strong>{topRiskPosition.action}</strong>.
                  </p>
                </section>
              )}

              <section className="report-section">
                <h4>Positions requiring attention</h4>

                {reduceSignals.length > 0 ? (
                  <div className="report-table">
                    {reduceSignals.map((position) => (
                      <div key={position.ticker} className="report-row">
                        <span>{position.ticker}</span>
                        <strong>{position.riskScore}/100</strong>
                        <em>{position.action}</em>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="muted-text">No reduce signals at this time.</p>
                )}
              </section>

              <section className="report-section">
                <h4>Top risk drivers</h4>

                {topDrivers.length > 0 ? (
                  <div className="report-driver-list">
                    {topDrivers.map((driver) => (
                      <div key={`${driver.ticker}-${driver.feature}`} className="report-driver">
                        <div>
                          <strong>{driver.ticker}: {driver.label}</strong>
                          <p>{driver.message}</p>
                        </div>
                        <span className={`alert-severity ${driver.impact}`}>{driver.impact}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="muted-text">Risk drivers are still loading.</p>
                )}
              </section>

              <section className="report-section">
                <h4>Suggested review actions</h4>

                {reduceSignals.length > 0 ? (
                  <ul className="report-actions-list">
                    {reduceSignals.slice(0, 5).map((position) => (
                      <li key={`action-${position.ticker}`}>
                        Review <strong>{position.ticker}</strong> exposure and check the latest risk drivers before adding more capital.
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="muted-text">
                    No urgent review actions. Continue monitoring your portfolio risk score and alerts.
                  </p>
                )}
              </section>

              <div className="report-disclaimer">
                SellSmart provides AI-powered risk analysis and insights only. This report is not financial advice.
              </div>
            </article>
          </section>
        ) : activeView === "alerts" ? (
          <section className="alerts-page">
            <div className="panel-header">
              <div>
                <h2>Risk Alerts</h2>
                <p className="muted-text">
                  {unreadAlertsCount} unread alert{unreadAlertsCount === 1 ? "" : "s"}
                </p>
              </div>

              {alerts.length > 0 && (
                <button className="secondary-button" onClick={markAllAlertsAsRead}>
                  Mark all as read
                </button>
              )}
            </div>

            {alerts.length > 0 ? (
              <div className="alerts-list">
                {alerts.map((alert) => (
                  <article
                    key={alert.id}
                    className={`alert-card ${alert.severity} ${alert.read ? "read" : "unread"}`}
                  >
                    <div className="alert-icon">
                      <Bell size={20} />
                    </div>

                    <div className="alert-content">
                      <div className="alert-title-line">
                        <h3>{alert.title}</h3>
                        <span className={`alert-severity ${alert.severity}`}>{alert.severity}</span>
                      </div>

                      <p>{alert.message}</p>

                      <span className="alert-time">{new Date(alert.createdAt).toLocaleString()}</span>
                    </div>

                    {!alert.read && (
                      <button className="secondary-button" onClick={() => markAlertAsRead(alert.id)}>
                        Mark read
                      </button>
                    )}
                  </article>
                ))}
              </div>
            ) : (
              <div className="empty-alerts">
                <Bell size={34} />
                <h3>No active alerts</h3>
                <p>Your portfolio does not currently show urgent risk alerts.</p>
              </div>
            )}
          </section>
        ) : (
          <>
            {activeView === "portfolio" ? (
              <>
                <section className="summary-grid">
                  <SummaryCard title="Portfolio Value">
                    <h2>{money.format(totalValue)}</h2>
                    <p className={totalPnl >= 0 ? "positive" : "negative"}>
                      {totalPnl >= 0 ? "+" : ""}
                      {money.format(totalPnl)} ({totalPnlPct.toFixed(2)}%)
                    </p>
                    <Sparkline
                      data={[12, 16, 24, 19, 28, 32, 27, 20, 17, 22, 36, 42, 39, 31, 36, 47, 50]}
                      tone="purple"
                    />
                  </SummaryCard>

                  <SummaryCard title="Overall Risk ⓘ">
                    <div className="score-line">
                      <strong>{overallRisk}</strong>
                      <span>/100</span>
                    </div>
                    <p className={overallRiskLevel === "high" ? "negative" : "warning"}>
                      {overallRiskLevel === "high"
                        ? "High Risk"
                        : overallRiskLevel === "moderate"
                          ? "Moderate Risk"
                          : "Low Risk"}
                    </p>
                    <div className="risk-meter">
                      <span style={{ width: `${overallRisk}%` }} />
                    </div>
                    <div className="meter-labels">
                      <span>0</span>
                      <span>100</span>
                    </div>
                  </SummaryCard>

                  <SummaryCard title="Daily PNL">
                    <h2 className={totalPnl >= 0 ? "positive" : "negative"}>
                      {totalPnl >= 0 ? "+" : ""}
                      {money.format(totalPnl)}
                    </h2>
                    <p className={totalPnl >= 0 ? "positive" : "negative"}>({totalPnlPct.toFixed(2)}%)</p>
                    <Sparkline data={[10, 18, 17, 11, 20, 22, 17, 19, 26, 24, 18, 20, 14, 17, 15]} />
                  </SummaryCard>

                  <SummaryCard title="Positions">
                    <div className="positions-summary">
                      <div>
                        <h2>{positions.length}</h2>
                        <p>Diversified</p>
                      </div>
                      <Donut segments={riskDistribution} />
                    </div>
                  </SummaryCard>
                </section>

                <section className="insight-card">
                  <div className="insight-copy">
                    <Brain size={34} />
                    <div>
                      <h2>Portfolio Insight</h2>
                      <p>{portfolioInsight}</p>
                    </div>
                  </div>

                  <div className="insight-visual">
                    <Sparkline
                      data={[20, 28, 24, 31, 33, 29, 36, 43, 38, 50, 62, 58, 54, 59, 66, 61, 57, 69, 72, 63, 60, 73]}
                      tone="purple"
                    />
                  </div>

                  <button className="primary-button">
                    View Details <ChevronRight size={18} />
                  </button>
                </section>
              </>
            ) : (
              <section className="insight-card">
                <div className="insight-copy">
                  <Brain size={34} />
                  <div>
                    <h2>Watchlist Intelligence</h2>
                    <p>
                      Monitor stocks before buying. SellSmart highlights panic-risk signals, sentiment pressure,
                      and short-term downside risk.
                    </p>
                  </div>
                </div>

                <button className="primary-button" onClick={() => setIsWatchModalOpen(true)}>
                  Add Ticker <Plus size={18} />
                </button>
              </section>
            )}

            <div className="content-grid">
              <section className="positions-panel">
                <div className="panel-header">
                  <h2>{activeView === "portfolio" ? "Your Positions" : "Your Watchlist"}</h2>
                  <div className="sort-area">
                    <span>Sort by</span>
                    <select value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
                      <option value="risk">Risk (High to Low)</option>
                      {activeView === "portfolio" && <option value="value">Value</option>}
                      {activeView === "portfolio" && <option value="pnl">PNL</option>}
                    </select>
                    <button className="icon-button active">
                      <Grid2X2 size={18} />
                    </button>
                    <button className="icon-button">
                      <List size={18} />
                    </button>
                  </div>
                </div>

                <div className="table-head">
                  <span>{activeView === "portfolio" ? "Position" : "Ticker"}</span>
                  <span>{activeView === "portfolio" ? "Value / PNL" : "Price"}</span>
                  <span>Risk Score</span>
                  <span>Action</span>
                </div>

                <div className="position-list">
                  {activeView === "portfolio"
                    ? sortedPositions.map((position) => (
                        <PositionRow
                          key={position.ticker}
                          position={position}
                          isExpanded={expandedTicker === position.ticker}
                          onToggle={() =>
                            setExpandedTicker(expandedTicker === position.ticker ? null : position.ticker)
                          }
                        />
                      ))
                    : sortedWatchlist.map((item) => (
                        <WatchlistRow
                          key={item.ticker}
                          item={item}
                          isExpanded={expandedTicker === item.ticker}
                          onToggle={() =>
                            setExpandedTicker(expandedTicker === item.ticker ? null : item.ticker)
                          }
                        />
                      ))}
                </div>
              </section>

              <aside className="right-rail">
                <section className="side-card">
                  <h3>Risk Distribution</h3>
                  <div className="distribution-layout">
                    <Donut segments={riskDistribution} />
                  </div>
                </section>

                <section className="side-card">
                  <h3>Top Risk Drivers</h3>
                  <ul className="driver-list">
                    {topDrivers.length > 0 ? (
                      topDrivers.map((driver) => (
                        <li key={`${driver.ticker}-${driver.feature}`}>
                          <SlidersHorizontal size={17} />
                          {driver.ticker}: {driver.label}
                          <strong className={driver.impact}>{driver.impact}</strong>
                        </li>
                      ))
                    ) : (
                      <li>
                        <LayoutDashboard size={17} />
                        Loading AI drivers
                        <strong className="moderate">AI</strong>
                      </li>
                    )}
                  </ul>
                </section>

                <section className="side-card">
                  <h3>Actions Summary</h3>
                  <button className="primary-button full">
                    View Full Report <ChevronRight size={18} />
                  </button>
                </section>
              </aside>
            </div>
          </>
        )}

        <footer className="disclaimer">
          <CircleHelp size={18} />
          <p>
            SellSmart provides AI-powered risk analysis and insights only. Not financial advice.
            Always do your own research before making investment decisions.
          </p>
        </footer>
      </main>

      {isAddModalOpen && (
        <div className="modal-backdrop">
          <form className="add-modal" onSubmit={addPosition}>
            <div className="modal-header">
              <div>
                <h2>Add Position</h2>
                <p>Add a stock manually and load SellSmart AI analysis.</p>
              </div>

              <button type="button" className="modal-close" onClick={() => setIsAddModalOpen(false)}>
                ×
              </button>
            </div>

            <div className="modal-form">
              <label>
                Ticker
                <input value={newTicker} onChange={(event) => setNewTicker(event.target.value)} placeholder="AMD" />
              </label>

              <label>
                Shares
                <input
                  value={newShares}
                  onChange={(event) => setNewShares(event.target.value)}
                  placeholder="10"
                  type="number"
                  min="0"
                />
              </label>

              <label>
                Average Buy Price
                <input
                  value={newAvgBuyPrice}
                  onChange={(event) => setNewAvgBuyPrice(event.target.value)}
                  placeholder="120"
                  type="number"
                  min="0"
                />
              </label>
            </div>

            <div className="modal-actions">
              <button type="button" className="secondary-button" onClick={() => setIsAddModalOpen(false)}>
                Cancel
              </button>

              <button type="submit" className="primary-button">
                Add Position
              </button>
            </div>
          </form>
        </div>
      )}

      {isWatchModalOpen && (
        <div className="modal-backdrop">
          <form className="add-modal" onSubmit={addWatchItem}>
            <div className="modal-header">
              <div>
                <h2>Add to Watchlist</h2>
                <p>Track a ticker before adding it to your portfolio.</p>
              </div>

              <button type="button" className="modal-close" onClick={() => setIsWatchModalOpen(false)}>
                ×
              </button>
            </div>

            <div className="modal-form">
              <label>
                Ticker
                <input
                  value={newWatchTicker}
                  onChange={(event) => setNewWatchTicker(event.target.value)}
                  placeholder="TSLA"
                />
              </label>
            </div>

            <div className="modal-actions">
              <button type="button" className="secondary-button" onClick={() => setIsWatchModalOpen(false)}>
                Cancel
              </button>

              <button type="submit" className="primary-button">
                Add Ticker
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function PositionRow({
  position,
  isExpanded,
  onToggle,
}: {
  position: Position;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const isPositive = position.pnl >= 0;
  const actionClass = position.action.toLowerCase();

  return (
    <article className="position-row">
      <div className="position-main">
        <div className={`position-logo ${position.logoClass}`}>{position.logo}</div>
        <div>
          <h3>{position.ticker}</h3>
          <p>{position.company}</p>
          <span>
            {position.shares} shares
            {position.currentPrice && <> · {money.format(position.currentPrice)}</>}
          </span>
        </div>
      </div>

      <div className="value-cell">
        <strong>{money.format(position.value)}</strong>
        <span className={isPositive ? "positive" : "negative"}>
          {isPositive ? "+" : ""}
          {money.format(position.pnl)}
        </span>
        <span className={isPositive ? "positive" : "negative"}>
          ({isPositive ? "+" : ""}
          {position.pnlPct.toFixed(2)}%)
        </span>
        <Sparkline data={position.chart} tone={isPositive ? "positive" : "negative"} />
      </div>

      <RiskAndAction asset={position} actionClass={actionClass} />

      <button className={`icon-button row-button ${isExpanded ? "expanded" : ""}`} onClick={onToggle}>
        <ChevronRight size={22} />
      </button>

      {isExpanded && <AssetDetails asset={position} />}
    </article>
  );
}

function WatchlistRow({
  item,
  isExpanded,
  onToggle,
}: {
  item: WatchItem;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const actionClass = item.action.toLowerCase();

  return (
    <article className="position-row">
      <div className="position-main">
        <div className={`position-logo ${item.logoClass}`}>{item.logo}</div>
        <div>
          <h3>{item.ticker}</h3>
          <p>{item.company}</p>
          <span>Watchlist</span>
        </div>
      </div>

      <div className="value-cell">
        <strong>{item.currentPrice ? money.format(item.currentPrice) : "Loading..."}</strong>
        <span className="muted-text">Current price</span>
        <Sparkline data={item.chart} tone="purple" />
      </div>

      <RiskAndAction asset={item} actionClass={actionClass} />

      <button className={`icon-button row-button ${isExpanded ? "expanded" : ""}`} onClick={onToggle}>
        <ChevronRight size={22} />
      </button>

      {isExpanded && <AssetDetails asset={item} />}
    </article>
  );
}

function RiskAndAction({ asset, actionClass }: { asset: RiskAsset; actionClass: string }) {
  return (
    <>
      <div className="risk-cell">
        <RiskRing score={asset.riskScore} level={asset.riskLevel} />
        <span className={`risk-label ${asset.riskLevel}`}>
          {asset.riskLevel === "high" ? "High" : asset.riskLevel === "moderate" ? "Moderate" : "Low"} Risk
        </span>
      </div>

      <div className="action-cell">
        <strong className={`action ${actionClass}`}>
          {asset.action}
          {asset.action === "Reduce" && <TrendingDown size={16} />}
          {asset.action === "Watch" && <span>—</span>}
        </strong>

        <p className="position-summary">{asset.explanation}</p>

        {asset.marketRegime && (
          <div className="position-meta">
            <span>{asset.marketRegime}</span>
            {asset.probabilityOfDrop !== undefined && (
              <span>{(asset.probabilityOfDrop * 100).toFixed(1)}% drop probability</span>
            )}
          </div>
        )}
      </div>
    </>
  );
}

function AssetDetails({ asset }: { asset: RiskAsset }) {
  return (
    <div className="position-details">
      <div>
        <h4>Risk drivers</h4>

        {asset.drivers.length > 0 ? (
          asset.drivers.slice(0, 5).map((driver) => (
            <div key={driver.feature} className={`detail-driver ${driver.impact}`}>
              <strong>{driver.label}</strong>
              <p>{driver.message}</p>
            </div>
          ))
        ) : (
          <p className="empty-details">No risk drivers returned by API.</p>
        )}
      </div>

      <div>
        <h4>Supportive signals</h4>

        {asset.supportiveSignals.length > 0 ? (
          asset.supportiveSignals.slice(0, 3).map((signal) => (
            <div key={signal.feature} className="detail-driver positive-signal">
              <strong>{signal.label}</strong>
              <p>{signal.message}</p>
            </div>
          ))
        ) : (
          <p className="empty-details">No supportive signals returned by API.</p>
        )}

        <div className="cache-note">
          <strong>Analysis</strong>
          <p>
            {asset.confidence ? `Confidence: ${asset.confidence}` : "SellSmart AI signal"}
            {asset.cacheGeneratedAt ? ` · ${new Date(asset.cacheGeneratedAt).toLocaleString()}` : ""}
          </p>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="summary-card">
      <p className="eyebrow">{title}</p>
      {children}
    </section>
  );
}

function Sparkline({
  data,
  tone = "positive",
}: {
  data: number[];
  tone?: "positive" | "negative" | "purple";
}) {
  const points = data
    .map((value, index) => {
      const x = (index / (data.length - 1)) * 120;
      const y = 46 - (value / 60) * 38;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg className={`sparkline sparkline-${tone}`} viewBox="0 0 120 50" preserveAspectRatio="none">
      <polyline
        points={points}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Donut({ segments }: { segments: { value: number; level: RiskLevel }[] }) {
  let offset = 25;
  const radius = 17;
  const circumference = 2 * Math.PI * radius;

  return (
    <svg className="donut" viewBox="0 0 44 44">
      <circle cx="22" cy="22" r={radius} className="donut-bg" />
      {segments.map((segment) => {
        const dash = (segment.value / 100) * circumference;
        const item = (
          <circle
            key={`${segment.level}-${offset}`}
            cx="22"
            cy="22"
            r={radius}
            className={`donut-segment ${segment.level}`}
            strokeDasharray={`${dash} ${circumference - dash}`}
            strokeDashoffset={offset}
          />
        );

        offset -= dash;
        return item;
      })}
    </svg>
  );
}

function RiskRing({ score, level }: { score: number; level: RiskLevel }) {
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const dash = (score / 100) * circumference;

  return (
    <div className={`risk-ring risk-${level}`}>
      <svg viewBox="0 0 72 72">
        <circle cx="36" cy="36" r={radius} className="ring-bg" />
        <circle
          cx="36"
          cy="36"
          r={radius}
          className="ring-progress"
          strokeDasharray={`${dash} ${circumference - dash}`}
        />
      </svg>
      <strong>{score}</strong>
    </div>
  );
}