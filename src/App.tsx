import { SpeedInsights } from '@vercel/speed-insights/react';
import MainScreen from "./AppShell";

export default function App() {
  return (
    <>
      <MainScreen />
      <SpeedInsights />
    </>
  );
}