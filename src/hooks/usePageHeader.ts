import type { ViewType } from "../types";

const pageHeaderContent: Record<ViewType, { pageTitle: string; pageSubtitle: string }> = {
  dashboard: {
    pageTitle: "Dashboard",
    pageSubtitle: "Your AI-powered risk command center",
  },
  portfolio: {
    pageTitle: "My Portfolio",
    pageSubtitle: "AI-powered risk analysis of your investments",
  },
  watchlist: {
    pageTitle: "Watchlist",
    pageSubtitle: "Track stocks before adding them to your portfolio",
  },
  alerts: {
    pageTitle: "Alerts",
    pageSubtitle: "Real-time risk alerts from SellSmart AI",
  },
  insights: {
    pageTitle: "Insights",
    pageSubtitle: "AI-generated explanations behind portfolio risk",
  },
  reports: {
    pageTitle: "Reports",
    pageSubtitle: "Portfolio risk reports and AI-generated summaries",
  },
  help: {
    pageTitle: "Help Center",
    pageSubtitle: "Documentation, FAQs and platform support",
  },
  settings: {
    pageTitle: "Settings",
    pageSubtitle: "Customize SellSmart risk intelligence",
  },
};

export function usePageHeader(activeView: ViewType) {
  return pageHeaderContent[activeView];
}
