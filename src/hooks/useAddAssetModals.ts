import type React from "react";
import { useState } from "react";
import type { SymbolSearchResult, ViewType } from "../types";
import { cacheSymbolSearchResult } from "../utils/symbolMetadata";

const normalizeTicker = (value: string) => value.trim().toUpperCase();

export function useAddPositionModal(
  addPosition: (
    ticker: string,
    shares: number,
    avgBuyPrice: number,
    symbolMetadata?: SymbolSearchResult,
  ) => Promise<void>,
  setActiveView: (view: ViewType) => void,
  setExpandedTicker: (ticker: string | null) => void
) {
  const [isOpen, setIsOpen] = useState(false);
  const [newTicker, setNewTickerValue] = useState("");
  const [newShares, setNewShares] = useState("");
  const [newAvgBuyPrice, setNewAvgBuyPrice] = useState("");
  const [selectedSymbol, setSelectedSymbol] = useState<SymbolSearchResult | undefined>();

  const close = () => setIsOpen(false);
  const open = () => setIsOpen(true);

  const setNewTicker = (value: string) => {
    setNewTickerValue(value);

    if (selectedSymbol && normalizeTicker(value) !== normalizeTicker(selectedSymbol.symbol)) {
      setSelectedSymbol(undefined);
    }
  };

  const handleSymbolSelect = (symbol: SymbolSearchResult) => {
    cacheSymbolSearchResult(symbol);
    setSelectedSymbol(symbol);
    setNewTickerValue(symbol.symbol);
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const ticker = normalizeTicker(newTicker);
    const shares = Number(newShares);
    const avgBuyPrice = Number(newAvgBuyPrice);
    const metadata = selectedSymbol && normalizeTicker(selectedSymbol.symbol) === ticker
      ? selectedSymbol
      : undefined;

    if (!ticker || shares <= 0 || avgBuyPrice <= 0) {
      alert("Please fill ticker, shares and average buy price.");
      return;
    }

    setNewTickerValue("");
    setNewShares("");
    setNewAvgBuyPrice("");
    setSelectedSymbol(undefined);
    close();
    setExpandedTicker(null);
    setActiveView("portfolio");

    await addPosition(ticker, shares, avgBuyPrice, metadata);
  };

  return {
    isOpen,
    open,
    close,
    submit,
    newTicker,
    newShares,
    newAvgBuyPrice,
    setNewTicker,
    setNewShares,
    setNewAvgBuyPrice,
    handleSymbolSelect,
  };
}

export function useAddWatchItemModal(
  addWatchItem: (ticker: string, symbolMetadata?: SymbolSearchResult) => Promise<void>,
  setActiveView: (view: ViewType) => void,
  setExpandedTicker: (ticker: string | null) => void
) {
  const [isOpen, setIsOpen] = useState(false);
  const [newWatchTicker, setNewWatchTickerValue] = useState("");
  const [selectedSymbol, setSelectedSymbol] = useState<SymbolSearchResult | undefined>();

  const close = () => setIsOpen(false);
  const open = () => setIsOpen(true);

  const setNewWatchTicker = (value: string) => {
    setNewWatchTickerValue(value);

    if (selectedSymbol && normalizeTicker(value) !== normalizeTicker(selectedSymbol.symbol)) {
      setSelectedSymbol(undefined);
    }
  };

  const handleSymbolSelect = (symbol: SymbolSearchResult) => {
    cacheSymbolSearchResult(symbol);
    setSelectedSymbol(symbol);
    setNewWatchTickerValue(symbol.symbol);
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const ticker = normalizeTicker(newWatchTicker);
    const metadata = selectedSymbol && normalizeTicker(selectedSymbol.symbol) === ticker
      ? selectedSymbol
      : undefined;

    if (!ticker) {
      alert("Please enter ticker.");
      return;
    }

    setNewWatchTickerValue("");
    setSelectedSymbol(undefined);
    close();
    setExpandedTicker(null);
    setActiveView("watchlist");

    await addWatchItem(ticker, metadata);
  };

  return {
    isOpen,
    open,
    close,
    submit,
    newWatchTicker,
    setNewWatchTicker,
    handleSymbolSelect,
  };
}
