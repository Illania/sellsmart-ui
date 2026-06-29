import { useEffect, useMemo, useState } from "react";
import {
  Brain,
  ChevronRight,
  Grid2X2,
  LayoutDashboard,
  List,
  Plus,
  SlidersHorizontal,
  Trash2,
} from "lucide-react";
import { DeleteConfirmDialog, WatchlistCard, WatchlistRow } from "../components/AssetComponents";
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
  onDeleteWatchItems: (tickers: string[]) => void;
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
  onDeleteWatchItem,
  onDeleteWatchItems,
  isMobile = false,
}: Props) {
  const effectivePortfolioViewMode = isMobile ? "grid" : portfolioViewMode;
  const [selectedTickers, setSelectedTickers] = useState<string[]>([]);
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);
  const selectedAsset = sortedWatchlist.find(
    (item) => item.ticker === expandedTicker,
  );
  const sortedTickerSet = useMemo(
    () => new Set(sortedWatchlist.map((item) => item.ticker)),
    [sortedWatchlist],
  );
  const isSelectionMode = selectedTickers.length > 0;
  const allVisibleSelected =
    sortedWatchlist.length > 0 &&
    sortedWatchlist.every((item) => selectedTickers.includes(item.ticker));

  useEffect(() => {
    setSelectedTickers((current) =>
      current.filter((ticker) => sortedTickerSet.has(ticker)),
    );
  }, [sortedTickerSet]);

  const toggleSelectedTicker = (ticker: string) => {
    setSelectedTickers((current) =>
      current.includes(ticker)
        ? current.filter((selectedTicker) => selectedTicker !== ticker)
        : [...current, ticker],
    );
  };

  const clearSelection = () => setSelectedTickers([]);

  const selectAllVisible = () => {
    setSelectedTickers(sortedWatchlist.map((item) => item.ticker));
  };

  const deleteSelectedWatchItems = () => {
    if (selectedTickers.length === 0) return;

    onDeleteWatchItems(selectedTickers);
    clearSelection();
    setIsBulkDeleteDialogOpen(false);
  };

  return (
    <section data-tour="watchlist-page">
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

        <button
          type="button"
          className="primary-button"
          onClick={onAddTicker}
          data-tour="add-watchlist"
        >
          Add Ticker <Plus size={18} />
        </button>
      </section>

      <div className="content-grid">
        <section className="positions-panel">
          <div className="panel-header positions-panel-header">
            <div>
              <h2>Your Watchlist</h2>
              {isSelectionMode && (
                <p className="selection-count">
                  {selectedTickers.length} selected
                </p>
              )}
            </div>

            <div className="sort-area">
              {sortedWatchlist.length > 0 && (
                <button
                  type="button"
                  className="secondary-button compact"
                  onClick={isSelectionMode ? clearSelection : selectAllVisible}
                >
                  {isSelectionMode ? "Cancel selection" : "Select"}
                </button>
              )}

              {isSelectionMode && (
                <button
                  type="button"
                  className="secondary-button danger-button compact"
                  onClick={() => setIsBulkDeleteDialogOpen(true)}
                >
                  <Trash2 size={16} />
                  Delete selected
                </button>
              )}

              {isSelectionMode && !allVisibleSelected && (
                <button
                  type="button"
                  className="ghost-button compact"
                  onClick={selectAllVisible}
                >
                  Select all
                </button>
              )}
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
                    className={`icon-button ${portfolioViewMode === "grid" ? "active" : ""
                      }`}
                    onClick={() => setPortfolioViewMode("grid")}
                    aria-label="Grid view"
                  >
                    <Grid2X2 size={18} />
                  </button>

                  <button
                    type="button"
                    className={`icon-button ${portfolioViewMode === "list" ? "active" : ""
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
                  isSelectionMode={isSelectionMode}
                  isSelected={selectedTickers.includes(item.ticker)}
                  onToggleSelected={() => toggleSelectedTicker(item.ticker)}
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
                  isSelectionMode={isSelectionMode}
                  isSelected={selectedTickers.includes(item.ticker)}
                  onToggleSelected={() => toggleSelectedTicker(item.ticker)}
                />
              ),
            )}
          </div>

          {selectedAsset && (isMobile || effectivePortfolioViewMode === "grid") && (
            <TickerInsightsPanel
              asset={selectedAsset}
              onClose={() => setExpandedTicker(null)}
            />
          )}
        </section>

        {isBulkDeleteDialogOpen && (
          <DeleteConfirmDialog
            title={`Delete ${selectedTickers.length} watchlist items?`}
            description={`This will remove ${selectedTickers.length} selected tickers from your watchlist. You can add them again later.`}
            onCancel={() => setIsBulkDeleteDialogOpen(false)}
            onConfirm={deleteSelectedWatchItems}
          />
        )}

        <WatchlistRightRail
          riskDistribution={riskDistribution}
          topDrivers={topDrivers}
          setActiveView={setActiveView}
        />
      </div>
    </section>
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

          <div className="risk-distribution-legend">
            <div className="risk-legend-row">
              <span className="risk-dot low" />
              <span>Low Risk (0–39)</span>
              <small>Hold</small>
            </div>

            <div className="risk-legend-row">
              <span className="risk-dot medium" />
              <span>Medium Risk (40–69)</span>
              <small>Watch</small>
            </div>

            <div className="risk-legend-row">
              <span className="risk-dot high" />
              <span>High Risk (70–100)</span>
              <small>Reduce</small>
            </div>
          </div>
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
