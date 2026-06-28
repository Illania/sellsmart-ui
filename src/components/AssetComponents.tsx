import { useEffect, useState } from "react";
import { ChevronRight, Edit3, Trash2, TrendingDown } from "lucide-react";
import type { Position, RiskAsset, WatchItem } from "../types";
import { money } from "../utils/format";
import { RiskRing, Sparkline } from "./Charts";

const formatPriceTimestamp = (timestamp?: string) => {
  if (!timestamp) return undefined;

  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) return undefined;

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
};

const formatSignedMoney = (value: number) => `${value >= 0 ? "+" : ""}${money.format(value)}`;
const formatSignedPercent = (value: number) => `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;


function AssetLogo({ asset }: { asset: Pick<RiskAsset, "ticker" | "logo" | "logoClass" | "logoUrl"> }) {
  const [hasLogoError, setHasLogoError] = useState(false);
  const shouldShowLogo = Boolean(asset.logoUrl) && !hasLogoError;

  useEffect(() => {
    setHasLogoError(false);
  }, [asset.logoUrl]);

  return (
    <div className={`position-logo ${asset.logoClass} ${shouldShowLogo ? "has-image" : ""}`}>
      {shouldShowLogo ? (
        <img
          src={asset.logoUrl}
          alt={`${asset.ticker} logo`}
          loading="lazy"
          onError={() => setHasLogoError(true)}
        />
      ) : (
        asset.logo
      )}
    </div>
  );
}

function PredictionProgress({ asset }: { asset: RiskAsset }) {
  if (asset.predictionStatus !== "pending" && asset.predictionStatus !== "processing") {
    return null;
  }

  const progress = Math.max(0, Math.min(100, asset.predictionProgress ?? 0));

  return (
    <div className="prediction-progress" aria-label={`${asset.ticker} prediction progress`}>
      <div className="prediction-progress-bar">
        <span style={{ width: `${progress}%` }} />
      </div>
      <small>{progress > 0 ? `${progress}%` : "Queued"}</small>
    </div>
  );
}

export function PositionCard({
  position,
  onOpen,
  onEdit,
  onDelete,
}: {
  position: Position;
  onOpen: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const isPositive = position.pnl >= 0;
  const isDailyPositive = position.dailyPnl >= 0;
  const priceDate = formatPriceTimestamp(position.priceTimestamp);
  const actionClass = position.action.toLowerCase();

  return (
    <article className="position-card">
      <div className="position-card-top">
        <AssetLogo asset={position} />

        <div className="asset-card-actions">
          <button
            type="button"
            className="asset-action-button"
            onClick={onEdit}
            aria-label={`Edit ${position.ticker}`}
          >
            <Edit3 size={16} />
          </button>
          <button
            type="button"
            className="asset-action-button danger"
            onClick={() => {
              if (window.confirm(`Delete ${position.ticker} from portfolio?`))
                onDelete();
            }}
            aria-label={`Delete ${position.ticker}`}
          >
            <Trash2 size={16} />
          </button>
          <button
            type="button"
            className="icon-button row-button"
            onClick={onOpen}
            aria-label={`Open ${position.ticker} details`}
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      <div className="position-card-title">
        <h3>{position.ticker}</h3>
        <p>{position.company}</p>
        <span>
          {position.shares} shares
          {position.currentPrice && (
            <> · {money.format(position.currentPrice)}</>
          )}
          {priceDate && <> · Updated {priceDate}</>}
          {position.isDemo && <em className="demo-data-badge">Demo</em>}
        </span>
      </div>

      <div className="position-card-value">
        <strong>{money.format(position.value)}</strong>
        <span className={isPositive ? "positive" : "negative"}>
          Total: {isPositive ? "+" : ""}
          {money.format(position.pnl)} ({isPositive ? "+" : ""}
          {position.pnlPct.toFixed(2)}%)
        </span>
        <span className={isDailyPositive ? "positive" : "negative"}>
          Today: {formatSignedMoney(position.dailyPnl)} ({formatSignedPercent(position.dailyPnlPct)})
        </span>
      </div>

      <Sparkline
        data={position.chart}
        tone={isPositive ? "positive" : "negative"}
      />

      <div className="position-card-risk">
        <RiskRing score={position.riskScore} level={position.riskLevel} />

        <div>
          <strong className={`action ${actionClass}`}>
            {position.action}
            {position.action === "Reduce" && <TrendingDown size={16} />}
          </strong>

          <p className="position-summary">{position.explanation}</p>
          <PredictionProgress asset={position} />
        </div>
      </div>
    </article>
  );
}

export function PositionRow({
  position,
  isExpanded,
  onToggle,
  onEdit,
  onDelete,
}: {
  position: Position;
  isExpanded: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const isPositive = position.pnl >= 0;
  const isDailyPositive = position.dailyPnl >= 0;
  const priceDate = formatPriceTimestamp(position.priceTimestamp);
  const actionClass = position.action.toLowerCase();

  return (
    <article className="position-row">
      <div className="position-main">
        <AssetLogo asset={position} />
        <div>
          <h3>{position.ticker}</h3>
          <p>{position.company}</p>
          <span>
            {position.shares} shares
            {position.currentPrice && (
              <> · {money.format(position.currentPrice)}</>
            )}
            {priceDate && <> · Updated {priceDate}</>}
            {position.isDemo && <em className="demo-data-badge">Demo</em>}
          </span>
        </div>
      </div>

      <div className="value-cell">
        <strong>{money.format(position.value)}</strong>
        <span className={isDailyPositive ? "positive" : "negative"}>
          Today: {formatSignedMoney(position.dailyPnl)}
        </span>
        <span className={isPositive ? "positive" : "negative"}>
          Total: {isPositive ? "+" : ""}
          {money.format(position.pnl)} ({isPositive ? "+" : ""}
          {position.pnlPct.toFixed(2)}%)
        </span>
        <Sparkline
          data={position.chart}
          tone={isPositive ? "positive" : "negative"}
        />
      </div>

      <RiskAndAction asset={position} actionClass={actionClass} />

      <div className="asset-row-actions">
        <button
          type="button"
          className="asset-action-button"
          onClick={onEdit}
          aria-label={`Edit ${position.ticker}`}
        >
          <Edit3 size={16} />
        </button>
        <button
          type="button"
          className="asset-action-button danger"
          onClick={() => {
            if (window.confirm(`Delete ${position.ticker} from portfolio?`))
              onDelete();
          }}
          aria-label={`Delete ${position.ticker}`}
        >
          <Trash2 size={16} />
        </button>
        <button
          type="button"
          className={`icon-button row-button ${isExpanded ? "expanded" : ""}`}
          onClick={onToggle}
          aria-label={`Open ${position.ticker} details`}
        >
          <ChevronRight size={22} />
        </button>
      </div>

      {isExpanded && <AssetDetails asset={position} />}
    </article>
  );
}

export function WatchlistCard({
  item,
  onOpen,
  onDelete,
}: {
  item: WatchItem;
  onOpen: () => void;
  onDelete: () => void;
}) {
  const actionClass = item.action.toLowerCase();
  const priceDate = formatPriceTimestamp(item.priceTimestamp);

  return (
    <article className="watchlist-card">
      <div className="watchlist-card-header">
        <AssetLogo asset={item} />

        <div className="watchlist-card-title">
          <h3>{item.ticker}</h3>
          <p>{item.company}</p>
          {item.isDemo && <em className="demo-data-badge">Demo</em>}
        </div>

        <div className="asset-card-actions">
          <button
            type="button"
            className="asset-action-button danger"
            onClick={() => {
              if (window.confirm(`Delete ${item.ticker} from watchlist?`))
                onDelete();
            }}
            aria-label={`Delete ${item.ticker}`}
          >
            <Trash2 size={16} />
          </button>

          <button
            type="button"
            className="icon-button row-button"
            onClick={onOpen}
            aria-label={`Open ${item.ticker} details`}
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      <div className="watchlist-card-price">
        <strong>
          {item.currentPrice ? money.format(item.currentPrice) : "Loading..."}
        </strong>
        <span>{priceDate ? `Updated ${priceDate}` : "Current price"}</span>
      </div>

      <Sparkline data={item.chart} tone="purple" />

      <div className="watchlist-card-risk">
        <RiskRing score={item.riskScore} level={item.riskLevel} />

        <div>
          <strong className={`action ${actionClass}`}>
            {item.action}
            {item.action === "Reduce" && <TrendingDown size={16} />}
            {item.action === "Watch" && <span>—</span>}
          </strong>

          <p className="position-summary">{item.explanation}</p>
          <PredictionProgress asset={item} />
        </div>
      </div>
    </article>
  );
}

export function WatchlistRow({
  item,
  isExpanded,
  onToggle,
  onDelete,
}: {
  item: WatchItem;
  isExpanded: boolean;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const actionClass = item.action.toLowerCase();
  const priceDate = formatPriceTimestamp(item.priceTimestamp);

  return (
    <article className="position-row">
      <div className="position-main">
        <AssetLogo asset={item} />
        <div>
          <h3>{item.ticker}</h3>
          <p>{item.company}</p>
          {item.isDemo && <em className="demo-data-badge">Demo</em>}
        </div>
      </div>

      <div className="value-cell">
        <strong>
          {item.currentPrice ? money.format(item.currentPrice) : "Loading..."}
        </strong>
        <span className="muted-text">
          {priceDate ? `Updated ${priceDate}` : "Current price"}
        </span>
        <Sparkline data={item.chart} tone="purple" />
      </div>

      <RiskAndAction asset={item} actionClass={actionClass} />

      <div className="asset-row-actions">
        <button
          type="button"
          className="asset-action-button danger"
          onClick={() => {
            if (window.confirm(`Delete ${item.ticker} from watchlist?`))
              onDelete();
          }}
          aria-label={`Delete ${item.ticker}`}
        >
          <Trash2 size={16} />
        </button>
        <button
          type="button"
          className={`icon-button row-button ${isExpanded ? "expanded" : ""}`}
          onClick={onToggle}
          aria-label={`Open ${item.ticker} details`}
        >
          <ChevronRight size={22} />
        </button>
      </div>

      {isExpanded && <AssetDetails asset={item} />}
    </article>
  );
}

export function RiskAndAction({
  asset,
  actionClass,
}: {
  asset: RiskAsset;
  actionClass: string;
}) {
  return (
    <>
      <div className="risk-cell">
        <RiskRing score={asset.riskScore} level={asset.riskLevel} />
        <span className={`risk-label ${asset.riskLevel}`}>
          {asset.riskLevel === "high"
            ? "High"
            : asset.riskLevel === "moderate"
              ? "Moderate"
              : "Low"}{" "}
          Risk
        </span>
      </div>

      <div className="action-cell">
        <strong className={`action ${actionClass}`}>
          {asset.action}
          {asset.action === "Reduce" && <TrendingDown size={16} />}
          {asset.action === "Watch" && <span>—</span>}
        </strong>

        <p className="position-summary">{asset.explanation}</p>
        <PredictionProgress asset={asset} />

        {asset.marketRegime && (
          <div className="position-meta">
            <span>{asset.marketRegime}</span>
            {asset.probabilityOfDrop !== undefined && (
              <span>
                {(asset.probabilityOfDrop * 100).toFixed(1)}% drop probability
              </span>
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
            <div
              key={driver.feature}
              className={`detail-driver ${driver.impact}`}
            >
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
          <p className="empty-details">
            No supportive signals returned by API.
          </p>
        )}

        <div className="cache-note">
          <strong>Analysis</strong>
          <p>
            {asset.confidence
              ? `Confidence: ${asset.confidence}`
              : "SellSmart AI signal"}
            {asset.priceTimestamp
              ? ` · Price data: ${formatPriceTimestamp(asset.priceTimestamp)}`
              : asset.cacheGeneratedAt
                ? ` · ${new Date(asset.cacheGeneratedAt).toLocaleString()}`
                : ""}
          </p>
        </div>
      </div>
    </div>
  );
}
