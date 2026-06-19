import type { AppSettings, ViewType } from "../types";

type Props = {
  settings: AppSettings;
  updateSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;
  resetDemoData: () => void;
};

export function SettingsPage({ settings, updateSetting, resetDemoData }: Props) {
  return (
    <section className="settings-page" data-tour="settings-page">
      <section className="settings-grid">
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
    </section>
  );
}
