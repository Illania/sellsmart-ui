import { useState } from "react";
import { Bell, ChevronDown } from "lucide-react";
import type { PortfolioAlert } from "../types";

type Props = {
  alerts: PortfolioAlert[];
  unreadAlertsCount: number;
  markAlertAsRead: (alertId: string) => void;
  markAllAlertsAsRead: () => void;
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
        <span className="alert-time">{new Date(alert.createdAt).toLocaleString()}</span>
      </div>

      {!alert.read && (
        <button className="secondary-button" onClick={() => onMarkRead(alert.id)}>Mark read</button>
      )}
    </article>
  );
}

export function AlertsPage({ alerts, unreadAlertsCount, markAlertAsRead, markAllAlertsAsRead }: Props) {
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const activeAlerts = alerts.filter((alert) => !alert.read);
  const historyAlerts = alerts.filter((alert) => alert.read);

  return (
    <section className="alerts-page" data-tour="alerts-page">
      <div className="panel-header alerts-page-header">
        <div>
          <h2>Risk Alerts</h2>
          <p className="muted-text">
            {activeAlerts.length} Active • {historyAlerts.length} History
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

          {isHistoryOpen && (
            <div className="alerts-list alerts-history-list">
              {historyAlerts.map((alert) => (
                <AlertCard key={alert.id} alert={alert} onMarkRead={markAlertAsRead} />
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
