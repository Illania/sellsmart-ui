import { type DragEvent, useMemo, useRef, useState } from "react";
import { Bell, ChevronDown, Filter, Settings2, Trash2, X } from "lucide-react";
import type { AlertQuickFilter, AlertSeverity, AppSettings, PortfolioAlert } from "../types";
import { DeleteConfirmDialog } from "../components/AssetComponents";

type AlertStatusFilter = "all" | "unread" | "read";
type AlertDateFilter = "all" | "today" | "7d" | "30d" | "custom";

type Props = {
  alerts: PortfolioAlert[];
  unreadAlertsCount: number;
  settings: AppSettings;
  markAlertAsRead: (alertId: string) => void;
  markAllAlertsAsRead: () => void;
  clearAlertHistory: () => void;
  updateSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;
};

const severityOptions: Array<AlertSeverity | "all"> = ["all", "high", "medium", "low"];
const statusOptions: AlertStatusFilter[] = ["all", "unread", "read"];
const dateOptions: { value: AlertDateFilter; label: string }[] = [
  { value: "all", label: "Any date" },
  { value: "today", label: "Today" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "custom", label: "Custom" },
];

const defaultQuickFilters: AlertQuickFilter[] = ["all", "unread", "read", "high", "today"];

const quickFilterOptions: Array<{ value: AlertQuickFilter; label: string; description: string }> = [
  { value: "all", label: "All", description: "Clear all filters" },
  { value: "unread", label: "Unread", description: "Active alerts only" },
  { value: "read", label: "Read", description: "Acknowledged alerts only" },
  { value: "high", label: "High", description: "High-severity risks" },
  { value: "medium", label: "Medium", description: "Medium-severity alerts" },
  { value: "low", label: "Low", description: "Low-severity alerts" },
  { value: "today", label: "Today", description: "Today only" },
  { value: "7d", label: "This Week", description: "Last 7 days" },
  { value: "30d", label: "Last 30 Days", description: "Last 30 days" },
];

const quickFilterLabels = Object.fromEntries(
  quickFilterOptions.map((option) => [option.value, option.label]),
) as Record<AlertQuickFilter, string>;

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


const normalizeSearchText = (value: unknown) =>
  String(value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9.%+-]+/g, " ")
    .trim();

const getAlertSearchText = (alert: PortfolioAlert) => {
  const createdAt = new Date(alert.createdAt);
  const readAt = alert.readAt ? new Date(alert.readAt) : null;

  return normalizeSearchText([
    alert.id,
    alert.ticker,
    alert.title,
    alert.message,
    alert.severity,
    alert.type,
    alert.read ? "read acknowledged history alert history" : "unread active active alert",
    Number.isNaN(createdAt.getTime()) ? "" : createdAt.toLocaleString(),
    readAt && !Number.isNaN(readAt.getTime()) ? readAt.toLocaleString() : "",
    alert.read ? formatAcknowledgedTime(alert.readAt) : "",
  ].filter(Boolean).join(" "));
};

const isWithinDateFilter = (
  alert: PortfolioAlert,
  dateFilter: AlertDateFilter,
  customDateFrom: string,
  customDateTo: string,
) => {
  if (dateFilter === "all") return true;

  const dateValue = alert.read ? alert.readAt ?? alert.createdAt : alert.createdAt;
  const parsed = new Date(dateValue);
  if (Number.isNaN(parsed.getTime())) return false;

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const timestamp = parsed.getTime();

  if (dateFilter === "today") return timestamp >= startOfToday;

  if (dateFilter === "custom") {
    const from = customDateFrom ? new Date(`${customDateFrom}T00:00:00`).getTime() : Number.NEGATIVE_INFINITY;
    const to = customDateTo ? new Date(`${customDateTo}T23:59:59`).getTime() : Number.POSITIVE_INFINITY;

    return timestamp >= from && timestamp <= to;
  }

  const days = dateFilter === "7d" ? 7 : 30;
  return timestamp >= now.getTime() - days * 24 * 60 * 60 * 1000;
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

export function AlertsPage({ alerts, unreadAlertsCount, settings, markAlertAsRead, markAllAlertsAsRead, clearAlertHistory, updateSetting }: Props) {
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isClearHistoryOpen, setIsClearHistoryOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [tickerFilter, setTickerFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<AlertStatusFilter>("all");
  const [severityFilter, setSeverityFilter] = useState<AlertSeverity | "all">("all");
  const [dateFilter, setDateFilter] = useState<AlertDateFilter>("all");
  const [customDateFrom, setCustomDateFrom] = useState("");
  const [customDateTo, setCustomDateTo] = useState("");
  const [isQuickSettingsOpen, setIsQuickSettingsOpen] = useState(false);
  const [draggedQuickFilter, setDraggedQuickFilter] = useState<AlertQuickFilter | null>(null);
  const [quickFilterDropIndex, setQuickFilterDropIndex] = useState<number | null>(null);
  const quickFilterRefs = useRef(new Map<AlertQuickFilter, HTMLButtonElement>());
  const suppressQuickFilterClickRef = useRef(false);

  const visibleQuickFilters = (settings.alertQuickFilters?.length ? settings.alertQuickFilters : defaultQuickFilters)
    .filter((filter): filter is AlertQuickFilter => Boolean(quickFilterLabels[filter as AlertQuickFilter]));

  const availableTickers = useMemo(
    () => Array.from(new Set(alerts.map((alert) => alert.ticker).filter((ticker): ticker is string => Boolean(ticker)))).sort(),
    [alerts],
  );

  const filterAlert = (alert: PortfolioAlert) => {
    const normalizedSearch = searchQuery.trim().toLowerCase();

    if (normalizedSearch) {
      const searchTokens = normalizeSearchText(normalizedSearch).split(" ").filter(Boolean);
      const searchable = getAlertSearchText(alert);

      if (!searchTokens.every((token) => searchable.includes(token))) return false;
    }

    if (tickerFilter !== "all" && alert.ticker !== tickerFilter) return false;
    if (severityFilter !== "all" && alert.severity !== severityFilter) return false;
    if (statusFilter === "unread" && alert.read) return false;
    if (statusFilter === "read" && !alert.read) return false;
    if (!isWithinDateFilter(alert, dateFilter, customDateFrom, customDateTo)) return false;

    return true;
  };

  const filteredAlerts = alerts.filter((alert) => !alert.historyCleared).filter(filterAlert);
  const activeAlerts = filteredAlerts.filter((alert) => !alert.read);
  const historyAlerts = filteredAlerts
    .filter((alert) => alert.read)
    .sort((a, b) => new Date(b.readAt ?? b.createdAt).getTime() - new Date(a.readAt ?? a.createdAt).getTime());

  const hasActiveFilters =
    searchQuery.trim().length > 0 ||
    tickerFilter !== "all" ||
    severityFilter !== "all" ||
    statusFilter !== "all" ||
    dateFilter !== "all";

  const showActiveSection = statusFilter !== "read";
  const showHistorySection = statusFilter !== "unread" && historyAlerts.length > 0;
  const isHistoryVisible = isHistoryOpen || statusFilter === "read";

  const handleClearHistory = () => {
    clearAlertHistory();
    setIsClearHistoryOpen(false);
    setIsHistoryOpen(false);
  };

  const resetFilters = () => {
    setSearchQuery("");
    setTickerFilter("all");
    setStatusFilter("all");
    setSeverityFilter("all");
    setDateFilter("all");
    setCustomDateFrom("");
    setCustomDateTo("");
  };

  const applyQuickFilter = (filter: AlertQuickFilter) => {
    if (filter === "all") {
      resetFilters();
      return;
    }

    if (filter === "unread") {
      setStatusFilter((current) => (current === "unread" ? "all" : "unread"));
      return;
    }

    if (filter === "read") {
      setStatusFilter((current) => (current === "read" ? "all" : "read"));
      setIsHistoryOpen(true);
      return;
    }

    if (filter === "high" || filter === "medium" || filter === "low") {
      setSeverityFilter((current) => (current === filter ? "all" : filter));
      return;
    }

    if (filter === "today" || filter === "7d" || filter === "30d") {
      setDateFilter((current) => (current === filter ? "all" : filter));
    }
  };

  const isQuickFilterActive = (filter: AlertQuickFilter) => {
    if (filter === "all") return !hasActiveFilters;
    if (filter === "unread") return statusFilter === "unread";
    if (filter === "read") return statusFilter === "read";
    if (filter === "high" || filter === "medium" || filter === "low") return severityFilter === filter;
    if (filter === "today" || filter === "7d" || filter === "30d") return dateFilter === filter;
    return false;
  };

  const toggleQuickFilterSetting = (filter: AlertQuickFilter) => {
    const selected = visibleQuickFilters.includes(filter);
    const nextFilters = selected
      ? visibleQuickFilters.filter((item) => item !== filter)
      : [...visibleQuickFilters, filter];

    updateSetting("alertQuickFilters", nextFilters.length ? nextFilters : defaultQuickFilters);
  };

  const getQuickFilterDropIndex = (clientX: number, clientY: number) => {
    const chipRects = visibleQuickFilters
      .map((filter, index) => {
        const element = quickFilterRefs.current.get(filter);
        if (!element) return null;

        const rect = element.getBoundingClientRect();
        return { index, rect };
      })
      .filter((item): item is { index: number; rect: DOMRect } => Boolean(item));

    if (!chipRects.length) return 0;

    const rowTolerance = 18;
    const rows = chipRects.reduce<Array<Array<{ index: number; rect: DOMRect }>>>((result, item) => {
      const centerY = item.rect.top + item.rect.height / 2;
      const existingRow = result.find((row) => {
        const rowCenterY = row[0].rect.top + row[0].rect.height / 2;
        return Math.abs(rowCenterY - centerY) <= rowTolerance;
      });

      if (existingRow) {
        existingRow.push(item);
      } else {
        result.push([item]);
      }

      return result;
    }, []);

    rows.forEach((row) => row.sort((a, b) => a.rect.left - b.rect.left));
    rows.sort((a, b) => a[0].rect.top - b[0].rect.top);

    const targetRow = rows.reduce((closest, row) => {
      const rowCenterY = row[0].rect.top + row[0].rect.height / 2;
      const distance = Math.abs(clientY - rowCenterY);
      return distance < closest.distance ? { row, distance } : closest;
    }, { row: rows[rows.length - 1], distance: Number.POSITIVE_INFINITY });

    const row = targetRow.row;
    const first = row[0];
    const last = row[row.length - 1];

    if (clientX <= first.rect.left) return first.index;
    if (clientX >= last.rect.right) return last.index + 1;

    for (const item of row) {
      const midpoint = item.rect.left + item.rect.width / 2;
      if (clientX < midpoint) return item.index;
    }

    return last.index + 1;
  };

  const reorderQuickFilters = (sourceFilter: AlertQuickFilter, dropIndex: number) => {
    const sourceIndex = visibleQuickFilters.indexOf(sourceFilter);
    if (sourceIndex < 0) return;

    const nextFilters = visibleQuickFilters.filter((filter) => filter !== sourceFilter);
    const adjustedDropIndex = sourceIndex < dropIndex ? dropIndex - 1 : dropIndex;
    const boundedDropIndex = Math.max(0, Math.min(adjustedDropIndex, nextFilters.length));
    nextFilters.splice(boundedDropIndex, 0, sourceFilter);

    if (nextFilters.join("|") === visibleQuickFilters.join("|")) return;

    updateSetting("alertQuickFilters", nextFilters);
  };

  const finishQuickFilterDrag = () => {
    setDraggedQuickFilter(null);
    setQuickFilterDropIndex(null);
  };

  const handleQuickFilterDragStart = (event: DragEvent<HTMLButtonElement>, filter: AlertQuickFilter) => {
    setDraggedQuickFilter(filter);
    setQuickFilterDropIndex(visibleQuickFilters.indexOf(filter));
    suppressQuickFilterClickRef.current = true;
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", filter);
  };

  const handleQuickFilterDragOver = (event: DragEvent<HTMLDivElement>) => {
    if (!draggedQuickFilter) return;

    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    setQuickFilterDropIndex(getQuickFilterDropIndex(event.clientX, event.clientY));
  };

  const handleQuickFilterDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();

    const sourceFilter = (event.dataTransfer.getData("text/plain") || draggedQuickFilter) as AlertQuickFilter | null;

    if (sourceFilter) {
      reorderQuickFilters(sourceFilter, quickFilterDropIndex ?? getQuickFilterDropIndex(event.clientX, event.clientY));
    }

    finishQuickFilterDrag();
  };

  const handleQuickFilterEndDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();

    const sourceFilter = (event.dataTransfer.getData("text/plain") || draggedQuickFilter) as AlertQuickFilter | null;

    if (sourceFilter) {
      reorderQuickFilters(sourceFilter, visibleQuickFilters.length);
    }

    finishQuickFilterDrag();
  };

  const handleQuickFilterClick = (filter: AlertQuickFilter) => {
    if (suppressQuickFilterClickRef.current) {
      suppressQuickFilterClickRef.current = false;
      return;
    }

    applyQuickFilter(filter);
  };

  const restoreDefaultQuickFilters = () => {
    updateSetting("alertQuickFilters", defaultQuickFilters);
    finishQuickFilterDrag();
  };

  return (
    <section className="alerts-page" data-tour="alerts-page">
      <div className="panel-header alerts-page-header">
        <div>
          <h2>Risk Alerts</h2>
          <p className="muted-text">
            {alerts.filter((alert) => !alert.read).length} Active • {alerts.filter((alert) => alert.read && !alert.historyCleared).length} Alert History
          </p>
        </div>

        {unreadAlertsCount > 0 && (
          <button className="secondary-button" onClick={markAllAlertsAsRead}>Mark all read</button>
        )}
      </div>

      <div className="alerts-filter-panel">
        <div className="alerts-search-row">
          <label className="alerts-search-field">
            <Filter size={16} />
            <input
              type="search"
              placeholder="Search alerts..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
          </label>

          {hasActiveFilters && (
            <button className="secondary-button compact alerts-reset-filter" type="button" onClick={resetFilters}>
              <X size={15} />
              Reset
            </button>
          )}
        </div>

        <div className="alerts-filter-grid">
          <label>
            <span>Ticker</span>
            <select value={tickerFilter} onChange={(event) => setTickerFilter(event.target.value)}>
              <option value="all">All tickers</option>
              {availableTickers.map((ticker) => <option key={ticker} value={ticker}>{ticker}</option>)}
            </select>
          </label>

          <label>
            <span>Status</span>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as AlertStatusFilter)}>
              {statusOptions.map((status) => <option key={status} value={status}>{status === "all" ? "All" : status === "unread" ? "Unread" : "Read"}</option>)}
            </select>
          </label>

          <label>
            <span>Severity</span>
            <select value={severityFilter} onChange={(event) => setSeverityFilter(event.target.value as AlertSeverity | "all")}>
              {severityOptions.map((severity) => <option key={severity} value={severity}>{severity === "all" ? "All" : severity[0].toUpperCase() + severity.slice(1)}</option>)}
            </select>
          </label>

          <label>
            <span>Date</span>
            <select value={dateFilter} onChange={(event) => setDateFilter(event.target.value as AlertDateFilter)}>
              {dateOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>
        </div>

        {dateFilter === "custom" && (
          <div className="alerts-custom-date-row">
            <label>
              <span>From</span>
              <input type="date" value={customDateFrom} onChange={(event) => setCustomDateFrom(event.target.value)} />
            </label>
            <label>
              <span>To</span>
              <input type="date" value={customDateTo} onChange={(event) => setCustomDateTo(event.target.value)} />
            </label>
          </div>
        )}

        <div className="alerts-quick-row">
          {visibleQuickFilters.length > 0 && (
            <div
              className={`alerts-quick-filters ${draggedQuickFilter ? "is-dragging" : ""}`}
              aria-label="Quick alert filters"
              onDragOver={handleQuickFilterDragOver}
              onDrop={handleQuickFilterDrop}
            >
              {visibleQuickFilters.map((filter, index) => (
                <div key={filter} className="quick-filter-chip-slot">
                  {draggedQuickFilter && quickFilterDropIndex === index && (
                    <span className="quick-filter-drop-indicator" aria-hidden="true" />
                  )}

                  <button
                    ref={(element) => {
                      if (element) {
                        quickFilterRefs.current.set(filter, element);
                      } else {
                        quickFilterRefs.current.delete(filter);
                      }
                    }}
                    type="button"
                    draggable
                    className={`quick-filter-chip ${isQuickFilterActive(filter) ? "active" : ""} ${draggedQuickFilter === filter ? "dragging" : ""}`}
                    onClick={() => handleQuickFilterClick(filter)}
                    onDragStart={(event) => handleQuickFilterDragStart(event, filter)}
                    onDragEnd={finishQuickFilterDrag}
                    title="Drag to reorder"
                  >
                    {quickFilterLabels[filter]}
                  </button>
                </div>
              ))}

              <div
                className={`quick-filter-end-drop-zone ${draggedQuickFilter ? "visible" : ""} ${quickFilterDropIndex === visibleQuickFilters.length ? "active" : ""}`}
                aria-hidden="true"
                onDragEnter={(event) => {
                  event.preventDefault();
                  setQuickFilterDropIndex(visibleQuickFilters.length);
                }}
                onDragOver={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  event.dataTransfer.dropEffect = "move";
                  setQuickFilterDropIndex(visibleQuickFilters.length);
                }}
                onDrop={handleQuickFilterEndDrop}
              >
                {draggedQuickFilter && quickFilterDropIndex === visibleQuickFilters.length && (
                  <span className="quick-filter-drop-indicator end" aria-hidden="true" />
                )}
              </div>
            </div>
          )}

          <div className="quick-chip-settings">
            <button
              type="button"
              className={`quick-chip-settings-button ${isQuickSettingsOpen ? "active" : ""}`}
              onClick={() => setIsQuickSettingsOpen((value) => !value)}
              aria-label="Configure quick chips"
              aria-expanded={isQuickSettingsOpen}
            >
              <Settings2 size={16} />
            </button>

            {isQuickSettingsOpen && (
              <div className="quick-chip-menu">
                <div className="quick-chip-menu-header">
                  <strong>Quick Chips</strong>
                  <span>Choose shortcuts. Drag chips in the toolbar to reorder.</span>
                </div>

                <div className="quick-chip-menu-options">
                  {quickFilterOptions.map((option) => {
                    const selected = visibleQuickFilters.includes(option.value);

                    return (
                      <label key={option.value} className="quick-chip-menu-option">
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={() => toggleQuickFilterSetting(option.value)}
                        />
                        <span>
                          <strong>{option.label}</strong>
                          <small>{option.description}</small>
                        </span>
                      </label>
                    );
                  })}
                </div>

                <button type="button" className="quick-chip-restore" onClick={restoreDefaultQuickFilters}>
                  Restore defaults
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {showActiveSection && (
        <>
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
              <h3>{hasActiveFilters ? "No active alerts match these filters" : "No active alerts"}</h3>
              <p>{hasActiveFilters ? "Try changing or clearing your filters." : "Your portfolio does not currently show urgent risk alerts."}</p>
            </div>
          )}
        </>
      )}

      {showHistorySection ? (
        <div className="alerts-history">
          <div className="alerts-history-bar">
            <button
              className="alerts-history-toggle"
              type="button"
              onClick={() => setIsHistoryOpen((value) => !value)}
              aria-expanded={isHistoryVisible}
            >
              <div>
                <h3>Alert History</h3>
                <p>{historyAlerts.length} acknowledged alert{historyAlerts.length === 1 ? "" : "s"}</p>
              </div>
              <ChevronDown className={isHistoryVisible ? "open" : ""} size={20} />
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

          {isHistoryVisible && (
            <div className="alerts-list alerts-history-list">
              {historyAlerts.map((alert) => (
                <AlertCard key={alert.id} alert={alert} onMarkRead={markAlertAsRead} />
              ))}
            </div>
          )}
        </div>
      ) : statusFilter === "read" ? (
        <div className="empty-alerts compact">
          <Bell size={30} />
          <h3>No read alerts match these filters</h3>
          <p>Read alerts are shown here instead of being hidden in the collapsed history block.</p>
        </div>
      ) : null}

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
