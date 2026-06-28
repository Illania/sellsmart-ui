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
  options: { forceCache?: boolean } = {},
): Promise<ApiPrediction> => {
  const params = new URLSearchParams({ ticker });
  if (options.forceCache) {
    params.set("force_cache", "true");
  }

  const response = await fetch(
    `${API_BASE_URL}/predict?${params.toString()}`,
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
  options: { forceCache?: boolean } = {},
): Promise<PredictionJob> => {
  const params = new URLSearchParams({ ticker });
  if (options.forceCache) {
    params.set("force_cache", "true");
  }

  const response = await fetch(
    `${API_BASE_URL}/prediction-jobs?${params.toString()}`,
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
  options: { forceCache?: boolean } = {},
): Promise<ApiPrediction> => {
  let job = await enqueuePrediction(ticker, accessToken, options);
  onJobUpdate?.(job);

  const firstPrediction = job.prediction ?? job.prediction_json;

  if (job.status === "completed" && firstPrediction) {
    return firstPrediction;
  }

  if (job.status === "failed") {
    throw new Error(job.error_message || `Prediction failed for ${ticker}`);
  }

  const jobId = job.job_id;

  if (!jobId) {
    throw new Error(`Prediction job was not created for ${ticker}`);
  }

  const startedAt = Date.now();

  while (Date.now() - startedAt < PREDICTION_POLL_TIMEOUT_MS) {
    await sleep(PREDICTION_POLL_INTERVAL_MS);

    job = await fetchPredictionJob(jobId, accessToken);
    onJobUpdate?.(job);

    const completedPrediction = job.prediction ?? job.prediction_json;

    if (job.status === "completed" && completedPrediction) {
      return completedPrediction;
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
  options: { queued?: boolean; forceCache?: boolean } = {},
): Promise<Position> => {
  const data = options.queued
    ? await fetchPredictionQueued(position.ticker, accessToken, onJobUpdate, {
        forceCache: options.forceCache,
      })
    : await fetchPrediction(position.ticker, accessToken, {
        forceCache: options.forceCache,
      });

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
  options: { queued?: boolean; forceCache?: boolean } = {},
): Promise<WatchItem> => {
  const data = options.queued
    ? await fetchPredictionQueued(item.ticker, accessToken, onJobUpdate, {
        forceCache: options.forceCache,
      })
    : await fetchPrediction(item.ticker, accessToken, {
        forceCache: options.forceCache,
      });
  return {
    ...applyPredictionToAsset(item, data),
    predictionStatus: "completed",
    predictionJobId: undefined,
    predictionProgress: 100,
    predictionMessage: "Prediction ready.",
  };
};
