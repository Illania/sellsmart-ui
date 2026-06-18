import { useEffect, useMemo, useState } from "react";
import type { Position, ViewType, WatchItem } from "../types";

export function useAssetSorting(
  activeView: ViewType,
  positions: Position[],
  watchlist: WatchItem[],
) {
  const isMobile = useIsMobile();

  const [sortBy, setSortBy] = useState("risk");
  const [portfolioViewMode, setPortfolioViewMode] =
    useState<"grid" | "list">("grid");
  const [expandedTicker, setExpandedTicker] = useState<string | null>(null);

  const effectivePortfolioViewMode = isMobile ? "grid" : portfolioViewMode;

  useEffect(() => {
    if (activeView === "watchlist" && (sortBy === "value" || sortBy === "pnl")) {
      setSortBy("risk");
    }
  }, [activeView, sortBy]);

  const sortedPositions = useMemo(() => {
    return [...positions].sort((a, b) => {
      if (sortBy === "risk") return b.riskScore - a.riskScore;
      if (sortBy === "value") return b.value - a.value;
      if (sortBy === "pnl") return b.pnlPct - a.pnlPct;
      if (sortBy === "price") return (b.currentPrice ?? 0) - (a.currentPrice ?? 0);
      if (sortBy === "ticker") return a.ticker.localeCompare(b.ticker);

      return b.riskScore - a.riskScore;
    });
  }, [positions, sortBy]);

  const sortedWatchlist = useMemo(() => {
    return [...watchlist].sort((a, b) => {
      if (sortBy === "risk") return b.riskScore - a.riskScore;
      if (sortBy === "price") return (b.currentPrice ?? 0) - (a.currentPrice ?? 0);
      if (sortBy === "ticker") return a.ticker.localeCompare(b.ticker);

      return b.riskScore - a.riskScore;
    });
  }, [watchlist, sortBy]);

  return {
    sortBy,
    setSortBy,
    portfolioViewMode,
    setPortfolioViewMode,
    effectivePortfolioViewMode,
    expandedTicker,
    setExpandedTicker,
    isMobile,
    sortedPositions,
    sortedWatchlist,
  };
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 980);

  useEffect(() => {
    const onResize = () => {
      setIsMobile(window.innerWidth <= 980);
    };

    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return isMobile;
}