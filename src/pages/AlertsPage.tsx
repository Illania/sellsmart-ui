import { Bell } from "lucide-react";
import type { PortfolioAlert } from "../types";

type Props = {
  alerts: PortfolioAlert[];
  unreadAlertsCount: number;
  markAlertAsRead: (alertId: string) => void;
  markAllAlertsAsRead: () => void;
};

export function AlertsPage({ alerts, unreadAlertsCount, markAlertAsRead }: Props) {
  return (
    <section className="alerts-page" data-tour="alerts-page">
      <div className="panel-header">
        <div>
          <h2>Risk Alerts</h2>
          <p className="muted-text">{unreadAlertsCount} unread alert{unreadAlertsCount === 1 ? "" : "s"}</p>
        </div>
      </div>

      {alerts.length > 0 ? (
        <div className="alerts-list">
          {alerts.map((alert) => (
            <article key={alert.id} className={`alert-card ${alert.severity} ${alert.read ? "read" : "unread"}`}>
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
                <button className="secondary-button" onClick={() => markAlertAsRead(alert.id)}>Mark read</button>
              )}
            </article>
          ))}
        </div>
      ) : (
        <div className="empty-alerts">
          <Bell size={34} />
          <h3>No active alerts</h3>
          <p>Your portfolio does not currently show urgent risk alerts.</p>
        </div>
      )}
    </section>
  );
}
