import { useState } from "react";

import "./common.css";

import { AddPositionModal, AddWatchItemModal } from "./components/AddModals";
import { useAddPositionModal, useAddWatchItemModal } from "./hooks/useAddAssetModals";
import { useAlerts } from "./hooks/useAlerts";
import { useAssetSorting } from "./hooks/useAssetSorting";
import { useInitialView } from "./hooks/useInitialView";
import { useInsights } from "./hooks/useInsights";
import { usePageHeader } from "./hooks/usePageHeader";
import { usePortfolioAnalytics } from "./hooks/usePortfolioAnalytics";
import { useSellSmartData } from "./hooks/useSellSmartData";
import { SellSmartLayout } from "./layout/SellSmartLayout";
import { AlertsPage } from "./pages/AlertsPage";
import { DashboardPage } from "./pages/DashboardPage";
import { InsightsPage } from "./pages/InsightsPage";
import { PortfolioPage } from "./pages/PortfolioPage";
import { ReportsPage } from "./pages/ReportsPage";
import { SettingsPage } from "./pages/SettingsPage";
import { WatchlistPage } from "./pages/WatchlistPage";
import { HelpCenterPage } from "./pages/HelpCenterPage";

export default function MainScreen() {
  const [activeView, setActiveView] = useInitialView();
  const [helpSearch, setHelpSearch] = useState("");

  const {
    positions,
    watchlist,
    settings,
    readAlertIds,
    isLoadingPredictions,
    saveReadAlerts,
    updateSetting,
    resetAppData,
    importDemoPortfolio,
    addPosition,
    addWatchItem,
  } = useSellSmartData();

  const {
    sortBy,
    setSortBy,
    portfolioViewMode,
    setPortfolioViewMode,
    expandedTicker,
    setExpandedTicker,
    sortedPositions,
    sortedWatchlist,
  } = useAssetSorting(activeView, positions, watchlist);

  const analytics = usePortfolioAnalytics(activeView, positions, watchlist);

  const {
    alerts,
    unreadAlertsCount,
    latestAlerts,
    markAlertAsRead,
    markAllAlertsAsRead,
  } = useAlerts(
    positions,
    analytics.overallRisk,
    settings,
    readAlertIds,
    saveReadAlerts
  );

  const insights = useInsights(
    positions,
    watchlist,
    analytics.overallRisk,
    analytics.highRiskPositions.length
  );

  const { pageTitle, pageSubtitle } = usePageHeader(activeView);
  const addPositionModal = useAddPositionModal(addPosition, setActiveView, setExpandedTicker);
  const addWatchItemModal = useAddWatchItemModal(addWatchItem, setActiveView, setExpandedTicker);
  const reportGeneratedAt = new Date().toLocaleDateString();

  return (
    <SellSmartLayout
      activeView={activeView}
      pageTitle={pageTitle}
      pageSubtitle={pageSubtitle}
      unreadAlertsCount={unreadAlertsCount}
      isLoadingPredictions={isLoadingPredictions}
      setActiveView={setActiveView}
      onAddPosition={addPositionModal.open}
      onAddTicker={addWatchItemModal.open}
      onImportDemo={importDemoPortfolio}
      onMarkAllAlertsAsRead={markAllAlertsAsRead}
    >
      {activeView === "dashboard" && (
        <DashboardPage
          overallRisk={analytics.overallRisk}
          overallRiskLevel={analytics.overallRiskLevel}
          unreadAlertsCount={unreadAlertsCount}
          highRiskPositions={analytics.highRiskPositions}
          reduceSignals={analytics.reduceSignals}
          portfolioInsight={analytics.portfolioInsight}
          topRiskPosition={analytics.topRiskPosition}
          latestAlerts={latestAlerts}
          watchlistOpportunity={analytics.watchlistOpportunity}
          setActiveView={setActiveView}
        />
      )}

      {activeView === "portfolio" && (
        <PortfolioPage
          positions={positions}
          sortedPositions={sortedPositions}
          portfolioViewMode={portfolioViewMode}
          setPortfolioViewMode={setPortfolioViewMode}
          sortBy={sortBy}
          setSortBy={setSortBy}
          expandedTicker={expandedTicker}
          setExpandedTicker={setExpandedTicker}
          totalValue={analytics.totalValue}
          totalPnl={analytics.totalPnl}
          totalPnlPct={analytics.totalPnlPct}
          overallRisk={analytics.overallRisk}
          overallRiskLevel={analytics.overallRiskLevel}
          riskDistribution={analytics.riskDistribution}
          portfolioInsight={analytics.portfolioInsight}
          topDrivers={analytics.topDrivers}
          setActiveView={setActiveView}
        />
      )}

      {activeView === "watchlist" && (
        <WatchlistPage
          sortedWatchlist={sortedWatchlist}
          portfolioViewMode={portfolioViewMode}
          setPortfolioViewMode={setPortfolioViewMode}
          sortBy={sortBy}
          setSortBy={setSortBy}
          expandedTicker={expandedTicker}
          setExpandedTicker={setExpandedTicker}
          riskDistribution={analytics.riskDistribution}
          topDrivers={analytics.topDrivers}
          setActiveView={setActiveView}
          onAddTicker={addWatchItemModal.open}
        />
      )}

      {activeView === "alerts" && (
        <AlertsPage
          alerts={alerts}
          unreadAlertsCount={unreadAlertsCount}
          markAlertAsRead={markAlertAsRead}
          markAllAlertsAsRead={markAllAlertsAsRead}
        />
      )}

      {activeView === "insights" && (
        <InsightsPage
          insights={insights}
          portfolioInsight={analytics.portfolioInsight}
          overallRisk={analytics.overallRisk}
          overallRiskLevel={analytics.overallRiskLevel}
          highRiskPositions={analytics.highRiskPositions}
          reduceSignals={analytics.reduceSignals}
          setActiveView={setActiveView}
          setExpandedTicker={setExpandedTicker}
        />
      )}

      {activeView === "reports" && (
        <ReportsPage
          reportGeneratedAt={reportGeneratedAt}
          overallRisk={analytics.overallRisk}
          overallRiskLevel={analytics.overallRiskLevel}
          highRiskPositions={analytics.highRiskPositions}
          reduceSignals={analytics.reduceSignals}
          portfolioInsight={analytics.portfolioInsight}
          topRiskPosition={analytics.topRiskPosition}
          topDrivers={analytics.topDrivers}
        />
      )}

      {activeView === "help" && (
        <HelpCenterPage helpSearch={helpSearch} setHelpSearch={setHelpSearch} />
      )}

      {activeView === "settings" && (
        <SettingsPage
          settings={settings}
          updateSetting={updateSetting}
          resetAppData={resetAppData}
        />
      )}

      {addPositionModal.isOpen && (
        <AddPositionModal
          newTicker={addPositionModal.newTicker}
          newShares={addPositionModal.newShares}
          newAvgBuyPrice={addPositionModal.newAvgBuyPrice}
          setNewTicker={addPositionModal.setNewTicker}
          setNewShares={addPositionModal.setNewShares}
          setNewAvgBuyPrice={addPositionModal.setNewAvgBuyPrice}
          onSubmit={addPositionModal.submit}
          onClose={addPositionModal.close}
        />
      )}

      {addWatchItemModal.isOpen && (
        <AddWatchItemModal
          newWatchTicker={addWatchItemModal.newWatchTicker}
          setNewWatchTicker={addWatchItemModal.setNewWatchTicker}
          onSubmit={addWatchItemModal.submit}
          onClose={addWatchItemModal.close}
        />
      )}
    </SellSmartLayout>
  );
}
