import { FileText } from "lucide-react";
import type { ApiDriver, Position, RiskLevel } from "../types";

type DriverWithTicker = ApiDriver & { ticker: string };

type Props = {
  reportGeneratedAt: string;
  overallRisk: number;
  overallRiskLevel: RiskLevel;
  highRiskPositions: Position[];
  reduceSignals: Position[];
  portfolioInsight: string;
  topRiskPosition?: Position;
  topDrivers: DriverWithTicker[];
};

export function ReportsPage({
  reportGeneratedAt,
  overallRisk,
  overallRiskLevel,
  highRiskPositions,
  reduceSignals,
  portfolioInsight,
  topRiskPosition,
  topDrivers,
}: Props) {
  return (
    <section id="sellsmart-report" className="reports-page" data-tour="reports-page">
      <div className="panel-header no-print">
        <div>
          <h2>Weekly AI Risk Report</h2>
          <p className="muted-text">Generated {reportGeneratedAt} · Based on current SellSmart AI signals.</p>
        </div>
      </div>

      <div className="printable-report">
        <section className="reports-grid">
          <article className="report-card">
            <span>Portfolio Risk</span>
            <strong>{overallRisk}/100</strong>
            <p>{overallRiskLevel === "high" ? "High risk" : overallRiskLevel === "moderate" ? "Moderate risk" : "Low risk"}</p>
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
              <p className="muted-text">AI-generated report for your current portfolio snapshot.</p>
            </div>
            <FileText size={30} />
          </div>

          <section className="report-section">
            <h4>Executive summary</h4>
            <p>{portfolioInsight}</p>
          </section>

          {topRiskPosition && (
            <section className="report-section">
              <h4>Main risk contributor</h4>
              <p>
                <strong>{topRiskPosition.ticker}</strong> has a risk score of <strong>{topRiskPosition.riskScore}/100</strong>. Suggested action:{" "}
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
              topDrivers.map((driver) => (
                <div key={`${driver.ticker}-${driver.feature}`} className="report-driver">
                  <strong>{driver.ticker}: {driver.label}</strong>
                  <p>{driver.message}</p>
                  <span>{driver.impact.toUpperCase()}</span>
                </div>
              ))
            ) : (
              <p className="muted-text">No major risk drivers available.</p>
            )}
          </section>

          <section className="report-disclaimer">SellSmart provides AI-powered risk analysis and insights only. Not financial advice.</section>
        </article>
      </div>
    </section>
  );
}
