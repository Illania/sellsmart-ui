type Props = {
  onStart: () => void;
  onImportDemoAndStart: () => void;
  onSkip: () => void;
  isImportingDemo?: boolean;
};

export function OnboardingWelcomeModal({
  onStart,
  onImportDemoAndStart,
  onSkip,
  isImportingDemo = false,
}: Props) {
  return (
    <div className="onboarding-modal-backdrop">
      <div className="onboarding-modal">
        <div className="onboarding-logo">SellSmart</div>

        <h2>Welcome to SellSmart</h2>

        <p>
          SellSmart helps you understand portfolio risk signals using market
          data, trend, volatility, and news sentiment.
        </p>

        <div className="onboarding-note">
          For the best first experience, import a demo portfolio first. Then the
          onboarding tour will show real risk cards, alerts, insights, and
          reports.
        </div>

        <div className="onboarding-actions">
          <button type="button" className="secondary-button" onClick={onSkip}>
            Skip
          </button>

          <button type="button" className="secondary-button" onClick={onStart}>
            Show me around
          </button>

          <button
            type="button"
            className="primary-button"
            onClick={onImportDemoAndStart}
            disabled={isImportingDemo}
          >
            {isImportingDemo ? "Importing demo..." : "Import demo & start"}
          </button>
        </div>
      </div>
    </div>
  );
}