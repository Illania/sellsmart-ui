import { SpeedInsights } from '@vercel/speed-insights/react';
import { Analytics } from '@vercel/analytics/react';
import MainScreen from "./AppShell";
import { PrivacyPolicyPage } from "./pages/PrivacyPolicyPage";
import { TermsPage } from "./pages/TermsPage";


export default function App() {
  const path = window.location.pathname;

  if (path === "/privacy") {
    return <PrivacyPolicyPage />;
  }

  if (path === "/terms") {
    return <TermsPage />;
  }

  return (
    <>
      <MainScreen />
      <SpeedInsights />
      <Analytics />
    </>
  );
}