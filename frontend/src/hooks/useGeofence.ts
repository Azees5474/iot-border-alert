import { useState, useEffect, useRef } from 'react';
import type { Position, Geofence } from '../types';
import { checkGeofence } from '@/utils/geofence';

export interface GeofenceResult {
  inside: boolean;
  distance: number;
  status: 'inside' | 'outside' | 'unknown';
  previousInside: boolean | null;
  breached: boolean;
  returned: boolean;
}

export const useGeofence = (
  currentPosition: Position | null,
  geofence: Geofence,
): GeofenceResult => {
  const [result, setResult] = useState<GeofenceResult>({
    inside: false,
    distance: 0,
    status: 'unknown',
    previousInside: null,
    breached: false,
    returned: false,
  });

  const prevInsideRef = useRef<boolean | null>(null);

  useEffect(() => {
    if (!currentPosition) {
      setResult((prev) => ({
        ...prev,
        inside: false,
        distance: 0,
        status: 'unknown',
        breached: false,
        returned: false,
      }));
      return;
    }

    const { inside, distance } = checkGeofence(
      currentPosition.lat,
      currentPosition.lng,
      geofence.latitude,
      geofence.longitude,
      geofence.radius,
    );

    const wasInside = prevInsideRef.current;
    const breached = wasInside === true && inside === false;
    const returned = wasInside === false && inside === true;

    prevInsideRef.current = inside;

    setResult({
      inside,
      distance,
      status: inside ? 'inside' : 'outside',
      previousInside: wasInside,
      breached,
      returned,
    });
  }, [currentPosition, geofence]);

  return result;
};

export default useGeofence;
