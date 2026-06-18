import { X } from "lucide-react";
import type { RiskAsset } from "../types";
import { AssetDetails } from "./AssetComponents";

type Props = {
  asset?: RiskAsset;
  onClose: () => void;
};

export function TickerInsightsPanel({ asset, onClose }: Props) {
  if (!asset) return null;

  return (
    <div className="ticker-insights-backdrop" onClick={onClose}>
      <section
        className="ticker-insights-panel"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="ticker-insights-header">
          <div>
            <span>Ticker Insights</span>
            <h2>{asset.ticker}</h2>
          </div>

          <button
            type="button"
            className="icon-button"
            onClick={onClose}
            aria-label="Close ticker insights"
          >
            <X size={18} />
          </button>
        </div>

        <p className="ticker-insights-summary">{asset.explanation}</p>

        <AssetDetails asset={asset} />
      </section>
    </div>
  );
}