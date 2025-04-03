
import { useState, useEffect } from 'react';

export function useTour() {
  const [shouldShowTour, setShouldShowTour] = useState(false);
  const tourCompletedKey = 'tour-completed';
  
  useEffect(() => {
    // Check if the tour has been completed before
    const tourCompleted = localStorage.getItem(tourCompletedKey);
    
    if (!tourCompleted) {
      setShouldShowTour(true);
    }
  }, []);
  
  const completeTour = () => {
    localStorage.setItem(tourCompletedKey, 'true');
    setShouldShowTour(false);
  };
  
  const resetTour = () => {
    localStorage.removeItem(tourCompletedKey);
    setShouldShowTour(true);
  };
  
  return {
    shouldShowTour,
    completeTour,
    resetTour
  };
}
