import type React from "react";

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
