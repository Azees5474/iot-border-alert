import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
  ReactNode,
} from 'react';
import type {
  Alert,
  DeviceStatus,
  Geofence,
  Position,
  Settings,
  AppContextType,
} from '@/types';
import { checkGeofence } from '@/utils/geofence';
import { locationApi, geofenceApi, deviceApi, alertApi } from '@/services/api';
import { getSettings, saveSettings, getAlerts as getStoredAlerts, clearAlerts as clearStoredAlerts } from '@/utils/storage';

const AppContext = createContext<AppContextType | undefined>(undefined);

const DEFAULT_POSITION: Position = {
  lat: 13.08268,
  lng: 80.270718,
  accuracy: 0,
  timestamp: Date.now(),
};

const DEFAULT_DEVICE: DeviceStatus = {
  deviceId: 'ESP32-001',
  status: 'offline',
  lastSeen: null,
};

function useGeolocationWatch(enabled: boolean) {
  const [position, setPosition] = useState<Position | null>(null);
  const [error, setError] = useState<string | null>(null);
  const watchId = useRef<ReturnType<typeof navigator.geolocation.watchPosition> | null>(null);

  const stop = useCallback(() => {
    if (watchId.current !== null) {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }
  }, []);

  useEffect(() => {
    if (!enabled) {
      stop();
      return;
    }
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser.');
      return;
    }
    watchId.current = navigator.geolocation.watchPosition(
      (pos) => {
        setPosition({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          timestamp: pos.timestamp,
        });
        setError(null);
      },
      (err) => setError(err.message || 'Location error'),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
    return stop;
  }, [enabled, stop]);

  return { position, error, stop };
}

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [settings] = useState<Settings>(() => getSettings());

  const [geofence, setGeofenceState] = useState<Geofence>(() => {
    const s = getSettings();
    return { latitude: s.geofenceLat, longitude: s.geofenceLng, radius: s.geofenceRadius };
  });

  const [demoMode, setDemoMode] = useState(settings.demoMode ?? false);
  const [gpsTracking, setGpsTrackingState] = useState(false);
  const [currentPosition, setCurrentPosition] = useState<Position | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>(() => getStoredAlerts());
  const [deviceStatus, setDeviceStatus] = useState<DeviceStatus>(DEFAULT_DEVICE);

  const geo = useGeolocationWatch(gpsTracking && !demoMode);

  const insideRef = useRef<boolean | null>(null);

  const evaluateGeofence = useCallback(
    (pos: Position) => {
      const { inside, distance } = checkGeofence(
        pos.lat,
        pos.lng,
        geofence.latitude,
        geofence.longitude,
        geofence.radius,
      );
      const wasInside = insideRef.current;
      const breached = wasInside === true && inside === false;
      const returned = wasInside === false && inside === true;
      if (breached || returned) {
        insideRef.current = inside;
      }
      return { inside, distance, breached, returned };
    },
    [geofence],
  );

  const persistAlert = useCallback(
    async (pos: Position, distance: number, breached: boolean, returned: boolean) => {
      if (!breached && !returned) return;
      const alertEntry: Alert = {
        id: Date.now().toString(),
        time: new Date().toISOString(),
        latitude: pos.lat,
        longitude: pos.lng,
        accuracy: pos.accuracy,
        distance,
        status: breached ? 'BREACHED' : 'SAFE',
        alert: breached,
        timestamp: Date.now(),
      };
      setAlerts((prev) => {
        const list = [...prev, alertEntry].sort((a, b) => b.timestamp - a.timestamp);
        return list;
      });
      try {
        await alertApi.postAlert(alertEntry);
      } catch {
        // best effort
      }
    },
    [],
  );

  const updateBackend = useCallback(
    async (pos: Position) => {
      try {
        await locationApi.postLocation({
          latitude: pos.lat,
          longitude: pos.lng,
          accuracy: pos.accuracy,
          timestamp: new Date(pos.timestamp).toISOString(),
        });
      } catch {
        // best effort
      }
    },
    [],
  );

  // React to real GPS position changes
  useEffect(() => {
    if (geo.position && !demoMode) {
      setCurrentPosition(geo.position);
      updateBackend(geo.position);
      const { inside, distance, breached, returned } = evaluateGeofence(geo.position);
      if (insideRef.current === null) {
        insideRef.current = inside;
      }
      persistAlert(geo.position, distance, breached, returned);
    }
  }, [geo.position, demoMode, updateBackend, evaluateGeofence, persistAlert]);

  // Device polling
  useEffect(() => {
    const poll = async () => {
      try {
        const data = await deviceApi.getDeviceStatus();
        setDeviceStatus(data);
      } catch {
        setDeviceStatus({ deviceId: '', status: 'offline', lastSeen: null });
      }
    };
    poll();
    const timer = setInterval(poll, 2000);
    return () => clearInterval(timer);
  }, []);

  // Sync geofence from settings/backend on mount
  useEffect(() => {
    (async () => {
      try {
        const gf = await geofenceApi.getGeofence();
        setGeofenceState({
          latitude: gf.latitude,
          longitude: gf.longitude,
          radius: gf.radius,
        });
        insideRef.current = null;
      } catch {
        // use settings defaults
      }
    })();
  }, []);

  // Keep settings in sync with geofence changes
  useEffect(() => {
    const s = getSettings();
    saveSettings({
      ...s,
      geofenceLat: geofence.latitude,
      geofenceLng: geofence.longitude,
      geofenceRadius: geofence.radius,
    });
  }, [geofence]);

  const startTracking = useCallback(() => {
    setGpsTrackingState(true);
  }, []);

  const stopTracking = useCallback(() => {
    setGpsTrackingState(false);
    geo.stop();
  }, [geo]);

  const updatePosition = useCallback((pos: Position) => {
    if (demoMode) {
      setCurrentPosition(pos);
      updateBackend(pos);
      const { distance, breached, returned } = evaluateGeofence(pos);
      persistAlert(pos, distance, breached, returned);
    } else {
      setCurrentPosition(pos);
      updateBackend(pos);
    }
  }, [demoMode, evaluateGeofence, persistAlert, updateBackend]);

  const addAlert = useCallback((alert: Alert) => {
    setAlerts((prev) => {
      const list = [...prev, alert].sort((a, b) => b.timestamp - a.timestamp);
      return list;
    });
    try {
      alertApi.postAlert(alert).catch(() => {});
    } catch {
      // ignore
    }
  }, []);

  const clearAlerts = useCallback(() => {
    setAlerts([]);
    clearStoredAlerts();
    alertApi.clearAlerts().catch(() => {});
  }, []);

  const setGeofence = useCallback((gf: Geofence) => {
    setGeofenceState(gf);
    insideRef.current = null;
    geofenceApi.postGeofence(gf).catch(() => {});
    const s = getSettings();
    saveSettings({
      ...s,
      geofenceLat: gf.latitude,
      geofenceLng: gf.longitude,
      geofenceRadius: gf.radius,
    });
  }, []);

  const setGpsTracking = useCallback((tracking: boolean) => {
    setGpsTrackingState(tracking);
  }, []);

  const value: AppContextType = {
    currentPosition: demoMode
      ? (currentPosition ?? DEFAULT_POSITION)
      : (geo.position ?? currentPosition ?? DEFAULT_POSITION),
    geofence,
    deviceStatus,
    alerts,
    demoMode,
    gpsTracking,
    startTracking,
    stopTracking,
    updatePosition,
    addAlert,
    clearAlerts,
    setGeofence,
    setDemoMode,
    setGpsTracking,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = (): AppContextType => {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return ctx;
};
