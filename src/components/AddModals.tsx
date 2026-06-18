import type React from "react";
import { useState } from "react";
import type { Position, WatchItem } from "../types";

// Existing add modal, now also supports custom title/labels if you want to reuse it later.
type AddPositionModalProps = {
  newTicker: string;
  newShares: string;
  newAvgBuyPrice: string;
  setNewTicker: (value: string) => void;
  setNewShares: (value: string) => void;
  setNewAvgBuyPrice: (value: string) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onClose: () => void;
};

export function AddPositionModal({
  newTicker,
  newShares,
  newAvgBuyPrice,
  setNewTicker,
  setNewShares,
  setNewAvgBuyPrice,
  onSubmit,
  onClose,
}: AddPositionModalProps) {
  return (
    <div className="modal-backdrop">
      <form className="add-modal" onSubmit={onSubmit}>
        <div className="modal-header">
          <div><h2>Add Position</h2><p>Add a stock manually and load SellSmart AI analysis.</p></div>
          <button type="button" className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-form">
          <label>Ticker<input value={newTicker} onChange={(event) => setNewTicker(event.target.value)} placeholder="AMD" /></label>
          <label>Shares<input value={newShares} onChange={(event) => setNewShares(event.target.value)} placeholder="10" type="number" min="0" /></label>
          <label>Average Buy Price<input value={newAvgBuyPrice} onChange={(event) => setNewAvgBuyPrice(event.target.value)} placeholder="120" type="number" min="0" /></label>
        </div>

        <div className="modal-actions">
          <button type="button" className="secondary-button" onClick={onClose}>Cancel</button>
          <button type="submit" className="primary-button">Add Position</button>
        </div>
      </form>
    </div>
  );
}

type EditPositionModalProps = {
  position: Position;
  onSubmit: (oldTicker: string, ticker: string, shares: number, avgBuyPrice: number) => Promise<void>;
  onClose: () => void;
};

export function EditPositionModal({ position, onSubmit, onClose }: EditPositionModalProps) {
  const [ticker, setTicker] = useState(position.ticker);
  const [shares, setShares] = useState(String(position.shares));
  const [avgBuyPrice, setAvgBuyPrice] = useState(String(position.avgBuyPrice));

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextTicker = ticker.trim().toUpperCase();
    const nextShares = Number(shares);
    const nextAvgBuyPrice = Number(avgBuyPrice);

    if (!nextTicker || nextShares <= 0 || nextAvgBuyPrice <= 0) {
      alert("Please fill ticker, shares and average buy price.");
      return;
    }

    await onSubmit(position.ticker, nextTicker, nextShares, nextAvgBuyPrice);
    onClose();
  };

  return (
    <div className="modal-backdrop">
      <form className="add-modal" onSubmit={submit}>
        <div className="modal-header">
          <div><h2>Edit Position</h2><p>Update ticker, shares, or average buy price.</p></div>
          <button type="button" className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-form">
          <label>Ticker<input value={ticker} onChange={(event) => setTicker(event.target.value)} placeholder="AMD" /></label>
          <label>Shares<input value={shares} onChange={(event) => setShares(event.target.value)} placeholder="10" type="number" min="0" /></label>
          <label>Average Buy Price<input value={avgBuyPrice} onChange={(event) => setAvgBuyPrice(event.target.value)} placeholder="120" type="number" min="0" /></label>
        </div>

        <div className="modal-actions">
          <button type="button" className="secondary-button" onClick={onClose}>Cancel</button>
          <button type="submit" className="primary-button">Save Changes</button>
        </div>
      </form>
    </div>
  );
}

type AddWatchItemModalProps = {
  newWatchTicker: string;
  setNewWatchTicker: (value: string) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onClose: () => void;
};

export function AddWatchItemModal({ newWatchTicker, setNewWatchTicker, onSubmit, onClose }: AddWatchItemModalProps) {
  return (
    <div className="modal-backdrop">
      <form className="add-modal" onSubmit={onSubmit}>
        <div className="modal-header">
          <div><h2>Add to Watchlist</h2><p>Track a ticker before adding it to your portfolio.</p></div>
          <button type="button" className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-form">
          <label>Ticker<input value={newWatchTicker} onChange={(event) => setNewWatchTicker(event.target.value)} placeholder="TSLA" /></label>
        </div>

        <div className="modal-actions">
          <button type="button" className="secondary-button" onClick={onClose}>Cancel</button>
          <button type="submit" className="primary-button">Add Ticker</button>
        </div>
      </form>
    </div>
  );
}

type EditWatchItemModalProps = {
  item: WatchItem;
  onSubmit: (oldTicker: string, ticker: string) => Promise<void>;
  onClose: () => void;
};

export function EditWatchItemModal({ item, onSubmit, onClose }: EditWatchItemModalProps) {
  const [ticker, setTicker] = useState(item.ticker);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextTicker = ticker.trim().toUpperCase();

    if (!nextTicker) {
      alert("Please enter ticker.");
      return;
    }

    await onSubmit(item.ticker, nextTicker);
    onClose();
  };

  return (
    <div className="modal-backdrop">
      <form className="add-modal" onSubmit={submit}>
        <div className="modal-header">
          <div><h2>Edit Watchlist Ticker</h2><p>Change the ticker tracked in your watchlist.</p></div>
          <button type="button" className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-form">
          <label>Ticker<input value={ticker} onChange={(event) => setTicker(event.target.value)} placeholder="TSLA" /></label>
        </div>

        <div className="modal-actions">
          <button type="button" className="secondary-button" onClick={onClose}>Cancel</button>
          <button type="submit" className="primary-button">Save Changes</button>
        </div>
      </form>
    </div>
  );
}
