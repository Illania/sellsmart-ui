import { Bell, Brain, ChevronRight, ShieldCheck } from "lucide-react";
import type { PortfolioAlert, Position, RiskLevel, ViewType, WatchItem } from "../types";
import { SummaryCard } from "../components/Charts";

type Props = {
  overallRisk: number;
  overallRiskLevel: RiskLevel;
  unreadAlertsCount: number;
  highRiskPositions: Position[];
  reduceSignals: Position[];
  portfolioInsight: string;
  topRiskPosition?: Position;
  latestAlerts: PortfolioAlert[];
  watchlistOpportunity?: WatchItem;
  setActiveView: (view: ViewType) => void;
};

export function DashboardPage({
  overallRisk,
  overallRiskLevel,
  unreadAlertsCount,
  highRiskPositions,
  reduceSignals,
  portfolioInsight,
  topRiskPosition,
  latestAlerts,
  watchlistOpportunity,
  setActiveView,
}: Props) {
  return (
    <section className="dashboard-page" data-tour="dashboard-page">
      <section className="summary-grid" data-tour="dashboard-summary">
        <SummaryCard title="Portfolio Risk">
          <div className="score-line">
            <strong>{overallRisk}</strong>
            <span>/100</span>
          </div>
          <p className={overallRiskLevel === "high" ? "negative" : overallRiskLevel === "moderate" ? "warning" : "positive"}>
            {overallRiskLevel === "high" ? "High Risk" : overallRiskLevel === "moderate" ? "Moderate Risk" : "Low Risk"}
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
              <p>Risk score {topRiskPosition.riskScore}/100 · Suggested action: {topRiskPosition.action}</p>
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
                <button key={alert.id} className="dashboard-alert-item" onClick={() => setActiveView("alerts")}>
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
              <p>Risk score {watchlistOpportunity.riskScore}/100 · {watchlistOpportunity.action}</p>
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
  );
}
