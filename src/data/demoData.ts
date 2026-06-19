import type { Position, WatchItem } from "../types";
import { createBasePosition, createBaseWatchItem } from "../utils/risk";

export const demoPositions: Position[] = [
  createBasePosition("NVDA", 10, 180, true),
  createBasePosition("AMD", 20, 120, true),
  createBasePosition("AAPL", 15, 190, true),
  createBasePosition("MSFT", 8, 430, true),
  createBasePosition("TSLA", 12, 260, true),
  createBasePosition("INTC", 50, 28, true),
  createBasePosition("META", 6, 620, true),
  createBasePosition("GOOGL", 10, 180, true),
  createBasePosition("AMZN", 8, 210, true),
  createBasePosition("JPM", 12, 250, true),
];

export const demoWatchlist: WatchItem[] = [
  createBaseWatchItem("TSLA", true),
  createBaseWatchItem("META", true),
  createBaseWatchItem("GOOGL", true),
  createBaseWatchItem("NFLX", true),
];
