import {
  Brain,
  ChevronRight,
  Grid2X2,
  LayoutDashboard,
  List,
  SlidersHorizontal,
} from "lucide-react";
import { PositionCard, PositionRow } from "../components/AssetComponents";
import { Donut, Sparkline, SummaryCard } from "../components/Charts";
import { TickerInsightsPanel } from "../components/TickerInsightsPanel";
import type { ApiDriver, Position, RiskLevel, ViewType } from "../types";
import { money } from "../utils/format";

const formatPriceTimestamp = (timestamp?: string) => {
  if (!timestamp) return undefined;

  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) return undefined;

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

type DriverWithTicker = ApiDriver & { ticker: string };

type Props = {
  positions: Position[];
  sortedPositions: Position[];
  portfolioViewMode: "grid" | "list";
  setPortfolioViewMode: (mode: "grid" | "list") => void;
  sortBy: string;
  setSortBy: (sortBy: string) => void;
  expandedTicker: string | null;
  setExpandedTicker: (ticker: string | null) => void;
  totalValue: number;
  totalPnl: number;
  totalPnlPct: number;
  dailyPnl: number;
  dailyPnlPct: number;
  latestPriceTimestamp?: string;
  overallRisk: number;
  overallRiskLevel: RiskLevel;
  riskDistribution: { value: number; level: RiskLevel }[];
  portfolioInsight: string;
  topDrivers: DriverWithTicker[];
  setActiveView: (view: ViewType) => void;
  onEditPosition: (position: Position) => void;
  onDeletePosition: (ticker: string) => void;
  isMobile?: boolean;
};

export function PortfolioPage({
  positions,
  sortedPositions,
  portfolioViewMode,
  setPortfolioViewMode,
  sortBy,
  setSortBy,
  expandedTicker,
  setExpandedTicker,
  totalValue,
  totalPnl,
  totalPnlPct,
  dailyPnl,
  dailyPnlPct,
  latestPriceTimestamp,
  overallRisk,
  overallRiskLevel,
  riskDistribution,
  portfolioInsight,
  topDrivers,
  setActiveView,
  onEditPosition,
  onDeletePosition,
  isMobile = false,
}: Props) {
  const effectivePortfolioViewMode = isMobile ? "grid" : portfolioViewMode;
  const selectedAsset = sortedPositions.find(
    (item) => item.ticker === expandedTicker,
  );

  return (
    <section data-tour="portfolio-page">
      <section className="summary-grid">
        <SummaryCard title="Portfolio Value">
          <h2>{money.format(totalValue)}</h2>
          <p className={dailyPnl >= 0 ? "positive" : "negative"}>
            Today: {dailyPnl >= 0 ? "+" : ""}
            {money.format(dailyPnl)} ({dailyPnl >= 0 ? "+" : ""}
            {dailyPnlPct.toFixed(2)}%)
          </p>
          {formatPriceTimestamp(latestPriceTimestamp) && (
            <p className="muted-text">
              Prices updated {formatPriceTimestamp(latestPriceTimestamp)}
            </p>
          )}
          <Sparkline
            data={[
              12, 16, 24, 19, 28, 32, 27, 20, 17, 22, 36, 42, 39, 31, 36, 47,
              50,
            ]}
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

        <SummaryCard title="Total P&L">
          <h2 className={totalPnl >= 0 ? "positive" : "negative"}>
            {totalPnl >= 0 ? "+" : ""}
            {money.format(totalPnl)}
          </h2>
          <p className={totalPnl >= 0 ? "positive" : "negative"}>
            ({totalPnlPct.toFixed(2)}%)
          </p>
          <Sparkline
            data={[10, 18, 17, 11, 20, 22, 17, 19, 26, 24, 18, 20, 14, 17, 15]}
          />
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
            data={[
              20, 28, 24, 31, 33, 29, 36, 43, 38, 50, 62, 58, 54, 59, 66, 61,
              57, 69, 72, 63, 60, 73,
            ]}
            tone="purple"
          />
        </div>
        <button
          type="button"
          className="primary-button"
          onClick={() => setActiveView("insights")}
        >
          View Details <ChevronRight size={18} />
        </button>
      </section>

      <div className="content-grid">
        <section className="positions-panel">
          <div className="panel-header">
            <h2>Your Positions</h2>

            <div className="sort-area">
              <span>Sort by</span>
              <select
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value)}
              >
                <option value="risk">Risk (High to Low)</option>
                <option value="value">Value</option>
                <option value="pnl">PNL</option>
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
              <span>Position</span>
              <span>Value / PNL</span>
              <span>Risk Score</span>
              <span>Action</span>
            </div>
          )}

          <div
            data-tour="portfolio-list"
            className={
              effectivePortfolioViewMode === "grid"
                ? "position-grid"
                : "position-list"
            }
          >
            {sortedPositions.map((position) =>
              effectivePortfolioViewMode === "grid" ? (
                <PositionCard
                  key={position.ticker}
                  position={position}
                  onOpen={() =>
                    setExpandedTicker(
                      expandedTicker === position.ticker ? null : position.ticker,
                    )
                  }
                  onEdit={() => onEditPosition(position)}
                  onDelete={() => onDeletePosition(position.ticker)}
                />
              ) : (
                <PositionRow
                  key={position.ticker}
                  position={position}
                  isExpanded={expandedTicker === position.ticker}
                  onToggle={() =>
                    setExpandedTicker(
                      expandedTicker === position.ticker
                        ? null
                        : position.ticker,
                    )
                  }
                  onEdit={() => onEditPosition(position)}
                  onDelete={() => onDeletePosition(position.ticker)}
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

        <PortfolioRightRail
          riskDistribution={riskDistribution}
          topDrivers={topDrivers}
          setActiveView={setActiveView}
        />
      </div>
    </section>
  );
}

function PortfolioRightRail({
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