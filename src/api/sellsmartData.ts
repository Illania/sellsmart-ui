import { supabase } from "../supabaseClient";
import { defaultSettings } from "../config";
import type { AlertQuickFilter, AppSettings, Position, ReadAlertRecord, SymbolSearchResult, WatchItem } from "../types";
import {
  createBasePosition,
  createBaseWatchItem,
  normalizePosition,
  normalizeWatchItem,
} from "../utils/risk";


type TickerMetadata = {
  symbol: string;
  companyName?: string;
  logoUrl?: string;
};

type TickerRow = {
  symbol: string;
  company_name: string | null;
  logo_url: string | null;
};

const normalizeTicker = (ticker: string) => ticker.trim().toUpperCase();

const defaultAlertQuickFilters: AlertQuickFilter[] = ["all", "unread", "read", "high", "today"];

const availableAlertQuickFilters: AlertQuickFilter[] = [
  "all",
  "unread",
  "read",
  "high",
  "medium",
  "low",
  "today",
  "7d",
  "30d",
];

const normalizeAlertQuickFilters = (value: unknown): AlertQuickFilter[] => {
  if (!Array.isArray(value)) return defaultAlertQuickFilters;

  const allowed = new Set<AlertQuickFilter>(availableAlertQuickFilters);
  const normalized = value.filter((item): item is AlertQuickFilter => allowed.has(item as AlertQuickFilter));

  return normalized.length ? Array.from(new Set(normalized)) : defaultAlertQuickFilters;
};


const toTickerMetadata = (metadata: TickerMetadata): TickerMetadata | null => {
  const symbol = normalizeTicker(metadata.symbol);

  if (!symbol) return null;

  return {
    symbol,
    companyName: metadata.companyName?.trim() || symbol,
    logoUrl: metadata.logoUrl?.trim() || undefined,
  };
};

const isUsefulCompanyName = (companyName?: string | null, symbol?: string) => {
  const normalizedCompanyName = companyName?.trim();
  if (!normalizedCompanyName) return false;

  return normalizedCompanyName.toUpperCase() !== normalizeTicker(symbol ?? "");
};

const mergeTickerMetadata = (
  incoming: TickerMetadata,
  existing?: TickerRow | null,
): TickerMetadata => ({
  symbol: incoming.symbol,
  companyName: isUsefulCompanyName(incoming.companyName, incoming.symbol)
    ? incoming.companyName
    : existing?.company_name || incoming.companyName || incoming.symbol,
  logoUrl: incoming.logoUrl || existing?.logo_url || undefined,
});

export async function upsertTickerMetadata(metadata?: TickerMetadata | null) {
  const normalized = metadata ? toTickerMetadata(metadata) : null;

  if (!normalized) return;

  const { data: existing, error: selectError } = await supabase
    .from("tickers")
    .select("symbol, company_name, logo_url")
    .eq("symbol", normalized.symbol)
    .maybeSingle();

  if (selectError) throw selectError;

  const merged = mergeTickerMetadata(normalized, existing as TickerRow | null);

  const { error } = await supabase.from("tickers").upsert(
    {
      symbol: merged.symbol,
      company_name: merged.companyName ?? merged.symbol,
      logo_url: merged.logoUrl ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "symbol" },
  );

  if (error) throw error;
}

export async function upsertTickerFromSearchResult(symbol: SymbolSearchResult) {
  await upsertTickerMetadata({
    symbol: symbol.symbol,
    companyName: symbol.companyName,
    logoUrl: symbol.logoUrl,
  });
}

async function upsertTickersFromAssets(assets: Array<Position | WatchItem>) {
  const metadataBySymbol = new Map<string, TickerMetadata>();

  assets.forEach((asset) => {
    const symbol = normalizeTicker(asset.ticker);
    if (!symbol) return;

    metadataBySymbol.set(symbol, {
      symbol,
      companyName: asset.company,
      logoUrl: asset.logoUrl,
    });
  });

  const metadata = Array.from(metadataBySymbol.values())
    .map(toTickerMetadata)
    .filter((item): item is TickerMetadata => Boolean(item));

  await Promise.all(metadata.map((item) => upsertTickerMetadata(item)));
}

async function loadTickerMetadataMap(tickers: string[]) {
  const symbols = Array.from(
    new Set(tickers.map(normalizeTicker).filter(Boolean)),
  );

  if (!symbols.length) return new Map<string, TickerRow>();

  const { data, error } = await supabase
    .from("tickers")
    .select("symbol, company_name, logo_url")
    .in("symbol", symbols);

  if (error) throw error;

  return new Map(
    (data ?? []).map((row) => [normalizeTicker(row.symbol), row as TickerRow]),
  );
}

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
    appearance: data.appearance ?? defaultSettings.appearance,
    alertHistoryDays: data.alert_history_days ?? defaultSettings.alertHistoryDays,
    alertQuickFilters: normalizeAlertQuickFilters(data.alert_quick_filters),
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
    appearance: settings.appearance,
    alert_history_days: settings.alertHistoryDays,
    alert_quick_filters: settings.alertQuickFilters,
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

  const tickerMetadata = await loadTickerMetadataMap(
    (data ?? []).map((row) => row.ticker),
  );

  return (data ?? []).map((row) => {
    const metadata = tickerMetadata.get(normalizeTicker(row.ticker));

    return normalizePosition({
      ...createBasePosition(row.ticker, Number(row.shares), Number(row.avg_buy_price)),
      company: metadata?.company_name || undefined,
      logoUrl: metadata?.logo_url || undefined,
      isDemo: Boolean(row.is_demo),
    });
  });
}

export async function replacePositions(positions: Position[]) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("No authenticated user");

  await upsertTickersFromAssets(positions);

  await supabase.from("positions").delete().eq("user_id", user.id);

  if (!positions.length) return;

  const { error } = await supabase.from("positions").insert(
    positions.map((position) => ({
      user_id: user.id,
      ticker: position.ticker,
      shares: position.shares,
      avg_buy_price: position.avgBuyPrice,
      is_demo: Boolean(position.isDemo),
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

  const tickerMetadata = await loadTickerMetadataMap(
    (data ?? []).map((row) => row.ticker),
  );

  return (data ?? []).map((row) => {
    const metadata = tickerMetadata.get(normalizeTicker(row.ticker));

    return normalizeWatchItem({
      ...createBaseWatchItem(row.ticker),
      company: metadata?.company_name || undefined,
      logoUrl: metadata?.logo_url || undefined,
      isDemo: Boolean(row.is_demo),
    });
  });
}

export async function replaceWatchlist(watchlist: WatchItem[]) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("No authenticated user");

  await upsertTickersFromAssets(watchlist);

  await supabase.from("watchlist").delete().eq("user_id", user.id);

  if (!watchlist.length) return;

  const { error } = await supabase.from("watchlist").insert(
    watchlist.map((item) => ({
      user_id: user.id,
      ticker: item.ticker,
      is_demo: Boolean(item.isDemo),
    }))
  );

  if (error) throw error;
}


export async function deleteDemoData() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("No authenticated user");

  const [{ error: positionsError }, { error: watchlistError }] =
    await Promise.all([
      supabase
        .from("positions")
        .delete()
        .eq("user_id", user.id)
        .eq("is_demo", true),
      supabase
        .from("watchlist")
        .delete()
        .eq("user_id", user.id)
        .eq("is_demo", true),
    ]);

  if (positionsError) throw positionsError;
  if (watchlistError) throw watchlistError;
}

export async function loadReadAlerts(): Promise<ReadAlertRecord[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("No authenticated user");

  const { data, error } = await supabase
    .from("read_alerts")
    .select("alert_id, read_at, created_at, cleared_at")
    .eq("user_id", user.id)
    .order("read_at", { ascending: false });

  if (error) throw error;

  return (data ?? []).map((row) => ({
    alertId: row.alert_id,
    readAt: row.read_at ?? row.created_at,
    clearedAt: row.cleared_at ?? undefined,
  }));
}

export async function markAlertsAsRead(alertIds: string[]): Promise<ReadAlertRecord[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("No authenticated user");

  const uniqueAlertIds = Array.from(new Set(alertIds)).filter(Boolean);

  if (!uniqueAlertIds.length) return [];

  const { data: existingRows, error: selectError } = await supabase
    .from("read_alerts")
    .select("alert_id, read_at, created_at, cleared_at")
    .eq("user_id", user.id)
    .in("alert_id", uniqueAlertIds);

  if (selectError) throw selectError;

  const existingAlertIds = new Set((existingRows ?? []).map((row) => row.alert_id));
  const newAlertIds = uniqueAlertIds.filter((alertId) => !existingAlertIds.has(alertId));

  if (!newAlertIds.length) {
    return (existingRows ?? []).map((row) => ({
      alertId: row.alert_id,
      readAt: row.read_at ?? row.created_at,
      clearedAt: row.cleared_at ?? undefined,
    }));
  }

  const now = new Date().toISOString();
  const rows = newAlertIds.map((alertId) => ({
    user_id: user.id,
    alert_id: alertId,
    created_at: now,
    read_at: now,
  }));

  const { error } = await supabase.from("read_alerts").insert(rows);

  if (error) throw error;

  return rows.map((row) => ({ alertId: row.alert_id, readAt: row.read_at }));
}

export async function clearReadAlertHistory() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("No authenticated user");

  const { error } = await supabase
    .from("read_alerts")
    .update({ cleared_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .is("cleared_at", null);

  if (error) throw error;
}

export async function deleteReadAlertState() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("No authenticated user");

  const { error } = await supabase
    .from("read_alerts")
    .delete()
    .eq("user_id", user.id);

  if (error) throw error;
}
