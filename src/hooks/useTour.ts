
import { useState, useEffect } from 'react';
import { authState } from '@/contexts/auth/AuthState';

const TOUR_COMPLETED_KEY = 'tour-completed';
const TOUR_RESET_EVENT = 'tour:reset';

export function useTour() {
  const [shouldShowTour, setShouldShowTour] = useState(false);

  useEffect(() => {
    const tourCompleted = localStorage.getItem(TOUR_COMPLETED_KEY);
    const user = authState.user.get();

    if (user && !tourCompleted) {
      setShouldShowTour(true);
    }

    // Listen for cross-component reset events so any consumer (e.g. HelpCenter)
    // can trigger the tour to reopen in OnboardingTutorial.
    const handleReset = () => {
      const currentUser = authState.user.get();
      if (currentUser) {
        setShouldShowTour(true);
      }
    };

    window.addEventListener(TOUR_RESET_EVENT, handleReset);
    return () => window.removeEventListener(TOUR_RESET_EVENT, handleReset);
  }, []);

  const completeTour = () => {
    localStorage.setItem(TOUR_COMPLETED_KEY, 'true');
    setShouldShowTour(false);
  };

  const resetTour = () => {
    localStorage.removeItem(TOUR_COMPLETED_KEY);
    // Notify all useTour consumers (across components) to re-open the tour.
    window.dispatchEvent(new CustomEvent(TOUR_RESET_EVENT));
  };

  return {
    shouldShowTour,
    completeTour,
    resetTour,
  };
}
