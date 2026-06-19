import type { ViewType } from "../../types";

export type OnboardingStep = {
  view: ViewType;
  element: string;
  title: string;
  description: string;
  side?: "top" | "bottom" | "left" | "right";
  align?: "start" | "center" | "end";
  mobileOnly?: boolean;
  desktopOnly?: boolean;
};

export const onboardingSteps: OnboardingStep[] = [
  {
    view: "dashboard",
    element: '[data-tour="dashboard-page"]',
    title: "Dashboard",
    description:
      "This is your main SellSmart overview. Here you can quickly understand portfolio risk and what needs attention.",
    side: "bottom",
  },
  {
    view: "dashboard",
    element: '[data-tour="dashboard-summary"]',
    title: "Portfolio summary",
    description:
      "These cards summarize your portfolio value, average risk, alerts, and AI model signals.",
    side: "bottom",
  },
  {
    view: "portfolio",
    element: '[data-tour="portfolio-page"]',
    title: "Portfolio",
    description: "Portfolio is where you track stocks you actually own.",
    side: "bottom",
  },
  {
    view: "portfolio",
    element: '[data-tour="add-position"]',
    title: "Add a position",
    description:
      "Add a ticker, number of shares, and average price to start tracking portfolio risk.",
    side: "bottom",
  },
  {
    view: "portfolio",
    element: '[data-tour="portfolio-list"]',
    title: "Position risk cards",
    description:
      "Each position shows risk score, suggested action, and the main model drivers behind the signal.",
    side: "top",
  },
  {
    view: "watchlist",
    element: '[data-tour="watchlist-page"]',
    title: "Watchlist",
    description:
      "Use Watchlist to monitor tickers before buying. These stocks do not affect your portfolio value.",
    side: "bottom",
  },
  {
    view: "watchlist",
    element: '[data-tour="add-watchlist"]',
    title: "Add to Watchlist",
    description:
      "Add tickers here when you want to watch them without creating a real position.",
    side: "bottom",
  },
  {
    view: "alerts",
    element: '[data-tour="alerts-page"]',
    title: "Alerts",
    description:
      "Alerts highlight risk changes, news-driven warnings, and positions that may need attention.",
    side: "bottom",
  },
  {
    view: "insights",
    element: '[data-tour="insights-page"]',
    title: "Insights",
    description:
      "Insights explain why the risk signal changed using trend, volatility, market context, and news sentiment.",
    side: "bottom",
  },
  {
    view: "reports",
    element: '[data-tour="reports-page"]',
    title: "Reports",
    description:
      "Reports help you review and export a portfolio risk summary.",
    side: "bottom",
  },
  {
    view: "settings",
    element: '[data-tour="settings-page"]',
    title: "Settings",
    description:
      "Settings let you control alerts, thresholds, default view, and replay this onboarding guide.",
    side: "bottom",
  },
];