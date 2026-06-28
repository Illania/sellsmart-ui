import type { SymbolSearchResult } from "../types";

export type CachedSymbolMetadata = {
  ticker: string;
  company?: string;
  logoUrl?: string;
};

const STORAGE_KEY = "sellsmart.symbolMetadata.v1";

const canUseStorage = () => typeof window !== "undefined" && Boolean(window.localStorage);

const normalizeTicker = (ticker: string) => ticker.trim().toUpperCase();

const readCache = (): Record<string, CachedSymbolMetadata> => {
  if (!canUseStorage()) return {};

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};

    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
};

const writeCache = (cache: Record<string, CachedSymbolMetadata>) => {
  if (!canUseStorage()) return;

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
  } catch {
    // Ignore storage quota / privacy-mode errors. The UI will keep using ticker initials.
  }
};

export const getCachedSymbolMetadata = (ticker: string): CachedSymbolMetadata | undefined => {
  const normalizedTicker = normalizeTicker(ticker);
  if (!normalizedTicker) return undefined;

  return readCache()[normalizedTicker];
};

export const cacheSymbolMetadata = (metadata: CachedSymbolMetadata) => {
  const ticker = normalizeTicker(metadata.ticker);
  if (!ticker) return;

  const nextMetadata: CachedSymbolMetadata = {
    ticker,
    company: metadata.company?.trim() || undefined,
    logoUrl: metadata.logoUrl?.trim() || undefined,
  };

  writeCache({
    ...readCache(),
    [ticker]: nextMetadata,
  });
};

export const cacheSymbolSearchResult = (symbol: SymbolSearchResult) => {
  cacheSymbolMetadata({
    ticker: symbol.symbol,
    company: symbol.companyName,
    logoUrl: symbol.logoUrl,
  });
};
