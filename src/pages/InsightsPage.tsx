import { Brain, ChevronRight } from "lucide-react";
import type { AlertSeverity, Position, RiskLevel, ViewType } from "../types";

type InsightItem = {
  id: string;
  title: string;
  text: string;
  severity: AlertSeverity;
  ticker?: string;
  reason?: string;
};

type Props = {
  insights: InsightItem[];
  portfolioInsight: string;
  overallRisk: number;
  overallRiskLevel: RiskLevel;
  highRiskPositions: Position[];
  reduceSignals: Position[];
  setActiveView: (view: ViewType) => void;
  setExpandedTicker: (ticker: string | null) => void;
};

export function InsightsPage({
  insights,
  portfolioInsight,
  overallRisk,
  overallRiskLevel,
  highRiskPositions,
  reduceSignals,
  setActiveView,
  setExpandedTicker,
}: Props) {
  return (
    <section className="insights-page">
      <div className="panel-header">
        <div>
          <h2>AI Insights</h2>
          <p className="muted-text">Explainable risk intelligence generated from portfolio and watchlist data.</p>
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

        <section className="reports-grid insights-kpi-grid">
          <div className="report-card">
            <span>Portfolio Risk</span>
            <strong>{overallRisk}/100</strong>
            <p>{overallRiskLevel === "high" ? "High risk" : overallRiskLevel === "moderate" ? "Moderate risk" : "Low risk"}</p>
          </div>

          <div className="report-card">
            <span>High-Risk Positions</span>
            <strong>{highRiskPositions.length}</strong>
            <p>Positions with elevated downside risk</p>
          </div>

          <div className="report-card">
            <span>Reduce Signals</span>
            <strong>{reduceSignals.length}</strong>
            <p>Positions requiring review</p>
          </div>
        </section>
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
  );
}
