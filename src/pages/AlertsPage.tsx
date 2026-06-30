import { useState } from "react";
import { Bell, ChevronDown, Trash2 } from "lucide-react";
import type { PortfolioAlert } from "../types";
import { DeleteConfirmDialog } from "../components/AssetComponents";

type Props = {
  alerts: PortfolioAlert[];
  unreadAlertsCount: number;
  markAlertAsRead: (alertId: string) => void;
  markAllAlertsAsRead: () => void;
  clearAlertHistory: () => void;
};

const formatAcknowledgedTime = (value?: string) => {
  if (!value) return "Acknowledged";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Acknowledged";

  const now = Date.now();
  const diffMs = now - parsed.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMinutes < 1) return "Acknowledged just now";
  if (diffMinutes < 60) return `Acknowledged ${diffMinutes} minute${diffMinutes === 1 ? "" : "s"} ago`;
  if (diffHours < 24) return `Acknowledged ${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
  if (diffDays === 1) return "Acknowledged yesterday";
  if (diffDays < 7) return `Acknowledged ${diffDays} days ago`;

  return `Acknowledged ${parsed.toLocaleDateString()}`;
};

function AlertCard({ alert, onMarkRead }: { alert: PortfolioAlert; onMarkRead: (alertId: string) => void }) {
  return (
    <article className={`alert-card ${alert.severity} ${alert.read ? "read" : "unread"}`}>
      <div className="alert-icon"><Bell size={20} /></div>

      <div className="alert-content">
        <div className="alert-title-line">
          <h3>{alert.title}</h3>
          <span className={`alert-severity ${alert.severity}`}>{alert.severity}</span>
        </div>
        <p>{alert.message}</p>
        <span className="alert-time">
          {alert.read ? formatAcknowledgedTime(alert.readAt) : new Date(alert.createdAt).toLocaleString()}
        </span>
      </div>

      {!alert.read && (
        <button className="secondary-button" onClick={() => onMarkRead(alert.id)}>Mark read</button>
      )}
    </article>
  );
}

export function AlertsPage({ alerts, unreadAlertsCount, markAlertAsRead, markAllAlertsAsRead, clearAlertHistory }: Props) {
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isClearHistoryOpen, setIsClearHistoryOpen] = useState(false);
  const activeAlerts = alerts.filter((alert) => !alert.read);
  const historyAlerts = alerts
    .filter((alert) => alert.read && !alert.historyCleared)
    .sort((a, b) => new Date(b.readAt ?? b.createdAt).getTime() - new Date(a.readAt ?? a.createdAt).getTime());

  const handleClearHistory = () => {
    clearAlertHistory();
    setIsClearHistoryOpen(false);
    setIsHistoryOpen(false);
  };

  return (
    <section className="alerts-page" data-tour="alerts-page">
      <div className="panel-header alerts-page-header">
        <div>
          <h2>Risk Alerts</h2>
          <p className="muted-text">
            {activeAlerts.length} Active • {historyAlerts.length} Alert History
          </p>
        </div>

        {unreadAlertsCount > 0 && (
          <button className="secondary-button" onClick={markAllAlertsAsRead}>Mark all read</button>
        )}
      </div>

      <div className="alerts-section-header">
        <div>
          <h3>Active Alerts</h3>
          <p>{activeAlerts.length} alert{activeAlerts.length === 1 ? "" : "s"} need attention</p>
        </div>
      </div>

      {activeAlerts.length > 0 ? (
        <div className="alerts-list">
          {activeAlerts.map((alert) => (
            <AlertCard key={alert.id} alert={alert} onMarkRead={markAlertAsRead} />
          ))}
        </div>
      ) : (
        <div className="empty-alerts compact">
          <Bell size={30} />
          <h3>No active alerts</h3>
          <p>Your portfolio does not currently show urgent risk alerts.</p>
        </div>
      )}

      {historyAlerts.length > 0 && (
        <div className="alerts-history">
          <div className="alerts-history-bar">
            <button
              className="alerts-history-toggle"
              type="button"
              onClick={() => setIsHistoryOpen((value) => !value)}
              aria-expanded={isHistoryOpen}
            >
              <div>
                <h3>Alert History</h3>
                <p>{historyAlerts.length} acknowledged alert{historyAlerts.length === 1 ? "" : "s"}</p>
              </div>
              <ChevronDown className={isHistoryOpen ? "open" : ""} size={20} />
            </button>

            <button
              className="secondary-button danger-button compact"
              type="button"
              onClick={() => setIsClearHistoryOpen(true)}
            >
              <Trash2 size={16} />
              Clear history
            </button>
          </div>

          {isHistoryOpen && (
            <div className="alerts-list alerts-history-list">
              {historyAlerts.map((alert) => (
                <AlertCard key={alert.id} alert={alert} onMarkRead={markAlertAsRead} />
              ))}
            </div>
          )}
        </div>
      )}

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
