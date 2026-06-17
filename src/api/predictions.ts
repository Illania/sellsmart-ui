import { API_BASE_URL } from "../config";
import type { ApiPrediction, Position, WatchItem } from "../types";
import { applyPredictionToAsset } from "../utils/risk";

export const fetchPrediction = async (
  ticker: string,
  accessToken?: string
): Promise<ApiPrediction> => {
  const response = await fetch(
    `${API_BASE_URL}/predict?ticker=${encodeURIComponent(ticker)}&live=false`,
    {
      headers: accessToken
        ? {
            Authorization: `Bearer ${accessToken}`,
          }
        : undefined,
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to load prediction for ${ticker}`);
  }

  return response.json();
};

export const enrichPositionWithApi = async (
  position: Position,
  accessToken?: string
): Promise<Position> => {
  const data = await fetchPrediction(position.ticker, accessToken);
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

export const enrichWatchItemWithApi = async (
  item: WatchItem,
  accessToken?: string
): Promise<WatchItem> => {
  const data = await fetchPrediction(item.ticker, accessToken);
  return applyPredictionToAsset(item, data);
};