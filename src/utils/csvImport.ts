import type { Position } from "../types";
import { createBasePosition } from "./risk";

export type CsvRow = Record<string, string>;

export type ImportField =
  | "ticker"
  | "quantity"
  | "averagePrice"
  | "purchaseDate"
  | "exchange"
  | "currency"
  | "companyName"
  | "currentPrice"
  | "notes";

export type CsvMapping = Partial<Record<ImportField, string>>;

export type ImportPreviewRow = {
  id: string;
  rowNumber: number;
  ticker: string;
  quantity: number;
  averagePrice: number;
  purchaseDate?: string;
  exchange?: string;
  currency?: string;
  companyName?: string;
  currentPrice?: number;
  notes?: string;
  warnings: string[];
  errors: string[];
};

export type ImportSummary = {
  totalRows: number;
  validRows: number;
  skippedRows: number;
  repeatedTickerRows: number;
  estimatedValue: number;
};

const FIELD_ALIASES: Record<ImportField, string[]> = {
  ticker: ["symbol", "ticker", "ticker symbol", "security", "instrument", "code", "stock", "asset"],
  quantity: ["quantity", "qty", "shares", "share", "units", "holding", "holdings"],
  averagePrice: ["average price", "avg price", "avg cost", "average cost", "purchase price", "buy price", "cost basis", "price", "cost"],
  purchaseDate: ["purchase date", "trade date", "date", "buy date", "transaction date"],
  exchange: ["exchange", "market", "venue"],
  currency: ["currency", "ccy"],
  companyName: ["company", "company name", "name", "security name", "instrument name"],
  currentPrice: ["current price", "market price", "last price", "latest price", "price now"],
  notes: ["notes", "comment", "comments", "memo"],
};

export const importFieldLabels: Record<ImportField, string> = {
  ticker: "Ticker",
  quantity: "Quantity / Shares",
  averagePrice: "Average Buy Price",
  purchaseDate: "Purchase Date",
  exchange: "Exchange",
  currency: "Currency",
  companyName: "Company Name",
  currentPrice: "Current Price",
  notes: "Notes",
};

export const requiredImportFields: ImportField[] = ["ticker", "quantity", "averagePrice"];
export const optionalImportFields: ImportField[] = [
  "purchaseDate",
  "exchange",
  "currency",
  "companyName",
  "currentPrice",
  "notes",
];

export function parseCsv(text: string): { headers: string[]; rows: CsvRow[] } {
  const lines: string[][] = [];
  let current = "";
  let row: string[] = [];
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      row.push(current.trim());
      current = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(current.trim());
      current = "";
      if (row.some((cell) => cell.length > 0)) lines.push(row);
      row = [];
      continue;
    }

    current += char;
  }

  row.push(current.trim());
  if (row.some((cell) => cell.length > 0)) lines.push(row);

  const [rawHeaders = [], ...rawRows] = lines;
  const headers = rawHeaders.map((header, index) => header || `Column ${index + 1}`);
  const rows = rawRows.map((values) =>
    headers.reduce<CsvRow>((acc, header, index) => {
      acc[header] = values[index] ?? "";
      return acc;
    }, {}),
  );

  return { headers, rows };
}

export function guessCsvMapping(headers: string[]): CsvMapping {
  const mapping: CsvMapping = {};
  const normalizedHeaders = headers.map((header) => ({
    original: header,
    normalized: normalizeHeader(header),
  }));

  (Object.keys(FIELD_ALIASES) as ImportField[]).forEach((field) => {
    const aliases = FIELD_ALIASES[field].map(normalizeHeader);
    const exact = normalizedHeaders.find((header) => aliases.includes(header.normalized));

    if (exact) {
      mapping[field] = exact.original;
      return;
    }

    const partial = normalizedHeaders.find((header) =>
      aliases.some((alias) => header.normalized.includes(alias) || alias.includes(header.normalized)),
    );

    if (partial) mapping[field] = partial.original;
  });

  return mapping;
}

export function buildImportPreview(rows: CsvRow[], mapping: CsvMapping): ImportPreviewRow[] {
  return rows.map((row, index) => {
    const ticker = normalizeTicker(getMappedValue(row, mapping.ticker));
    const quantity = parseNumber(getMappedValue(row, mapping.quantity));
    const averagePrice = parseNumber(getMappedValue(row, mapping.averagePrice));
    const currentPrice = parseNumber(getMappedValue(row, mapping.currentPrice));
    const purchaseDate = normalizeDate(getMappedValue(row, mapping.purchaseDate));
    const exchange = cleanText(getMappedValue(row, mapping.exchange))?.toUpperCase();
    const currency = cleanText(getMappedValue(row, mapping.currency))?.toUpperCase();
    const companyName = cleanText(getMappedValue(row, mapping.companyName));
    const notes = cleanText(getMappedValue(row, mapping.notes));
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!ticker) errors.push("Missing ticker");
    if (!Number.isFinite(quantity) || quantity <= 0) errors.push("Missing or invalid quantity");
    if (!Number.isFinite(averagePrice) || averagePrice <= 0) errors.push("Missing or invalid average price");
    if (ticker && !/^[A-Z0-9.\-:]{1,18}$/.test(ticker)) warnings.push("Ticker format looks unusual");
    if (!purchaseDate) warnings.push("No purchase date");
    if (!currency) warnings.push("No currency");

    return {
      id: `${index}-${ticker || "row"}`,
      rowNumber: index + 2,
      ticker,
      quantity: Number.isFinite(quantity) ? quantity : 0,
      averagePrice: Number.isFinite(averagePrice) ? averagePrice : 0,
      purchaseDate,
      exchange,
      currency,
      companyName,
      currentPrice: Number.isFinite(currentPrice) && currentPrice > 0 ? currentPrice : undefined,
      notes,
      warnings,
      errors,
    };
  });
}

export function summarizeImport(previewRows: ImportPreviewRow[]): ImportSummary {
  const validRows = previewRows.filter((row) => row.errors.length === 0);
  const tickerCounts = validRows.reduce<Record<string, number>>((acc, row) => {
    acc[row.ticker] = (acc[row.ticker] ?? 0) + 1;
    return acc;
  }, {});

  return {
    totalRows: previewRows.length,
    validRows: validRows.length,
    skippedRows: previewRows.length - validRows.length,
    repeatedTickerRows: validRows.filter((row) => tickerCounts[row.ticker] > 1).length,
    estimatedValue: validRows.reduce((sum, row) => sum + row.quantity * row.averagePrice, 0),
  };
}

export function mergePreviewRowsIntoPositions(
  currentPositions: Position[],
  previewRows: ImportPreviewRow[],
): Position[] {
  const merged = new Map<string, Position>();

  currentPositions.forEach((position) => {
    merged.set(position.ticker.toUpperCase(), position);
  });

  previewRows
    .filter((row) => row.errors.length === 0)
    .forEach((row) => {
      const existing = merged.get(row.ticker);

      if (!existing) {
        const base = createBasePosition(row.ticker, row.quantity, row.averagePrice, false);
        merged.set(row.ticker, row.companyName ? { ...base, company: row.companyName } : base);
        return;
      }

      const totalShares = existing.shares + row.quantity;
      const weightedAverage = totalShares > 0
        ? ((existing.shares * existing.avgBuyPrice) + (row.quantity * row.averagePrice)) / totalShares
        : row.averagePrice;

      merged.set(row.ticker, {
        ...existing,
        shares: round(totalShares, 6),
        avgBuyPrice: round(weightedAverage, 4),
        value: round(totalShares * weightedAverage, 2),
        company: row.companyName || existing.company,
        isDemo: false,
      });
    });

  return Array.from(merged.values()).sort((a, b) => a.ticker.localeCompare(b.ticker));
}

function normalizeHeader(value: string) {
  return value.toLowerCase().replace(/[_\-\/]+/g, " ").replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, " ").trim();
}

function getMappedValue(row: CsvRow, header?: string) {
  if (!header) return "";
  return row[header] ?? "";
}

function normalizeTicker(value: string) {
  return cleanText(value)?.replace(/\s+/g, "").toUpperCase() ?? "";
}

function cleanText(value: string) {
  const cleaned = value?.trim();
  return cleaned ? cleaned : undefined;
}

function parseNumber(value: string) {
  if (!value) return Number.NaN;
  const cleaned = value.replace(/[$€£¥,%\s]/g, "").replace(/,/g, "");
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

function normalizeDate(value: string) {
  const cleaned = cleanText(value);
  if (!cleaned) return undefined;

  if (/^\d{8}$/.test(cleaned)) {
    return `${cleaned.slice(0, 4)}-${cleaned.slice(4, 6)}-${cleaned.slice(6, 8)}`;
  }

  if (/^\d{4}\/\d{2}\/\d{2}$/.test(cleaned)) {
    return cleaned.replaceAll("/", "-");
  }

  return cleaned;
}

function round(value: number, decimals: number) {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}
