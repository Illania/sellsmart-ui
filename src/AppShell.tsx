import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";

import "./AppShell.css";

import { SellSmartOnboarding } from "./components/onboarding/SellSmartOnboarding";
import {
  AddPositionModal,
  AddWatchItemModal,
  EditPositionModal,
  EditWatchItemModal,
} from "./components/AddModals";
import { ImportPortfolioModal } from "./components/PortfolioImport/ImportPortfolioModal";
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
import { useAppearance } from "./hooks/useAppearance";
import { getStoredAppearanceMode } from "./themeScript";
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
import { ensureUserProfile, type UserProfile } from "./api/userProfile";
import { supabase } from "./supabaseClient";
import type { ViewType, Position, WatchItem } from "./types";

export default function MainScreen() {
  const [activeView, setActiveView] = useInitialView();
  const [helpSearch, setHelpSearch] = useState("");
  const [editingPosition, setEditingPosition] = useState<Position | null>(null);
  const [editingWatchItem, setEditingWatchItem] = useState<WatchItem | null>(
    null,
  );
  const [isImportPortfolioOpen, setIsImportPortfolioOpen] = useState(false);

  const [session, setSession] = useState<Session | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {

const titles: Record<ViewType, string> = {
  dashboard: "Dashboard | SellSmart",
  portfolio: "Portfolio | SellSmart",
  watchlist: "Watchlist | SellSmart",
  alerts: "Alerts | SellSmart",
  insights: "Insights | SellSmart",
  reports: "Reports | SellSmart",
  settings: "Settings | SellSmart",
  help: "Help Center | SellSmart",
  profile: "Profile | SellSmart",
};

  document.title = titles[activeView] ?? "SellSmart";
}, [activeView]);

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


  useEffect(() => {
    if (!session?.user) {
      setUserProfile(null);
      return;
    }

    let cancelled = false;

    const loadProfile = async () => {
      try {
        const profile = await ensureUserProfile(session.user);

        if (!cancelled) {
          setUserProfile(profile);
        }
      } catch (error) {
        console.error("Could not load user profile", error);
      }
    };

    void loadProfile();

    return () => {
      cancelled = true;
    };
  }, [session]);

  const {
    positions,
    watchlist,
    settings,
    readAlertIds,
    isLoadingPredictions,
    isUserDataReady,
    saveReadAlerts,
    updateSetting,
    resetDemoData,
    importDemoPortfolio,
    addPosition,
    updatePosition,
    importPositions,
    deletePosition,
    addWatchItem,
    updateWatchItem,
    deleteWatchItem,
  } = useSellSmartData(session, setActiveView);

  const effectiveAppearance = isUserDataReady ? settings.appearance : getStoredAppearanceMode();
  useAppearance(effectiveAppearance);

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
    setUserProfile(null);
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
    setExpandedTicker(null);
    setActiveView("portfolio");
  };

  const handleDeleteWatchItem = async (ticker: string) => {
    await deleteWatchItem(ticker);
    setExpandedTicker(null);
  };

  const handleUpdateWatchItem = async (oldTicker: string, ticker: string) => {
    await updateWatchItem(oldTicker, ticker);
    setExpandedTicker(null);
    setActiveView("watchlist");
  };

  if (authLoading || (session && !isUserDataReady)) {
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
      onImportCsv={() => setIsImportPortfolioOpen(true)}
      onMarkAllAlertsAsRead={markAllAlertsAsRead}
      onLogout={handleLogout}
      userEmail={session.user.email ?? undefined}
      userDisplayName={userProfile?.displayName || undefined}
      userAvatarUrl={
        userProfile?.avatarUrl ||
        session.user.user_metadata.avatar_url ||
        session.user.user_metadata.picture ||
        undefined
      }
    >

      <SellSmartOnboarding
        user={session.user}
        setActiveView={setActiveView}
        onImportDemo={importDemoPortfolio}
      />

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
          dailyPnl={analytics.dailyPnl}
          dailyPnlPct={analytics.dailyPnlPct}
          latestPriceTimestamp={analytics.latestPriceTimestamp}
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
          resetDemoData={resetDemoData}
        />
      )}

      {activeView === "profile" && (
        <ProfilePage
          user={session.user}
          userProfile={userProfile}
          userEmail={session.user.email ?? undefined}
          userAvatarUrl={
            session.user.user_metadata.avatar_url ??
            session.user.user_metadata.picture ??
            undefined
          }
          onProfileSaved={setUserProfile}
          onLogout={handleLogout}
          onResetDemoData={resetDemoData}
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
          accessToken={session.access_token}
          onSymbolSelect={addPositionModal.handleSymbolSelect}
        />
      )}

      {isImportPortfolioOpen && (
        <ImportPortfolioModal
          positions={positions}
          onImport={importPositions}
          onClose={() => setIsImportPortfolioOpen(false)}
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
          accessToken={session.access_token}
          onSymbolSelect={addWatchItemModal.handleSymbolSelect}
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
