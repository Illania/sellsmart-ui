import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";

import "./AppShell.css";

import {
  AddPositionModal,
  AddWatchItemModal,
  EditPositionModal,
  EditWatchItemModal,
} from "./components/AddModals";
import {
  useAddPositionModal,
  useAddWatchItemModal,
} from "./hooks/useAddAssetModals";
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
import { HelpCenterPage } from "./pages/HelpCenterPage";
import { InsightsPage } from "./pages/InsightsPage";
import { LoginPage } from "./pages/LoginPage";
import { PortfolioPage } from "./pages/PortfolioPage";
import { ReportsPage } from "./pages/ReportsPage";
import { SettingsPage } from "./pages/SettingsPage";
import { WatchlistPage } from "./pages/WatchlistPage";
import { ProfilePage } from "./pages/ProfilePage";
import { supabase } from "./supabaseClient";
import type { Position, WatchItem } from "./types";

export default function MainScreen() {
  const [activeView, setActiveView] = useInitialView();
  const [helpSearch, setHelpSearch] = useState("");
  const [editingPosition, setEditingPosition] = useState<Position | null>(null);
  const [editingWatchItem, setEditingWatchItem] = useState<WatchItem | null>(
    null,
  );

  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

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
    updatePosition,
    deletePosition,
    addWatchItem,
    updateWatchItem,
    deleteWatchItem,
  } = useSellSmartData(session, setActiveView);

  const {
  sortBy,
  setSortBy,
  portfolioViewMode,
  setPortfolioViewMode,
  expandedTicker,
  setExpandedTicker,
  isMobile,
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
    saveReadAlerts,
  );

  const insights = useInsights(
    positions,
    watchlist,
    analytics.overallRisk,
    analytics.highRiskPositions.length,
  );

  const { pageTitle, pageSubtitle } = usePageHeader(activeView);
  const addPositionModal = useAddPositionModal(
    addPosition,
    setActiveView,
    setExpandedTicker,
  );
  const addWatchItemModal = useAddWatchItemModal(
    addWatchItem,
    setActiveView,
    setExpandedTicker,
  );

  const reportGeneratedAt = new Date().toLocaleDateString();

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const handleDeletePosition = async (ticker: string) => {
    await deletePosition(ticker);
    setExpandedTicker(null);
  };

  const handleUpdatePosition = async (
    oldTicker: string,
    ticker: string,
    shares: number,
    avgBuyPrice: number,
  ) => {
    await updatePosition(oldTicker, ticker, shares, avgBuyPrice);
    setExpandedTicker(ticker);
    setActiveView("portfolio");
  };

  const handleDeleteWatchItem = async (ticker: string) => {
    await deleteWatchItem(ticker);
    setExpandedTicker(null);
  };

  const handleUpdateWatchItem = async (oldTicker: string, ticker: string) => {
    await updateWatchItem(oldTicker, ticker);
    setExpandedTicker(ticker);
    setActiveView("watchlist");
  };

  if (authLoading) {
    return <div className="app-loading">Loading SellSmart...</div>;
  }

  if (!session) {
    return <LoginPage />;
  }

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
  onLogout={handleLogout}
  userEmail={session.user.email ?? undefined}
  userAvatarUrl={
    session.user.user_metadata.avatar_url ??
    session.user.user_metadata.picture ??
    undefined
  }
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
          onEditPosition={setEditingPosition}
          onDeletePosition={handleDeletePosition}
          isMobile={isMobile}
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
          onEditWatchItem={setEditingWatchItem}
          onDeleteWatchItem={handleDeleteWatchItem}
          isMobile={isMobile}
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

      {activeView === "profile" && (
        <ProfilePage
          userEmail={session.user.email ?? undefined}
          onLogout={handleLogout}
          onResetAppData={resetAppData}
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

      {editingPosition && (
        <EditPositionModal
          position={editingPosition}
          onSubmit={handleUpdatePosition}
          onClose={() => setEditingPosition(null)}
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

      {editingWatchItem && (
        <EditWatchItemModal
          item={editingWatchItem}
          onSubmit={handleUpdateWatchItem}
          onClose={() => setEditingWatchItem(null)}
        />
      )}
    </SellSmartLayout>
  );
}
