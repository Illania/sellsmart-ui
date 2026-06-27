import { API_BASE_URL } from "../config";
import type { ApiPrediction, Position, PredictionJob, WatchItem } from "../types";
import { applyPredictionToAsset } from "../utils/risk";

const PREDICTION_POLL_INTERVAL_MS = 2_000;
const PREDICTION_POLL_TIMEOUT_MS = 90_000;

const authHeaders = (accessToken?: string) =>
  accessToken
    ? {
        Authorization: `Bearer ${accessToken}`,
      }
    : undefined;

const sleep = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

export const fetchPrediction = async (
  ticker: string,
  accessToken?: string,
): Promise<ApiPrediction> => {
  const response = await fetch(
    `${API_BASE_URL}/predict?ticker=${encodeURIComponent(ticker)}&live=false`,
    {
      headers: authHeaders(accessToken),
    },
  );

  if (!response.ok) {
    throw new Error(`Failed to load prediction for ${ticker}`);
  }

  return response.json();
};

export const enqueuePrediction = async (
  ticker: string,
  accessToken?: string,
): Promise<PredictionJob> => {
  const response = await fetch(
    `${API_BASE_URL}/prediction-jobs?ticker=${encodeURIComponent(ticker)}&live=false`,
    {
      method: "POST",
      headers: authHeaders(accessToken),
    },
  );

  if (!response.ok) {
    throw new Error(`Failed to queue prediction for ${ticker}`);
  }

  return response.json();
};

export const fetchPredictionJob = async (
  jobId: string,
  accessToken?: string,
): Promise<PredictionJob> => {
  const response = await fetch(`${API_BASE_URL}/prediction-jobs/${jobId}`, {
    headers: authHeaders(accessToken),
  });

  if (!response.ok) {
    throw new Error(`Failed to load prediction job ${jobId}`);
  }

  return response.json();
};

export const fetchPredictionQueued = async (
  ticker: string,
  accessToken?: string,
  onJobUpdate?: (job: PredictionJob) => void,
): Promise<ApiPrediction> => {
  let job = await enqueuePrediction(ticker, accessToken);
  onJobUpdate?.(job);

  if (job.status === "completed" && job.prediction) {
    return job.prediction;
  }

  if (job.status === "failed") {
    throw new Error(job.error_message || `Prediction failed for ${ticker}`);
  }

  if (!job.job_id) {
    throw new Error(`Prediction job was not created for ${ticker}`);
  }

  const startedAt = Date.now();

  while (Date.now() - startedAt < PREDICTION_POLL_TIMEOUT_MS) {
    await sleep(PREDICTION_POLL_INTERVAL_MS);

    job = await fetchPredictionJob(job.job_id, accessToken);
    onJobUpdate?.(job);

    if (job.status === "completed" && job.prediction) {
      return job.prediction;
    }

    if (job.status === "failed") {
      throw new Error(job.error_message || `Prediction failed for ${ticker}`);
    }
  }

  throw new Error(`Prediction for ${ticker} is still running. Please refresh in a moment.`);
};

export const enrichPositionWithApi = async (
  position: Position,
  accessToken?: string,
  onJobUpdate?: (job: PredictionJob) => void,
): Promise<Position> => {
  const data = await fetchPredictionQueued(position.ticker, accessToken, onJobUpdate);

  const currentPrice = data.current_price ?? position.currentPrice ?? position.avgBuyPrice;
  const previousClose = data.previous_close ?? position.previousClose;

  const value = position.shares * currentPrice;
  const costBasis = position.shares * position.avgBuyPrice;

  // Total P/L: compares current market value with the user's average buy price.
  const pnl = value - costBasis;
  const pnlPct = costBasis > 0 ? (pnl / costBasis) * 100 : 0;

  // Daily P/L: compares current price with previous market close, not buy price.
  const dailyPnl = previousClose ? position.shares * (currentPrice - previousClose) : 0;
  const previousValue = previousClose ? position.shares * previousClose : 0;
  const dailyPnlPct = previousValue > 0 ? (dailyPnl / previousValue) * 100 : 0;

  return {
    ...applyPredictionToAsset(position, data),
    predictionStatus: "completed",
    predictionJobId: undefined,
    predictionProgress: 100,
    predictionMessage: "Prediction ready.",
    currentPrice,
    previousClose,
    value,
    pnl,
    pnlPct,
    dailyPnl,
    dailyPnlPct,
  };
};

export const enrichWatchItemWithApi = async (
  item: WatchItem,
  accessToken?: string,
  onJobUpdate?: (job: PredictionJob) => void,
): Promise<WatchItem> => {
  const data = await fetchPredictionQueued(item.ticker, accessToken, onJobUpdate);
  return {
    ...applyPredictionToAsset(item, data),
    predictionStatus: "completed",
    predictionJobId: undefined,
    predictionProgress: 100,
    predictionMessage: "Prediction ready.",
  };
};
