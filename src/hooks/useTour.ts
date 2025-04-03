
import { useState, useEffect } from 'react';
import { authState } from '@/contexts/auth/AuthState';

export function useTour() {
  const [shouldShowTour, setShouldShowTour] = useState(false);
  const tourCompletedKey = 'tour-completed';
  
  useEffect(() => {
    // Check if the tour has been completed before and if user is logged in
    const tourCompleted = localStorage.getItem(tourCompletedKey);
    const user = authState.user.get();
    
    // Only show tour if user is logged in and tour hasn't been completed
    if (user && !tourCompleted) {
      setShouldShowTour(true);
    }
  }, []);
  
  const completeTour = () => {
    localStorage.setItem(tourCompletedKey, 'true');
    setShouldShowTour(false);
  };
  
  const resetTour = () => {
    localStorage.removeItem(tourCompletedKey);
    const user = authState.user.get();
    // Only show tour if user is logged in
    if (user) {
      setShouldShowTour(true);
    }
  };
  
  return {
    shouldShowTour,
    completeTour,
    resetTour
  };
}
