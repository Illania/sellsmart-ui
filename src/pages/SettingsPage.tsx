import { useState } from "react";
import type { AppearanceMode, AppSettings, ViewType } from "../types";
import { DeleteConfirmDialog } from "../components/AssetComponents";


const appearanceOptions: { value: AppearanceMode; icon: string; title: string; description: string }[] = [
  {
    value: "light",
    icon: "☀️",
    title: "Light",
    description: "Soft neutral interface for bright environments.",
  },
  {
    value: "dark",
    icon: "🌙",
    title: "Dark",
    description: "Existing low-light SellSmart experience.",
  },
  {
    value: "system",
    icon: "💻",
    title: "System",
    description: "Automatically follows your device appearance.",
  },
];

const alertHistoryOptions: { value: number | null; title: string; description: string }[] = [
  { value: 7, title: "7 days", description: "Keep only recent acknowledgements." },
  { value: 30, title: "30 days", description: "Good for short-term portfolio reviews." },
  { value: 90, title: "90 days", description: "Recommended for most investors." },
  { value: 180, title: "180 days", description: "Useful for longer audit trails." },
  { value: null, title: "Forever", description: "Never remove alert history automatically." },
];

type Props = {
  settings: AppSettings;
  updateSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;
  resetDemoData: () => void;
  clearAlertHistory: () => void;
};

export function SettingsPage({ settings, updateSetting, resetDemoData, clearAlertHistory }: Props) {
  const [isClearHistoryOpen, setIsClearHistoryOpen] = useState(false);

  const handleClearHistory = () => {
    clearAlertHistory();
    setIsClearHistoryOpen(false);
  };

  return (
    <section className="settings-page" data-tour="settings-page">
      <section className="settings-grid">
        <article className="settings-card settings-card-wide">
          <h2>Appearance</h2>
          <p>Choose the interface theme that feels best for your working environment.</p>

          <div className="appearance-options" role="radiogroup" aria-label="Appearance">
            {appearanceOptions.map((option) => (
              <label
                key={option.value}
                className={`appearance-option ${settings.appearance === option.value ? "active" : ""}`}
              >
                <input
                  type="radio"
                  name="appearance"
                  value={option.value}
                  checked={settings.appearance === option.value}
                  onChange={() => updateSetting("appearance", option.value)}
                />
                <span className="appearance-icon">{option.icon}</span>
                <span>
                  <strong>{option.title}</strong>
                  <small>{option.description}</small>
                </span>
              </label>
            ))}
          </div>
        </article>

        <article className="settings-card">
          <h2>Risk Thresholds</h2>
          <p>Control when SellSmart creates portfolio and position alerts.</p>

          <label className="settings-field">
            <span>High-risk position threshold</span>
            <strong>{settings.highRiskThreshold}/100</strong>
            <input
              type="range"
              min="40"
              max="100"
              step="5"
              value={settings.highRiskThreshold}
              onChange={(event) => updateSetting("highRiskThreshold", Number(event.target.value))}
            />
          </label>

          <label className="settings-field">
            <span>Portfolio risk threshold</span>
            <strong>{settings.portfolioRiskThreshold}/100</strong>
            <input
              type="range"
              min="20"
              max="100"
              step="5"
              value={settings.portfolioRiskThreshold}
              onChange={(event) => updateSetting("portfolioRiskThreshold", Number(event.target.value))}
            />
          </label>
        </article>

        <article className="settings-card">
          <h2>Alert Preferences</h2>
          <p>Choose which risk signals should appear in Alerts.</p>

          <label className="settings-toggle">
            <div>
              <strong>High-risk alerts</strong>
              <span>Create alerts when a position crosses the risk threshold.</span>
            </div>
            <input type="checkbox" checked={settings.enableRiskAlerts} onChange={(event) => updateSetting("enableRiskAlerts", event.target.checked)} />
          </label>

          <label className="settings-toggle">
            <div>
              <strong>Reduce signal alerts</strong>
              <span>Notify when SellSmart suggests reducing exposure.</span>
            </div>
            <input type="checkbox" checked={settings.enableReduceAlerts} onChange={(event) => updateSetting("enableReduceAlerts", event.target.checked)} />
          </label>

          <label className="settings-toggle">
            <div>
              <strong>News-risk alerts</strong>
              <span>Show alerts when news-related risk drivers are detected.</span>
            </div>
            <input type="checkbox" checked={settings.enableNewsAlerts} onChange={(event) => updateSetting("enableNewsAlerts", event.target.checked)} />
          </label>
        </article>

        <article className="settings-card">
          <h2>Alert History</h2>
          <p>Choose how long acknowledged alerts should be kept before automatic cleanup.</p>

          <div className="alert-history-options" role="radiogroup" aria-label="Alert history retention">
            {alertHistoryOptions.map((option) => (
              <label
                key={option.title}
                className={`alert-history-option ${settings.alertHistoryDays === option.value ? "active" : ""}`}
              >
                <input
                  type="radio"
                  name="alertHistoryDays"
                  checked={settings.alertHistoryDays === option.value}
                  onChange={() => updateSetting("alertHistoryDays", option.value)}
                />
                <span>
                  <strong>{option.title}</strong>
                  <small>{option.description}</small>
                </span>
              </label>
            ))}
          </div>

          <button className="secondary-button danger-button compact settings-clear-history" type="button" onClick={() => setIsClearHistoryOpen(true)}>
            Clear history
          </button>
        </article>

        <article className="settings-card">
          <h2>Default View</h2>
          <p>Choose which page should open first in SellSmart.</p>

          <label className="settings-field">
            <span>Start page</span>
            <select value={settings.defaultView} onChange={(event) => updateSetting("defaultView", event.target.value as ViewType)}>
              <option value="dashboard">Dashboard</option>
              <option value="portfolio">Portfolio</option>
              <option value="watchlist">Watchlist</option>
              <option value="alerts">Alerts</option>
              <option value="insights">Insights</option>
              <option value="reports">Reports</option>
            </select>
          </label>
        </article>

        <article className="settings-card">
          <h2>Onboarding</h2>
          <p>Replay the SellSmart product tour at any time.</p>
          <button
            type="button"
            className="secondary-button"
            onClick={() => window.sellsmartReplayOnboarding?.()}
          >
            Replay onboarding
          </button>
        </article>

        <article className="settings-card danger-zone">
          <h2>Demo Data</h2>
          <p>Remove only demo portfolio and watchlist items. Your real positions stay untouched.</p>
          <button className="secondary-button" onClick={resetDemoData}>Reset Demo Data</button>
        </article>
      </section>

      {isClearHistoryOpen && (
        <DeleteConfirmDialog
          title="Clear Alert History"
          description="This will permanently delete all acknowledged alerts. Active alerts will not be affected."
          confirmText="Clear History"
          onCancel={() => setIsClearHistoryOpen(false)}
          onConfirm={handleClearHistory}
        />
      )}
    </section>
  );
}
