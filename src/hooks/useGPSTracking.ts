
import { useState, useEffect, useCallback } from 'react';

type Location = {
  latitude: number;
  longitude: number;
};

export function useGPSTracking() {
  const [location, setLocation] = useState<Location | undefined>();
  const [isTracking, setIsTracking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startTracking = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    setIsTracking(true);
    setError(null);
  }, []);

  const stopTracking = useCallback(() => {
    setIsTracking(false);
  }, []);

  useEffect(() => {
    if (!isTracking) return;

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setError(null);
      },
      (error) => {
        setError(`Error getting location: ${error.message}`);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [isTracking]);

  return {
    location,
    isTracking,
    error,
    startTracking,
    stopTracking,
  };
}
