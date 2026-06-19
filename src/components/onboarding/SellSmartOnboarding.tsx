import { useCallback, useEffect, useMemo, useState } from "react";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";

import type { User } from "@supabase/supabase-js";
import type { ViewType } from "../../types";
import { ensureUserProfile, updateOnboardingVersion } from "../../api/userProfile";
import { onboardingSteps } from "./OnboardingSteps";
import { OnboardingWelcomeModal } from "./OnboardingWelcomeModal";
import "./onboarding.css";

const CURRENT_ONBOARDING_VERSION = 1;
const ONBOARDING_KEY = `sellsmart_onboarding_completed_v${CURRENT_ONBOARDING_VERSION}`;

type Props = {
  user: User | null;
  setActiveView: (view: ViewType) => void;
  onImportDemo?: () => Promise<void> | void;
};

export function SellSmartOnboarding({
  user,
  setActiveView,
  onImportDemo,
}: Props) {
  const [showWelcome, setShowWelcome] = useState(false);
  const [isCompleted, setIsCompleted] = useState(true);
  const [isImportingDemo, setIsImportingDemo] = useState(false);

  const isMobile = useMemo(() => {
    return window.matchMedia("(max-width: 768px)").matches;
  }, []);

  const markCompleted = useCallback(async () => {
    localStorage.setItem(ONBOARDING_KEY, "true");
    setIsCompleted(true);
    setShowWelcome(false);

    if (!user) return;

    try {
      await updateOnboardingVersion(user, CURRENT_ONBOARDING_VERSION);
    } catch (error) {
      console.error("Could not save onboarding completion", error);
    }
  }, [user]);

  const checkCompleted = useCallback(async () => {
    const localCompleted = localStorage.getItem(ONBOARDING_KEY) === "true";

    if (!user) {
      setIsCompleted(localCompleted);
      setShowWelcome(!localCompleted);
      return;
    }

    let profile;

    try {
      profile = await ensureUserProfile(user);
    } catch (error) {
      console.error("Could not load user profile", error);
      setIsCompleted(localCompleted);
      setShowWelcome(!localCompleted);
      return;
    }

    const completed =
      profile.onboardingVersion === CURRENT_ONBOARDING_VERSION || localCompleted;

    setIsCompleted(completed);
    setShowWelcome(!completed);
  }, [user]);

  useEffect(() => {
    void checkCompleted();
  }, [checkCompleted]);

  const startTour = useCallback(() => {
    setShowWelcome(false);

    const validSteps = onboardingSteps.filter((step) => {
      if (step.mobileOnly && !isMobile) return false;
      if (step.desktopOnly && isMobile) return false;
      return true;
    });

    let closeWasClicked = false;

    const tour = driver({
      showProgress: true,
      showButtons: ["previous", "next", "close"],
      allowKeyboardControl: true,
      allowClose: true,
      overlayClickBehavior: "close",
      stagePadding: 8,
      stageRadius: 16,
      popoverClass: "sellsmart-driver-popover",

      prevBtnText: "Back",
      nextBtnText: "Next",
      doneBtnText: "Start using SellSmart",

      steps: validSteps.map((step) => ({
        element: step.element,
        popover: {
          title: step.title,
          description: step.description,
          side: step.side ?? "bottom",
          align: step.align ?? "center",
        },
        onHighlightStarted: () => {
          setActiveView(step.view);
        },
      })),

      onCloseClick: () => {
        closeWasClicked = true;
        tour.destroy();
        void markCompleted();
      },

      onDestroyed: () => {
        if (!closeWasClicked) {
          void markCompleted();
        }
      },
    });

    tour.drive();
  }, [isMobile, markCompleted, setActiveView]);

  const handleImportDemoAndStart = useCallback(async () => {
    try {
      setIsImportingDemo(true);
      await onImportDemo?.();

      window.setTimeout(() => {
        startTour();
      }, 700);
    } finally {
      setIsImportingDemo(false);
    }
  }, [onImportDemo, startTour]);

  useEffect(() => {
    window.sellsmartReplayOnboarding = () => {
      localStorage.removeItem(ONBOARDING_KEY);
      setIsCompleted(false);
      setShowWelcome(true);
    };

    return () => {
      delete window.sellsmartReplayOnboarding;
    };
  }, []);

  if (isCompleted && !showWelcome) return null;

  return (
    <>
      {showWelcome && (
        <OnboardingWelcomeModal
          onStart={startTour}
          onImportDemoAndStart={handleImportDemoAndStart}
          onSkip={markCompleted}
          isImportingDemo={isImportingDemo}
        />
      )}
    </>
  );
}

declare global {
  interface Window {
    sellsmartReplayOnboarding?: () => void;
  }
}