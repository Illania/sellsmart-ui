import { API_BASE_URL } from "../config";
import type { ApiPrediction, Position, WatchItem } from "../types";
import { applyPredictionToAsset } from "../utils/risk";

export const fetchPrediction = async (ticker: string): Promise<ApiPrediction> => {
  const response = await fetch(
    `${API_BASE_URL}/predict?ticker=${encodeURIComponent(ticker)}&live=false`
  );

  if (!response.ok) {
    throw new Error(`Failed to load prediction for ${ticker}`);
  }

  return response.json();
};

export const enrichPositionWithApi = async (position: Position): Promise<Position> => {
  const data = await fetchPrediction(position.ticker);
  const currentPrice = data.current_price ?? position.currentPrice ?? position.avgBuyPrice;
  const value = position.shares * currentPrice;
  const costBasis = position.shares * position.avgBuyPrice;
  const pnl = value - costBasis;
  const pnlPct = costBasis > 0 ? (pnl / costBasis) * 100 : 0;

  return {
    ...applyPredictionToAsset(position, data),
    currentPrice,
    value,
    pnl,
    pnlPct,
  };
};

export const enrichWatchItemWithApi = async (item: WatchItem): Promise<WatchItem> => {
  const data = await fetchPrediction(item.ticker);
  return applyPredictionToAsset(item, data);
};
