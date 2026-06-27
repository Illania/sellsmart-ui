import { useState } from "react";
import { ChevronRight, Edit3, ExternalLink, Newspaper, Trash2, TrendingDown, X } from "lucide-react";
import type { NewsImpactArticle, Position, RiskAsset, WatchItem } from "../types";
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


const formatArticleTime = (timestamp?: string | null) => {
  if (!timestamp) return "Publication time unavailable";

  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) return "Publication time unavailable";

  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const sentimentLabel = (sentiment?: string) => {
  const normalized = sentiment?.toLowerCase();
  if (normalized === "positive") return "Positive";
  if (normalized === "negative") return "Negative";
  return "Neutral";
};

function NewsThumbnail({ article }: { article: NewsImpactArticle }) {
  if (article.image_url) {
    return (
      <img
        className="news-article-image"
        src={article.image_url}
        alt=""
        loading="lazy"
        onError={(event) => {
          event.currentTarget.style.display = "none";
        }}
      />
    );
  }

  return (
    <div className="news-article-placeholder" aria-hidden="true">
      <Newspaper size={24} />
      <span>{article.source}</span>
    </div>
  );
}

function NewsImpactModal({ asset, onClose }: { asset: RiskAsset; onClose: () => void }) {
  const impact = asset.newsImpact;

  if (!impact) return null;

  const overall = impact.overall_sentiment ?? "neutral";
  const articles = impact.articles ?? [];

  return (
    <div className="modal-backdrop news-impact-backdrop" role="presentation" onClick={onClose}>
      <section
        className="news-impact-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="news-impact-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="news-impact-hero">
          <div>
            <span className="eyebrow">News transparency</span>
            <h2 id="news-impact-title">News affecting {asset.ticker}</h2>
            <p>{impact.summary}</p>
          </div>

          <button type="button" className="modal-close-button" onClick={onClose} aria-label="Close news details">
            <X size={18} />
          </button>
        </div>

        <div className="news-impact-stats">
          <div className={`news-sentiment-card ${overall}`}>
            <span>Overall sentiment</span>
            <strong>{sentimentLabel(overall)}</strong>
            <small>Score {Number(impact.overall_score ?? 0).toFixed(2)}</small>
          </div>
          <div>
            <span>Articles analyzed</span>
            <strong>{impact.article_count ?? articles.length}</strong>
            <small>{Math.round((impact.confidence ?? 0) * 100)}% confidence</small>
          </div>
          <div>
            <span>Breakdown</span>
            <strong>{impact.negative_articles} / {impact.neutral_articles} / {impact.positive_articles}</strong>
            <small>Negative / Neutral / Positive</small>
          </div>
        </div>

        {articles.length > 0 ? (
          <div className="news-article-grid">
            {articles.map((article, index) => (
              <article className="news-article-card" key={`${article.title}-${index}`}>
                <NewsThumbnail article={article} />

                <div className="news-article-body">
                  <div className="news-article-meta">
                    <span>{article.source}</span>
                    <span>{formatArticleTime(article.published_at)}</span>
                  </div>

                  <h3>{article.title}</h3>
                  <p>{article.summary}</p>

                  <div className="news-article-tags">
                    <span className={`sentiment-pill ${article.sentiment.toLowerCase()}`}>
                      {article.sentiment}
                    </span>
                    <span className={`impact-pill ${article.impact.toLowerCase()}`}>
                      {article.impact} impact
                    </span>
                  </div>

                  {article.impact_reasons && article.impact_reasons.length > 0 && (
                    <ul className="news-impact-reasons">
                      {article.impact_reasons.slice(0, 3).map((reason) => (
                        <li key={reason}>{reason}</li>
                      ))}
                    </ul>
                  )}

                  {article.url && (
                    <a href={article.url} target="_blank" rel="noreferrer" className="read-full-link">
                      Read full article <ExternalLink size={14} />
                    </a>
                  )}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="empty-details">No individual articles were returned for this prediction.</p>
        )}
      </section>
    </div>
  );
}

function NewsImpactButton({ asset }: { asset: RiskAsset }) {
  const [isOpen, setIsOpen] = useState(false);
  const impact = asset.newsImpact;

  if (!impact?.has_news || !impact.articles?.length) return null;

  return (
    <>
      <button type="button" className="read-news-button" onClick={() => setIsOpen(true)}>
        <Newspaper size={16} />
        Read News
      </button>

      {isOpen && <NewsImpactModal asset={asset} onClose={() => setIsOpen(false)} />}
    </>
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
        <div className={`position-logo ${position.logoClass}`}>
          {position.logo}
        </div>

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
          <NewsImpactButton asset={position} />
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
        <div className={`position-logo ${position.logoClass}`}>
          {position.logo}
        </div>
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
        <div className={`position-logo ${item.logoClass}`}>{item.logo}</div>

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
          <NewsImpactButton asset={item} />
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
        <div className={`position-logo ${item.logoClass}`}>{item.logo}</div>
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
        <NewsImpactButton asset={asset} />

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

        {asset.newsImpact?.has_news && (
          <div className="cache-note news-cache-note">
            <strong>{sentimentLabel(asset.newsImpact.overall_sentiment)} News Impact</strong>
            <p>{asset.newsImpact.summary}</p>
            <NewsImpactButton asset={asset} />
          </div>
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
