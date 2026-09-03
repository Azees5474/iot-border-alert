import { useState, useRef, useCallback, useEffect } from 'react';
import type { Position } from '../types';

export interface GeolocationState {
  currentPosition: Position | null;
  error: string | null;
  isTracking: boolean;
  accuracy: number;
  latitude: number | null;
  longitude: number | null;
  timestamp: number | null;
  startTracking: () => void;
  stopTracking: () => void;
}

export const useGeolocation = (): GeolocationState => {
  const [currentPosition, setCurrentPosition] = useState<Position | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [accuracy, setAccuracy] = useState(0);
  const watchId = useRef<ReturnType<typeof navigator.geolocation.watchPosition> | null>(null);

  const stopTracking = useCallback(() => {
    if (watchId.current !== null) {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }
    setIsTracking(false);
  }, []);

  const startTracking = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser.');
      return;
    }
    if (isTracking) return;

    setError(null);
    setIsTracking(true);

    watchId.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, accuracy: acc } = pos.coords;
        if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return;
        if (latitude < -90 || latitude > 90) return;
        if (longitude < -180 || longitude > 180) return;
        if (latitude === 0 && longitude === 0) return;
        const ts = pos.timestamp;
        const position: Position = {
          lat: latitude,
          lng: longitude,
          accuracy: acc,
          timestamp: ts,
        };
        setCurrentPosition(position);
        setAccuracy(acc);
      },
      (err) => {
        setError(err.message || 'Failed to retrieve location');
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 5000,
      },
    );
  }, [isTracking]);

  useEffect(() => {
    return () => {
      stopTracking();
    };
  }, [stopTracking]);

  return {
    currentPosition,
    error,
    isTracking,
    accuracy,
    latitude: currentPosition?.lat ?? null,
    longitude: currentPosition?.lng ?? null,
    timestamp: currentPosition?.timestamp ?? null,
    startTracking,
    stopTracking,
  };
};

export default useGeolocation;
