import { ChevronRight, TrendingDown } from "lucide-react";
import type { Position, RiskAsset, WatchItem } from "../types";
import { money } from "../utils/format";
import { RiskRing, Sparkline } from "./Charts";

export function PositionCard({
  position,
  onOpen,
}: {
  position: Position;
  onOpen: () => void;
}) {
  const isPositive = position.pnl >= 0;
  const actionClass = position.action.toLowerCase();

  return (
    <article className="position-card">
      <div className="position-card-top">
        <div className={`position-logo ${position.logoClass}`}>{position.logo}</div>

        <button className="icon-button row-button" onClick={onOpen}>
          <ChevronRight size={20} />
        </button>
      </div>

      <div className="position-card-title">
        <h3>{position.ticker}</h3>
        <p>{position.company}</p>
        <span>
          {position.shares} shares
          {position.currentPrice && <> · {money.format(position.currentPrice)}</>}
        </span>
      </div>

      <div className="position-card-value">
        <strong>{money.format(position.value)}</strong>
        <span className={isPositive ? "positive" : "negative"}>
          {isPositive ? "+" : ""}
          {money.format(position.pnl)} ({isPositive ? "+" : ""}
          {position.pnlPct.toFixed(2)}%)
        </span>
      </div>

      <Sparkline data={position.chart} tone={isPositive ? "positive" : "negative"} />

      <div className="position-card-risk">
        <RiskRing score={position.riskScore} level={position.riskLevel} />

        <div>
          <strong className={`action ${actionClass}`}>
            {position.action}
            {position.action === "Reduce" && <TrendingDown size={16} />}
          </strong>

          <p className="position-summary">{position.explanation}</p>
        </div>
      </div>
    </article>
  );
}

export function PositionRow({
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

export function WatchlistCard({
  item,
  onOpen,
}: {
  item: WatchItem;
  onOpen: () => void;
}) {
  const actionClass = item.action.toLowerCase();

  return (
    <article className="watchlist-card">
      <div className="watchlist-card-header">
        <div className={`position-logo ${item.logoClass}`}>{item.logo}</div>

        <div className="watchlist-card-title">
          <h3>{item.ticker}</h3>
          <p>{item.company}</p>
          <span>Watchlist</span>
        </div>

        <RiskRing score={item.riskScore} level={item.riskLevel} />
      </div>

      <div className="watchlist-card-price">
        <strong>{item.currentPrice ? money.format(item.currentPrice) : "Loading..."}</strong>
        <span>Current price</span>
      </div>

      <Sparkline data={item.chart} tone="purple" />

      <div className="watchlist-card-action">
        <strong className={`action ${actionClass}`}>
          {item.action}
          {item.action === "Reduce" && <TrendingDown size={16} />}
          {item.action === "Watch" && <span>—</span>}
        </strong>

        <p>{item.explanation}</p>

        {item.marketRegime && (
          <div className="position-meta">
            <span>{item.marketRegime}</span>
            {item.probabilityOfDrop !== undefined && (
              <span>{(item.probabilityOfDrop * 100).toFixed(1)}% drop probability</span>
            )}
          </div>
        )}
      </div>

      <button className="mini-link-button" onClick={onOpen}>
        View details <ChevronRight size={16} />
      </button>
    </article>
  );
}

export function WatchlistRow({
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

export function RiskAndAction({ asset, actionClass }: { asset: RiskAsset; actionClass: string }) {
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

export function AssetDetails({ asset }: { asset: RiskAsset }) {
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
