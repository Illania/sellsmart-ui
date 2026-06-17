import { useEffect, useState } from "react";
import { enrichPositionWithApi, enrichWatchItemWithApi } from "../api/predictions";
import {
  ALERTS_READ_STORAGE_KEY,
  defaultSettings,
  POSITIONS_STORAGE_KEY,
  SETTINGS_STORAGE_KEY,
  WATCHLIST_STORAGE_KEY,
} from "../config";
import { demoPositions, demoWatchlist } from "../data/demoData";
import type { AppSettings, Position, WatchItem } from "../types";
import { createBasePosition, createBaseWatchItem, normalizePosition, normalizeWatchItem } from "../utils/risk";

export function useSellSmartData() {
  const [positions, setPositions] = useState<Position[]>([]);
  const [watchlist, setWatchlist] = useState<WatchItem[]>([]);
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [readAlertIds, setReadAlertIds] = useState<string[]>([]);
  const [isLoadingPredictions, setIsLoadingPredictions] = useState(false);

  const savePositions = (nextPositions: Position[]) => {
    setPositions(nextPositions);
    localStorage.setItem(POSITIONS_STORAGE_KEY, JSON.stringify(nextPositions));
  };

  const saveWatchlist = (nextWatchlist: WatchItem[]) => {
    setWatchlist(nextWatchlist);
    localStorage.setItem(WATCHLIST_STORAGE_KEY, JSON.stringify(nextWatchlist));
  };

  const saveReadAlerts = (nextReadAlertIds: string[]) => {
    setReadAlertIds(nextReadAlertIds);
    localStorage.setItem(ALERTS_READ_STORAGE_KEY, JSON.stringify(nextReadAlertIds));
  };

  const refreshPositions = async (basePositions: Position[]) => {
    setIsLoadingPredictions(true);

    try {
      const enriched = await Promise.all(
        basePositions.map(async (position) => {
          try {
            return await enrichPositionWithApi(position);
          } catch (error) {
            console.error(error);
            return {
              ...position,
              explanation: `Could not load API prediction for ${position.ticker}.`,
            };
          }
        })
      );

      savePositions(enriched);
    } finally {
      setIsLoadingPredictions(false);
    }
  };

  const refreshWatchlist = async (baseWatchlist: WatchItem[]) => {
    setIsLoadingPredictions(true);

    try {
      const enriched = await Promise.all(
        baseWatchlist.map(async (item) => {
          try {
            return await enrichWatchItemWithApi(item);
          } catch (error) {
            console.error(error);
            return {
              ...item,
              explanation: `Could not load API prediction for ${item.ticker}.`,
            };
          }
        })
      );

      saveWatchlist(enriched);
    } finally {
      setIsLoadingPredictions(false);
    }
  };

  const updateSetting = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    const nextSettings = {
      ...settings,
      [key]: value,
    };

    setSettings(nextSettings);
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(nextSettings));
  };

  const resetAppData = () => {
    localStorage.removeItem(POSITIONS_STORAGE_KEY);
    localStorage.removeItem(WATCHLIST_STORAGE_KEY);
    localStorage.removeItem(ALERTS_READ_STORAGE_KEY);

    savePositions(demoPositions);
    saveWatchlist(demoWatchlist);
    saveReadAlerts([]);

    refreshPositions(demoPositions);
    refreshWatchlist(demoWatchlist);
  };

  const importDemoPortfolio = () => {
    savePositions(demoPositions);
    saveWatchlist(demoWatchlist);
    saveReadAlerts([]);
    refreshPositions(demoPositions);
    refreshWatchlist(demoWatchlist);
  };

  const addPosition = async (ticker: string, shares: number, avgBuyPrice: number) => {
    const basePosition = createBasePosition(ticker, shares, avgBuyPrice);
    const nextPositions = [...positions.filter((position) => position.ticker !== ticker), basePosition];

    savePositions(nextPositions);

    try {
      const enrichedPosition = await enrichPositionWithApi(basePosition);
      savePositions(
        nextPositions.map((position) =>
          position.ticker === ticker ? enrichedPosition : position
        )
      );
    } catch (error) {
      console.error(error);
    }
  };

  const addWatchItem = async (ticker: string) => {
    const baseItem = createBaseWatchItem(ticker);
    const nextWatchlist = [...watchlist.filter((item) => item.ticker !== ticker), baseItem];

    saveWatchlist(nextWatchlist);

    try {
      const enrichedItem = await enrichWatchItemWithApi(baseItem);
      saveWatchlist(
        nextWatchlist.map((item) => (item.ticker === ticker ? enrichedItem : item))
      );
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    const savedReadAlerts = localStorage.getItem(ALERTS_READ_STORAGE_KEY);
    setReadAlertIds(savedReadAlerts ? JSON.parse(savedReadAlerts) : []);

    const savedPositions = localStorage.getItem(POSITIONS_STORAGE_KEY);
    const rawPositions = savedPositions ? JSON.parse(savedPositions) : demoPositions;
    const basePositions: Position[] = rawPositions.map(normalizePosition);

    const savedWatchlist = localStorage.getItem(WATCHLIST_STORAGE_KEY);
    const rawWatchlist = savedWatchlist ? JSON.parse(savedWatchlist) : demoWatchlist;
    const baseWatchlist: WatchItem[] = rawWatchlist.map(normalizeWatchItem);

    const savedSettings = localStorage.getItem(SETTINGS_STORAGE_KEY);

    if (savedSettings) {
      setSettings({
        ...defaultSettings,
        ...JSON.parse(savedSettings),
      });
    }

    setPositions(basePositions);
    setWatchlist(baseWatchlist);

    localStorage.setItem(POSITIONS_STORAGE_KEY, JSON.stringify(basePositions));
    localStorage.setItem(WATCHLIST_STORAGE_KEY, JSON.stringify(baseWatchlist));

    refreshPositions(basePositions);
    refreshWatchlist(baseWatchlist);
  }, []);

  return {
    positions,
    watchlist,
    settings,
    readAlertIds,
    isLoadingPredictions,
    saveReadAlerts,
    updateSetting,
    resetAppData,
    importDemoPortfolio,
    addPosition,
    addWatchItem,
  };
}
