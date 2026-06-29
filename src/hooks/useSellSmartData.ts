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
  upsertTickerFromSearchResult,
} from "../api/sellsmartData";
import { searchSymbols } from "../api/symbols";
import { defaultSettings } from "../config";
import { applyAppearanceMode } from "../themeScript";
import { demoPositions, demoWatchlist } from "../data/demoData";
import type { AppSettings, Position, PredictionJob, SymbolSearchResult, ViewType, WatchItem } from "../types";
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
  const [isUserDataReady, setIsUserDataReady] = useState(false);
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

  const applySelectedSymbolMetadata = <T extends Position | WatchItem>(
    asset: T,
    symbolMetadata?: SymbolSearchResult,
  ): T => {
    if (!symbolMetadata || symbolMetadata.symbol.trim().toUpperCase() !== asset.ticker) {
      return asset;
    }

    return {
      ...asset,
      company: symbolMetadata.companyName || asset.company,
      logoUrl: symbolMetadata.logoUrl || asset.logoUrl,
    };
  };

  const hydrateMissingTickerMetadata = async (
    basePositions: Position[],
    baseWatchlist: WatchItem[],
  ) => {
    if (!session?.access_token) {
      return { positions: basePositions, watchlist: baseWatchlist };
    }

    const missingTickers = Array.from(
      new Set(
        [...basePositions, ...baseWatchlist]
          .filter((asset) => !asset.logoUrl)
          .map((asset) => asset.ticker.trim().toUpperCase())
          .filter(Boolean),
      ),
    );

    if (!missingTickers.length) {
      return { positions: basePositions, watchlist: baseWatchlist };
    }

    const metadataByTicker = new Map<string, SymbolSearchResult>();

    await Promise.allSettled(
      missingTickers.map(async (ticker) => {
        const results = await searchSymbols(ticker, session.access_token);
        const exactMatch = results.find(
          (result) => result.symbol.trim().toUpperCase() === ticker,
        );
        const metadata = exactMatch ?? results[0];

        if (!metadata) return;

        await upsertTickerFromSearchResult(metadata);
        metadataByTicker.set(ticker, metadata);
      }),
    );

    if (!metadataByTicker.size) {
      return { positions: basePositions, watchlist: baseWatchlist };
    }

    return {
      positions: basePositions.map((position) =>
        applySelectedSymbolMetadata(position, metadataByTicker.get(position.ticker)),
      ),
      watchlist: baseWatchlist.map((item) =>
        applySelectedSymbolMetadata(item, metadataByTicker.get(item.ticker)),
      ),
    };
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
              { queued: true, forceCache: true },
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
              { queued: true, forceCache: true },
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
    symbolMetadata?: SymbolSearchResult,
  ) => {
    await updatePosition(ticker, ticker, shares, avgBuyPrice, symbolMetadata);
  };

  const updatePosition = async (
    oldTicker: string,
    ticker: string,
    shares: number,
    avgBuyPrice: number,
    symbolMetadata?: SymbolSearchResult,
  ) => {
    if (!session?.access_token) {
      console.error("You must be signed in to update positions.");
      return;
    }

    const normalizedOldTicker = oldTicker.trim().toUpperCase();
    const normalizedTicker = ticker.trim().toUpperCase();
    const basePosition = applySelectedSymbolMetadata(
      createBasePosition(
        normalizedTicker,
        shares,
        avgBuyPrice,
      ),
      symbolMetadata,
    );

    if (symbolMetadata) {
      await upsertTickerFromSearchResult(symbolMetadata);
    }

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

  const deletePositions = async (tickers: string[]) => {
    const normalizedTickers = new Set(
      tickers.map((ticker) => ticker.trim().toUpperCase()).filter(Boolean),
    );

    if (normalizedTickers.size === 0) return;

    const nextPositions = positions.filter(
      (position) => !normalizedTickers.has(position.ticker),
    );

    setPositions(nextPositions);
    await replacePositions(nextPositions);
  };

  const deletePosition = async (ticker: string) => {
    await deletePositions([ticker]);
  };

  const addWatchItem = async (ticker: string, symbolMetadata?: SymbolSearchResult) => {
    await updateWatchItem(ticker, ticker, symbolMetadata);
  };

  const updateWatchItem = async (
    oldTicker: string,
    ticker: string,
    symbolMetadata?: SymbolSearchResult,
  ) => {
    if (!session?.access_token) {
      console.error("You must be signed in to update watchlist items.");
      return;
    }

    const normalizedOldTicker = oldTicker.trim().toUpperCase();
    const normalizedTicker = ticker.trim().toUpperCase();
    const baseItem = applySelectedSymbolMetadata(
      createBaseWatchItem(normalizedTicker),
      symbolMetadata,
    );

    if (symbolMetadata) {
      await upsertTickerFromSearchResult(symbolMetadata);
    }

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
      setIsUserDataReady(false);
      hasAppliedDefaultView.current = false;
      activePredictionRequests.current = 0;
      setIsLoadingPredictions(false);
      setPositions([]);
      setWatchlist([]);
      setReadAlertIds([]);
      setSettings(defaultSettings);
      return;
    }

    const loadUserData = async () => {
      setIsUserDataReady(false);
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

        applyAppearanceMode(loadedSettings.appearance);
        setSettings(loadedSettings);
        setIsUserDataReady(true);

        if (!hasAppliedDefaultView.current) {
          setActiveView(loadedSettings.defaultView);
          hasAppliedDefaultView.current = true;
        }

        const hydratedAssets = await hydrateMissingTickerMetadata(
          loadedPositions,
          loadedWatchlist,
        );

        setReadAlertIds(loadedReadAlertIds);
        setPositions(hydratedAssets.positions);
        setWatchlist(hydratedAssets.watchlist);

        if (hydratedAssets.positions.length > 0) {
          void refreshPositions(hydratedAssets.positions);
        }

        if (hydratedAssets.watchlist.length > 0) {
          void refreshWatchlist(hydratedAssets.watchlist);
        }
      } catch (error) {
        console.error(error);
        setIsUserDataReady(true);
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
    isUserDataReady,
    saveReadAlerts,
    updateSetting,
    resetDemoData,
    importDemoPortfolio,
    addPosition,
    updatePosition,
    importPositions,
    deletePosition,
    deletePositions,
    addWatchItem,
    updateWatchItem,
    deleteWatchItem,
  };
}
