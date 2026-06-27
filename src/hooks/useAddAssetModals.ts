import type React from "react";
import { useState } from "react";
import type { ViewType } from "../types";

export function useAddPositionModal(
  addPosition: (ticker: string, shares: number, avgBuyPrice: number) => Promise<void>,
  setActiveView: (view: ViewType) => void,
  setExpandedTicker: (ticker: string | null) => void
) {
  const [isOpen, setIsOpen] = useState(false);
  const [newTicker, setNewTicker] = useState("");
  const [newShares, setNewShares] = useState("");
  const [newAvgBuyPrice, setNewAvgBuyPrice] = useState("");

  const close = () => setIsOpen(false);
  const open = () => setIsOpen(true);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const ticker = newTicker.trim().toUpperCase();
    const shares = Number(newShares);
    const avgBuyPrice = Number(newAvgBuyPrice);

    if (!ticker || shares <= 0 || avgBuyPrice <= 0) {
      alert("Please fill ticker, shares and average buy price.");
      return;
    }

    setNewTicker("");
    setNewShares("");
    setNewAvgBuyPrice("");
    close();
    setExpandedTicker(null);
    setActiveView("portfolio");

    await addPosition(ticker, shares, avgBuyPrice);
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
  };
}

export function useAddWatchItemModal(
  addWatchItem: (ticker: string) => Promise<void>,
  setActiveView: (view: ViewType) => void,
  setExpandedTicker: (ticker: string | null) => void
) {
  const [isOpen, setIsOpen] = useState(false);
  const [newWatchTicker, setNewWatchTicker] = useState("");

  const close = () => setIsOpen(false);
  const open = () => setIsOpen(true);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const ticker = newWatchTicker.trim().toUpperCase();

    if (!ticker) {
      alert("Please enter ticker.");
      return;
    }

    setNewWatchTicker("");
    close();
    setExpandedTicker(null);
    setActiveView("watchlist");

    await addWatchItem(ticker);
  };

  return {
    isOpen,
    open,
    close,
    submit,
    newWatchTicker,
    setNewWatchTicker,
  };
}
