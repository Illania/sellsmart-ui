import { supabase } from "../supabaseClient";
import { defaultSettings } from "../config";
import type { AppSettings, Position, WatchItem } from "../types";
import {
  createBasePosition,
  createBaseWatchItem,
  normalizePosition,
  normalizeWatchItem,
} from "../utils/risk";

export async function ensureUserSettings() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("No authenticated user");

  await supabase.from("user_settings").upsert({
    user_id: user.id,
  });
}

export async function loadSettings(): Promise<AppSettings> {
  const { data, error } = await supabase
    .from("user_settings")
    .select("*")
    .single();

  if (error) throw error;

  return {
    highRiskThreshold: data.high_risk_threshold,
    portfolioRiskThreshold: data.portfolio_risk_threshold,
    enableRiskAlerts: data.enable_risk_alerts,
    enableReduceAlerts: data.enable_reduce_alerts,
    enableNewsAlerts: data.enable_news_alerts,
    defaultView: data.default_view ?? defaultSettings.defaultView,
  };
}

export async function saveSettings(settings: AppSettings) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("No authenticated user");

  const { error } = await supabase.from("user_settings").upsert({
    user_id: user.id,
    high_risk_threshold: settings.highRiskThreshold,
    portfolio_risk_threshold: settings.portfolioRiskThreshold,
    enable_risk_alerts: settings.enableRiskAlerts,
    enable_reduce_alerts: settings.enableReduceAlerts,
    enable_news_alerts: settings.enableNewsAlerts,
    default_view: settings.defaultView,
    updated_at: new Date().toISOString(),
  });

  if (error) throw error;
}

export async function loadPositions(): Promise<Position[]> {
  const { data, error } = await supabase
    .from("positions")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) throw error;

  return (data ?? []).map((row) =>
    normalizePosition(
      createBasePosition(row.ticker, Number(row.shares), Number(row.avg_buy_price))
    )
  );
}

export async function replacePositions(positions: Position[]) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("No authenticated user");

  await supabase.from("positions").delete().eq("user_id", user.id);

  if (!positions.length) return;

  const { error } = await supabase.from("positions").insert(
    positions.map((position) => ({
      user_id: user.id,
      ticker: position.ticker,
      shares: position.shares,
      avg_buy_price: position.avgBuyPrice,
    }))
  );

  if (error) throw error;
}

export async function loadWatchlist(): Promise<WatchItem[]> {
  const { data, error } = await supabase
    .from("watchlist")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) throw error;

  return (data ?? []).map((row) =>
    normalizeWatchItem(createBaseWatchItem(row.ticker))
  );
}

export async function replaceWatchlist(watchlist: WatchItem[]) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("No authenticated user");

  await supabase.from("watchlist").delete().eq("user_id", user.id);

  if (!watchlist.length) return;

  const { error } = await supabase.from("watchlist").insert(
    watchlist.map((item) => ({
      user_id: user.id,
      ticker: item.ticker,
    }))
  );

  if (error) throw error;
}

export async function loadReadAlertIds(): Promise<string[]> {
  const { data, error } = await supabase.from("read_alerts").select("alert_id");

  if (error) throw error;

  return (data ?? []).map((row) => row.alert_id);
}

export async function replaceReadAlertIds(alertIds: string[]) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("No authenticated user");

  await supabase.from("read_alerts").delete().eq("user_id", user.id);

  if (!alertIds.length) return;

  const { error } = await supabase.from("read_alerts").insert(
    alertIds.map((alertId) => ({
      user_id: user.id,
      alert_id: alertId,
    }))
  );

  if (error) throw error;
}