import type { ReactNode } from "react";
import {
  Bell,
  CircleHelp,
  FileText,
  Home,
  Import,
  LineChart,
  LogOut,
  Plus,
  Settings,
  ShieldCheck,
  WalletCards,
} from "lucide-react";

import type { ViewType } from "../types";

type Props = {
  activeView: ViewType;
  pageTitle: string;
  pageSubtitle: string;
  unreadAlertsCount: number;
  isLoadingPredictions: boolean;
  children: ReactNode;
  setActiveView: (view: ViewType) => void;
  onAddPosition: () => void;
  onAddTicker: () => void;
  onImportDemo: () => void;
  onMarkAllAlertsAsRead: () => void;
  onLogout: () => void;
  userEmail?: string;
};

const navItems = [
  { label: "Dashboard", icon: Home, view: "dashboard" as ViewType },
  { label: "Portfolio", icon: WalletCards, view: "portfolio" as ViewType },
  { label: "Watchlist", icon: ShieldCheck, view: "watchlist" as ViewType },
  { label: "Alerts", icon: Bell, view: "alerts" as ViewType },
  { label: "Insights", icon: LineChart, view: "insights" as ViewType },
  { label: "Reports", icon: FileText, view: "reports" as ViewType },
  { label: "Settings", icon: Settings, view: "settings" as ViewType },
];

export function SellSmartLayout({
  activeView,
  pageTitle,
  pageSubtitle,
  unreadAlertsCount,
  isLoadingPredictions,
  children,
  setActiveView,
  onAddPosition,
  onAddTicker,
  onImportDemo,
  onMarkAllAlertsAsRead,
  onLogout,
  userEmail,
}: Props) {
  const avatarText = getAvatarText(userEmail);

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">
            <span />
            <span />
            <span />
            <span />
          </div>
          <strong>
            Sell<span>Smart</span>
          </strong>
        </div>

        <nav className="nav-list">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.view === activeView;

            return (
              <button
                key={item.label}
                type="button"
                className={`nav-item ${isActive ? "active" : ""}`}
                onClick={() => setActiveView(item.view)}
              >
                <Icon size={19} />
                {item.label}

                {item.label === "Alerts" && unreadAlertsCount > 0 && (
                  <span className="nav-badge">{unreadAlertsCount}</span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="demo-card">
          <div className="demo-icon">♙</div>
          <div>
            <strong>{isLoadingPredictions ? "Loading AI" : "SellSmart AI"}</strong>
            <p>
              <span /> Risk Intelligence
            </p>
          </div>
        </div>

        <div className="sidebar-footer">
          <button
            type="button"
            className={`nav-item ${activeView === "help" ? "active" : ""}`}
            onClick={() => setActiveView("help")}
          >
            <CircleHelp size={18} />
            Help Center
          </button>

          <button type="button" className="nav-item" onClick={onLogout}>
            <LogOut size={18} />
            Log out
          </button>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div />

          <div className="topbar-actions">
            <TopbarPrimaryAction
              activeView={activeView}
              onAddPosition={onAddPosition}
              onAddTicker={onAddTicker}
              onMarkAllAlertsAsRead={onMarkAllAlertsAsRead}
            />

            <button type="button" className="secondary-button" onClick={onImportDemo}>
              <Import size={16} />
              Import Demo
            </button>

            <button
              type="button"
              className="icon-button top-alert-button"
              onClick={() => setActiveView("alerts")}
              aria-label="Open alerts"
            >
              <Bell size={20} />
              {unreadAlertsCount > 0 && (
                <span className="top-alert-badge" aria-hidden="true" />
              )}
            </button>

            <button
              type="button"
              className="avatar"
              title={userEmail ?? "Signed in user"}
              aria-label={userEmail ? `Signed in as ${userEmail}` : "Signed in user"}
            >
              {avatarText}
            </button>
          </div>
        </header>

        <section className="page-header">
          <div>
            <h1>{pageTitle}</h1>
            <p>{pageSubtitle}</p>
          </div>

          <div className="market-status">
            <strong>
              <span /> Market Analysis Ready
            </strong>
            <p>Real-time portfolio risk insights</p>
          </div>
        </section>

        {children}

        <nav className="mobile-bottom-nav" aria-label="Mobile navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.view === activeView;

            return (
              <button
                key={item.label}
                type="button"
                className={`mobile-nav-button ${isActive ? "active" : ""}`}
                onClick={() => setActiveView(item.view)}
                aria-label={item.label}
                title={item.label}
              >
                <Icon size={20} />

                {item.label === "Alerts" && unreadAlertsCount > 0 && (
                  <span className="mobile-nav-badge">{unreadAlertsCount}</span>
                )}
              </button>
            );
          })}

          <button
            type="button"
            className={`mobile-nav-button ${activeView === "help" ? "active" : ""}`}
            onClick={() => setActiveView("help")}
            aria-label="Help"
            title="Help"
          >
            <CircleHelp size={20} />
          </button>
        </nav>

        <footer className="disclaimer">
          <CircleHelp size={18} />
          <p>
            SellSmart provides AI-powered risk analysis and insights only. Not
            financial advice. Always do your own research before making investment
            decisions.
          </p>
        </footer>
      </main>
    </div>
  );
}

function TopbarPrimaryAction({
  activeView,
  onAddPosition,
  onAddTicker,
  onMarkAllAlertsAsRead,
}: {
  activeView: ViewType;
  onAddPosition: () => void;
  onAddTicker: () => void;
  onMarkAllAlertsAsRead: () => void;
}) {
  if (activeView === "portfolio") {
    return (
      <button type="button" className="secondary-button" onClick={onAddPosition}>
        <Plus size={18} />
        Add Position
      </button>
    );
  }

  if (activeView === "watchlist") {
    return (
      <button type="button" className="secondary-button" onClick={onAddTicker}>
        <Plus size={18} />
        Add Ticker
      </button>
    );
  }

  if (activeView === "alerts") {
    return (
      <button
        type="button"
        className="secondary-button"
        onClick={onMarkAllAlertsAsRead}
      >
        Mark All Read
      </button>
    );
  }

  if (activeView === "reports") {
    return (
      <button type="button" className="secondary-button" onClick={() => window.print()}>
        <FileText size={18} />
        Export PDF
      </button>
    );
  }

  return (
    <button type="button" className="secondary-button" onClick={onAddPosition}>
      <Plus size={18} />
      Add Position
    </button>
  );
}

function getAvatarText(email?: string) {
  if (!email) return "SS";

  const namePart = email.split("@")[0] ?? "";
  const cleaned = namePart.replace(/[^a-zA-Z0-9]/g, "");

  if (!cleaned) return "SS";

  return cleaned.slice(0, 2).toUpperCase();
}