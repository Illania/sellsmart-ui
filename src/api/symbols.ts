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
    .filter((item: SymbolSearchResult) => item.symbol && item.companyName);
}
