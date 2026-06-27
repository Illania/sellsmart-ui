import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { searchSymbols } from "../api/symbols";
import type { SymbolSearchResult } from "../types";

type SymbolSearchProps = {
  value: string;
  accessToken?: string;
  placeholder?: string;
  onChange: (value: string) => void;
  onSelect?: (symbol: SymbolSearchResult) => void;
};

const getInitials = (symbol: string) => symbol.slice(0, 3).toUpperCase();

type SymbolLogoProps = {
  symbol: string;
  logoUrl?: string;
};

function SymbolLogo({ symbol, logoUrl }: SymbolLogoProps) {
  const [hasLogoError, setHasLogoError] = useState(false);
  const shouldShowLogo = Boolean(logoUrl) && !hasLogoError;

  useEffect(() => {
    setHasLogoError(false);
  }, [logoUrl]);

  if (!shouldShowLogo) {
    return <>{getInitials(symbol)}</>;
  }

  return (
    <img
      src={logoUrl}
      alt={`${symbol} logo`}
      loading="lazy"
      onError={() => setHasLogoError(true)}
    />
  );
}

export function SymbolSearch({
  value,
  accessToken,
  placeholder = "Search company or ticker",
  onChange,
  onSelect,
}: SymbolSearchProps) {
  const [results, setResults] = useState<SymbolSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const trimmedValue = useMemo(() => value.trim(), [value]);

  useEffect(() => {
    if (trimmedValue.length < 2) {
      setResults([]);
      setError(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    const timeout = window.setTimeout(async () => {
      setLoading(true);
      setError(null);

      try {
        const items = await searchSymbols(trimmedValue, accessToken);

        if (!cancelled) {
          setResults(items);
          setHighlightedIndex(0);
          setIsOpen(true);
        }
      } catch (err) {
        console.error("Symbol search failed", err);

        if (!cancelled) {
          setResults([]);
          setError("Could not load symbol suggestions.");
          setIsOpen(true);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }, 300);

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [accessToken, trimmedValue]);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  const selectResult = (item: SymbolSearchResult) => {
    onChange(item.symbol);
    onSelect?.(item);
    setIsOpen(false);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || results.length === 0) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlightedIndex((current) => Math.min(current + 1, results.length - 1));
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlightedIndex((current) => Math.max(current - 1, 0));
    }

    if (event.key === "Enter") {
      event.preventDefault();
      selectResult(results[highlightedIndex]);
    }

    if (event.key === "Escape") {
      setIsOpen(false);
    }
  };

  const shouldShowDropdown = isOpen && (loading || error || results.length > 0 || trimmedValue.length >= 2);

  return (
    <div className="symbol-search" ref={containerRef}>
      <input
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        autoComplete="off"
      />

      {shouldShowDropdown && (
        <div className="symbol-search-dropdown" role="listbox">
          {loading && <div className="symbol-search-state">Searching...</div>}

          {!loading && error && <div className="symbol-search-state symbol-search-error">{error}</div>}

          {!loading && !error && results.length === 0 && (
            <div className="symbol-search-state">No matching symbols found.</div>
          )}

          {!loading && !error && results.map((item, index) => (
            <button
              key={`${item.exchange ?? "market"}-${item.symbol}-${index}`}
              type="button"
              className={`symbol-search-result ${index === highlightedIndex ? "is-highlighted" : ""}`}
              onMouseEnter={() => setHighlightedIndex(index)}
              onClick={() => selectResult(item)}
            >
              <span className="symbol-search-logo" aria-hidden="true">
                <SymbolLogo symbol={item.symbol} logoUrl={item.logoUrl} />
              </span>

              <span className="symbol-search-main">
                <strong>{item.companyName}</strong>
                <span>{item.symbol}</span>
              </span>

              <span className="symbol-search-meta">
                {item.exchange && <span>{item.exchange}</span>}
                {item.currency && <span>{item.currency}</span>}
                {item.type && <span>{item.type}</span>}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
