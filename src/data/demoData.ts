import type { Position, WatchItem } from "../types";
import { createBasePosition, createBaseWatchItem } from "../utils/risk";

export const demoPositions: Position[] = [
  createBasePosition("NVDA", 10, 180),
  createBasePosition("AMD", 20, 120),
  createBasePosition("AAPL", 15, 190),
  createBasePosition("MSFT", 8, 430),
  createBasePosition("TSLA", 12, 260),
  createBasePosition("INTC", 50, 28),
  createBasePosition("META", 6, 620),
  createBasePosition("GOOGL", 10, 180),
  createBasePosition("AMZN", 8, 210),
  createBasePosition("JPM", 12, 250),
];

export const demoWatchlist: WatchItem[] = [
  createBaseWatchItem("TSLA"),
  createBaseWatchItem("META"),
  createBaseWatchItem("GOOGL"),
  createBaseWatchItem("NFLX"),
];
