import { API_BASE_URL } from "../config";
import type { SymbolSearchResult } from "../types";

type RawSymbolSearchResult = Partial<SymbolSearchResult> & {
  name?: string;
  company_name?: string;
  companyName?: string;
  exchange_name?: string;
  exchangeName?: string;
  instrument_type?: string;
  instrumentType?: string;
  logo_url?: string;
  logoUrl?: string;
  provider_symbol?: string;
  providerSymbol?: string;
};

const normalizeSymbolResult = (item: RawSymbolSearchResult): SymbolSearchResult => ({
  symbol: String(item.symbol ?? "").toUpperCase(),
  companyName: String(item.companyName ?? item.company_name ?? item.name ?? item.symbol ?? ""),
  exchange: item.exchange ? String(item.exchange) : undefined,
  exchangeName: item.exchangeName ?? item.exchange_name,
  country: item.country,
  currency: item.currency,
  type: String(item.type ?? item.instrumentType ?? item.instrument_type ?? "Stock"),
  logoUrl: item.logoUrl ?? item.logo_url,
  provider: item.provider,
  providerSymbol: item.providerSymbol ?? item.provider_symbol,
});


const PRIMARY_EXCHANGES = new Set([
  "NASDAQ",
  "NYSE",
  "AMEX",
  "NYSEARCA",
  "BATS",
]);

const scoreSymbolResult = (item: SymbolSearchResult, query: string) => {
  const normalizedQuery = query.trim().toUpperCase();
  const symbol = item.symbol.trim().toUpperCase();
  const exchange = item.exchange?.trim().toUpperCase();
  const companyName = item.companyName.trim().toUpperCase();

  let score = 0;

  if (symbol === normalizedQuery) score += 1000;
  if (symbol.startsWith(normalizedQuery)) score += 200;
  if (item.logoUrl) score += 260;
  if (exchange && PRIMARY_EXCHANGES.has(exchange)) score += 200;
  if (item.currency === "USD") score += 80;
  if (item.type?.toLowerCase().includes("common stock")) score += 30;
  if (companyName && companyName !== symbol) score += 80;
  if (companyName === symbol) score -= 120;

  return score;
};

export async function searchSymbols(
  query: string,
  accessToken?: string,
  limit = 8,
): Promise<SymbolSearchResult[]> {
  const trimmedQuery = query.trim();

  if (trimmedQuery.length < 2) {
    return [];
  }

  const params = new URLSearchParams({
    q: trimmedQuery,
    limit: String(limit),
  });

  const response = await fetch(`${API_BASE_URL}/symbols/search?${params.toString()}`, {
    headers: accessToken
      ? {
          Authorization: `Bearer ${accessToken}`,
        }
      : undefined,
  });

  if (!response.ok) {
    throw new Error("Failed to search symbols");
  }

  const data = await response.json();

  // Backend returns { items: [...] }. Keep fallbacks so the UI remains
  // provider/backend-shape tolerant during future API changes.
  const items = Array.isArray(data)
    ? data
    : data?.items ?? data?.results ?? data?.data ?? [];

  return items
    .map(normalizeSymbolResult)
    .filter((item: SymbolSearchResult) => item.symbol && item.companyName)
    .sort(
      (a: SymbolSearchResult, b: SymbolSearchResult) =>
        scoreSymbolResult(b, trimmedQuery) - scoreSymbolResult(a, trimmedQuery),
    );
}
