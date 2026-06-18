import {
  Brain,
  ChevronRight,
  Grid2X2,
  LayoutDashboard,
  List,
  Plus,
  SlidersHorizontal,
} from "lucide-react";
import { WatchlistCard, WatchlistRow } from "../components/AssetComponents";
import { Donut } from "../components/Charts";
import { TickerInsightsPanel } from "../components/TickerInsightsPanel";
import type { ApiDriver, RiskLevel, ViewType, WatchItem } from "../types";

type DriverWithTicker = ApiDriver & { ticker: string };

type Props = {
  sortedWatchlist: WatchItem[];
  portfolioViewMode: "grid" | "list";
  setPortfolioViewMode: (mode: "grid" | "list") => void;
  sortBy: string;
  setSortBy: (sortBy: string) => void;
  expandedTicker: string | null;
  setExpandedTicker: (ticker: string | null) => void;
  riskDistribution: { value: number; level: RiskLevel }[];
  topDrivers: DriverWithTicker[];
  setActiveView: (view: ViewType) => void;
  onAddTicker: () => void;
  onEditWatchItem: (item: WatchItem) => void;
  onDeleteWatchItem: (ticker: string) => void;
  isMobile?: boolean;
};

export function WatchlistPage({
  sortedWatchlist,
  portfolioViewMode,
  setPortfolioViewMode,
  sortBy,
  setSortBy,
  expandedTicker,
  setExpandedTicker,
  riskDistribution,
  topDrivers,
  setActiveView,
  onAddTicker,
  onEditWatchItem,
  onDeleteWatchItem,
  isMobile = false,
}: Props) {
  const effectivePortfolioViewMode = isMobile ? "grid" : portfolioViewMode;
  const selectedAsset = sortedWatchlist.find(
    (item) => item.ticker === expandedTicker,
  );

  return (
    <>
      <section className="insight-card">
        <div className="insight-copy">
          <Brain size={34} />
          <div>
            <h2>Watchlist Intelligence</h2>
            <p>
              Monitor stocks before buying. SellSmart highlights panic-risk
              signals, sentiment pressure, and short-term downside risk.
            </p>
          </div>
        </div>

        <button type="button" className="primary-button" onClick={onAddTicker}>
          Add Ticker <Plus size={18} />
        </button>
      </section>

      <div className="content-grid">
        <section className="positions-panel">
          <div className="panel-header">
            <h2>Your Watchlist</h2>

            <div className="sort-area">
              <span>Sort by</span>
              <select
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value)}
              >
                <option value="risk">Risk (High to Low)</option>
                <option value="price">Price</option>
                <option value="ticker">Ticker A-Z</option>
              </select>

              {!isMobile && (
                <>
                  <button
                    type="button"
                    className={`icon-button ${
                      portfolioViewMode === "grid" ? "active" : ""
                    }`}
                    onClick={() => setPortfolioViewMode("grid")}
                    aria-label="Grid view"
                  >
                    <Grid2X2 size={18} />
                  </button>

                  <button
                    type="button"
                    className={`icon-button ${
                      portfolioViewMode === "list" ? "active" : ""
                    }`}
                    onClick={() => setPortfolioViewMode("list")}
                    aria-label="List view"
                  >
                    <List size={18} />
                  </button>
                </>
              )}
            </div>
          </div>

          {effectivePortfolioViewMode === "list" && (
            <div className="table-head">
              <span>Ticker</span>
              <span>Price</span>
              <span>Risk Score</span>
              <span>Action</span>
            </div>
          )}

          <div
            className={
              effectivePortfolioViewMode === "grid"
                ? "position-grid"
                : "position-list"
            }
          >
            {sortedWatchlist.map((item) =>
              effectivePortfolioViewMode === "grid" ? (
                <WatchlistCard
                  key={item.ticker}
                  item={item}
                  onOpen={() =>
                    setExpandedTicker(
                      expandedTicker === item.ticker ? null : item.ticker,
                    )
                  }
                  onDelete={() => onDeleteWatchItem(item.ticker)}
                />
              ) : (
                <WatchlistRow
                  key={item.ticker}
                  item={item}
                  isExpanded={expandedTicker === item.ticker}
                  onToggle={() =>
                    setExpandedTicker(
                      expandedTicker === item.ticker ? null : item.ticker,
                    )
                  }
                  onDelete={() => onDeleteWatchItem(item.ticker)}
                />
              ),
            )}
          </div>

          {isMobile && (
            <TickerInsightsPanel
              asset={selectedAsset}
              onClose={() => setExpandedTicker(null)}
            />
          )}
        </section>

        <WatchlistRightRail
          riskDistribution={riskDistribution}
          topDrivers={topDrivers}
          setActiveView={setActiveView}
        />
      </div>
    </>
  );
}

function WatchlistRightRail({
  riskDistribution,
  topDrivers,
  setActiveView,
}: {
  riskDistribution: { value: number; level: RiskLevel }[];
  topDrivers: DriverWithTicker[];
  setActiveView: (view: ViewType) => void;
}) {
  return (
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
              Loading AI drivers<strong className="moderate">AI</strong>
            </li>
          )}
        </ul>
      </section>

      <section className="side-card">
        <h3>Actions Summary</h3>
        <button
          type="button"
          className="primary-button full"
          onClick={() => setActiveView("reports")}
        >
          View Full Report <ChevronRight size={18} />
        </button>
      </section>
    </aside>
  );
}
