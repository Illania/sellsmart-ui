import { useEffect, useRef, useState } from "react";
import type { Session } from "@supabase/supabase-js";

import {
  enrichPositionWithApi,
  enrichWatchItemWithApi,
} from "../api/predictions";
import {
  ensureUserSettings,
  loadPositions,
  loadReadAlertIds,
  loadSettings,
  loadWatchlist,
  deleteDemoData,
  replacePositions,
  replaceReadAlertIds,
  replaceWatchlist,
  saveSettings,
} from "../api/sellsmartData";
import { defaultSettings } from "../config";
import { demoPositions, demoWatchlist } from "../data/demoData";
import type { AppSettings, Position, PredictionJob, ViewType, WatchItem } from "../types";
import { createBasePosition, createBaseWatchItem } from "../utils/risk";

export function useSellSmartData(
  session: Session | null,
  setActiveView: (view: ViewType) => void,
) {
  const [positions, setPositions] = useState<Position[]>([]);
  const [watchlist, setWatchlist] = useState<WatchItem[]>([]);
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [readAlertIds, setReadAlertIds] = useState<string[]>([]);
  const [isLoadingPredictions, setIsLoadingPredictions] = useState(false);
  const activePredictionRequests = useRef(0);
  const hasAppliedDefaultView = useRef(false);

  const beginPredictionLoading = () => {
    activePredictionRequests.current += 1;
    setIsLoadingPredictions(true);
  };

  const endPredictionLoading = () => {
    activePredictionRequests.current = Math.max(0, activePredictionRequests.current - 1);
    setIsLoadingPredictions(activePredictionRequests.current > 0);
  };

  const getPredictionMessage = (job: PredictionJob) => {
    if (job.status === "completed") return "Prediction ready.";
    if (job.status === "failed") return job.error_message || "Prediction failed.";
    return job.message || "Generating prediction...";
  };

  const applyPositionJobUpdate = (ticker: string, job: PredictionJob) => {
    const normalizedTicker = ticker.trim().toUpperCase();
    const message = getPredictionMessage(job);

    setPositions((currentPositions) =>
      currentPositions.map((position) =>
        position.ticker === normalizedTicker
          ? {
              ...position,
              predictionStatus: job.status,
              predictionJobId: job.job_id ?? position.predictionJobId,
              predictionProgress: job.progress ?? position.predictionProgress,
              predictionMessage: message,
              explanation: job.status === "completed" ? position.explanation : message,
            }
          : position,
      ),
    );
  };

  const applyWatchJobUpdate = (ticker: string, job: PredictionJob) => {
    const normalizedTicker = ticker.trim().toUpperCase();
    const message = getPredictionMessage(job);

    setWatchlist((currentWatchlist) =>
      currentWatchlist.map((item) =>
        item.ticker === normalizedTicker
          ? {
              ...item,
              predictionStatus: job.status,
              predictionJobId: job.job_id ?? item.predictionJobId,
              predictionProgress: job.progress ?? item.predictionProgress,
              predictionMessage: message,
              explanation: job.status === "completed" ? item.explanation : message,
            }
          : item,
      ),
    );
  };

  const markPositionPredictionFailed = (ticker: string) => {
    const normalizedTicker = ticker.trim().toUpperCase();
    setPositions((currentPositions) =>
      currentPositions.map((position) =>
        position.ticker === normalizedTicker
          ? {
              ...position,
              predictionStatus: "failed",
              predictionProgress: 100,
              predictionMessage: `Could not load API prediction for ${normalizedTicker}.`,
              explanation: `Could not load API prediction for ${normalizedTicker}.`,
            }
          : position,
      ),
    );
  };

  const markWatchPredictionFailed = (ticker: string) => {
    const normalizedTicker = ticker.trim().toUpperCase();
    setWatchlist((currentWatchlist) =>
      currentWatchlist.map((item) =>
        item.ticker === normalizedTicker
          ? {
              ...item,
              predictionStatus: "failed",
              predictionProgress: 100,
              predictionMessage: `Could not load API prediction for ${normalizedTicker}.`,
              explanation: `Could not load API prediction for ${normalizedTicker}.`,
            }
          : item,
      ),
    );
  };

  const saveReadAlerts = async (nextReadAlertIds: string[]) => {
    setReadAlertIds(nextReadAlertIds);
    await replaceReadAlertIds(nextReadAlertIds);
  };

  const refreshPositions = async (basePositions: Position[]) => {
    beginPredictionLoading();

    try {
      if (!session?.access_token) {
        throw new Error("You must be signed in to load predictions");
      }

      const enriched = await Promise.all(
        basePositions.map(async (position) => {
          try {
            return await enrichPositionWithApi(
              position,
              session.access_token,
              (job) => applyPositionJobUpdate(position.ticker, job),
              { queued: true },
            );
          } catch (error) {
            console.error(error);

            return {
              ...position,
              predictionStatus: "failed" as const,
              predictionProgress: 100,
              predictionMessage: `Could not load API prediction for ${position.ticker}.`,
              explanation: `Could not load API prediction for ${position.ticker}.`,
            };
          }
        }),
      );

      setPositions(enriched);
    } finally {
      endPredictionLoading();
    }
  };

  const refreshWatchlist = async (baseWatchlist: WatchItem[]) => {
    beginPredictionLoading();

    try {
      if (!session?.access_token) {
        throw new Error("You must be signed in to load predictions");
      }

      const enriched = await Promise.all(
        baseWatchlist.map(async (item) => {
          try {
            return await enrichWatchItemWithApi(
              item,
              session.access_token,
              (job) => applyWatchJobUpdate(item.ticker, job),
              { queued: true },
            );
          } catch (error) {
            console.error(error);

            return {
              ...item,
              predictionStatus: "failed" as const,
              predictionProgress: 100,
              predictionMessage: `Could not load API prediction for ${item.ticker}.`,
              explanation: `Could not load API prediction for ${item.ticker}.`,
            };
          }
        }),
      );

      setWatchlist(enriched);
    } finally {
      endPredictionLoading();
    }
  };

  const updateSetting = <K extends keyof AppSettings>(
    key: K,
    value: AppSettings[K],
  ) => {
    const nextSettings = {
      ...settings,
      [key]: value,
    };

    setSettings(nextSettings);
    void saveSettings(nextSettings);
  };

  const resetDemoData = async () => {
    const nextPositions = positions.filter((position) => !position.isDemo);
    const nextWatchlist = watchlist.filter((item) => !item.isDemo);

    setPositions(nextPositions);
    setWatchlist(nextWatchlist);
    setReadAlertIds([]);

    await Promise.all([
      deleteDemoData(),
      replaceReadAlertIds([]),
    ]);

    if (nextPositions.length > 0) {
      void refreshPositions(nextPositions);
    }

    if (nextWatchlist.length > 0) {
      void refreshWatchlist(nextWatchlist);
    }
  };

  const importDemoPortfolio = async () => {
    const realPositionTickers = new Set(
      positions
        .filter((position) => !position.isDemo)
        .map((position) => position.ticker),
    );
    const realWatchlistTickers = new Set(
      watchlist
        .filter((item) => !item.isDemo)
        .map((item) => item.ticker),
    );

    const nextPositions = [
      ...positions.filter((position) => !position.isDemo),
      ...demoPositions.filter(
        (position) => !realPositionTickers.has(position.ticker),
      ),
    ];

    const nextWatchlist = [
      ...watchlist.filter((item) => !item.isDemo),
      ...demoWatchlist.filter((item) => !realWatchlistTickers.has(item.ticker)),
    ];

    setPositions(nextPositions);
    setWatchlist(nextWatchlist);
    setReadAlertIds([]);

    await Promise.all([
      replacePositions(nextPositions),
      replaceWatchlist(nextWatchlist),
      replaceReadAlertIds([]),
    ]);

    void refreshPositions(nextPositions);
    void refreshWatchlist(nextWatchlist);
  };

  const addPosition = async (
    ticker: string,
    shares: number,
    avgBuyPrice: number,
  ) => {
    await updatePosition(ticker, ticker, shares, avgBuyPrice);
  };

  const updatePosition = async (
    oldTicker: string,
    ticker: string,
    shares: number,
    avgBuyPrice: number,
  ) => {
    if (!session?.access_token) {
      console.error("You must be signed in to update positions.");
      return;
    }

    const normalizedOldTicker = oldTicker.trim().toUpperCase();
    const normalizedTicker = ticker.trim().toUpperCase();
    const basePosition = createBasePosition(
      normalizedTicker,
      shares,
      avgBuyPrice,
    );

    const nextPositions = [
      ...positions.filter(
        (position) =>
          position.ticker !== normalizedOldTicker &&
          position.ticker !== normalizedTicker,
      ),
      basePosition,
    ];

    setPositions(nextPositions);
    await replacePositions(nextPositions);

    beginPredictionLoading();
    try {
      const enrichedPosition = await enrichPositionWithApi(
        basePosition,
        session.access_token,
        (job) => applyPositionJobUpdate(normalizedTicker, job),
        { queued: true },
      );

      setPositions((currentPositions) =>
        currentPositions.map((position) =>
          position.ticker === normalizedTicker ? enrichedPosition : position,
        ),
      );
    } catch (error) {
      console.error(error);
      markPositionPredictionFailed(normalizedTicker);
    } finally {
      endPredictionLoading();
    }
  };

  const importPositions = async (nextPositions: Position[]) => {
    setPositions(nextPositions);
    await replacePositions(nextPositions);

    if (nextPositions.length > 0) {
      void refreshPositions(nextPositions);
    }
  };

  const deletePosition = async (ticker: string) => {
    const normalizedTicker = ticker.trim().toUpperCase();
    const nextPositions = positions.filter(
      (position) => position.ticker !== normalizedTicker,
    );

    setPositions(nextPositions);
    await replacePositions(nextPositions);
  };

  const addWatchItem = async (ticker: string) => {
    await updateWatchItem(ticker, ticker);
  };

  const updateWatchItem = async (oldTicker: string, ticker: string) => {
    if (!session?.access_token) {
      console.error("You must be signed in to update watchlist items.");
      return;
    }

    const normalizedOldTicker = oldTicker.trim().toUpperCase();
    const normalizedTicker = ticker.trim().toUpperCase();
    const baseItem = createBaseWatchItem(normalizedTicker);

    const nextWatchlist = [
      ...watchlist.filter(
        (item) =>
          item.ticker !== normalizedOldTicker &&
          item.ticker !== normalizedTicker,
      ),
      baseItem,
    ];

    setWatchlist(nextWatchlist);
    await replaceWatchlist(nextWatchlist);

    beginPredictionLoading();
    try {
      const enrichedItem = await enrichWatchItemWithApi(
        baseItem,
        session.access_token,
        (job) => applyWatchJobUpdate(normalizedTicker, job),
        { queued: true },
      );

      setWatchlist((currentWatchlist) =>
        currentWatchlist.map((item) =>
          item.ticker === normalizedTicker ? enrichedItem : item,
        ),
      );
    } catch (error) {
      console.error(error);
      markWatchPredictionFailed(normalizedTicker);
    } finally {
      endPredictionLoading();
    }
  };

  const deleteWatchItem = async (ticker: string) => {
    const normalizedTicker = ticker.trim().toUpperCase();
    const nextWatchlist = watchlist.filter(
      (item) => item.ticker !== normalizedTicker,
    );

    setWatchlist(nextWatchlist);
    await replaceWatchlist(nextWatchlist);
  };

  useEffect(() => {
    if (!session) {
      hasAppliedDefaultView.current = false;
      activePredictionRequests.current = 0;
      setIsLoadingPredictions(false);
      return;
    }

    const loadUserData = async () => {
      try {
        await ensureUserSettings();

        const [
          loadedSettings,
          loadedPositions,
          loadedWatchlist,
          loadedReadAlertIds,
        ] = await Promise.all([
          loadSettings(),
          loadPositions(),
          loadWatchlist(),
          loadReadAlertIds(),
        ]);

        setSettings(loadedSettings);

        if (!hasAppliedDefaultView.current) {
          setActiveView(loadedSettings.defaultView);
          hasAppliedDefaultView.current = true;
        }

        setReadAlertIds(loadedReadAlertIds);
        setPositions(loadedPositions);
        setWatchlist(loadedWatchlist);

        if (loadedPositions.length > 0) {
          void refreshPositions(loadedPositions);
        }

        if (loadedWatchlist.length > 0) {
          void refreshWatchlist(loadedWatchlist);
        }
      } catch (error) {
        console.error(error);
      }
    };

    void loadUserData();
  }, [session?.user.id]);

  return {
    positions,
    watchlist,
    settings,
    readAlertIds,
    isLoadingPredictions,
    saveReadAlerts,
    updateSetting,
    resetDemoData,
    importDemoPortfolio,
    addPosition,
    updatePosition,
    importPositions,
    deletePosition,
    addWatchItem,
    updateWatchItem,
    deleteWatchItem,
  };
}
