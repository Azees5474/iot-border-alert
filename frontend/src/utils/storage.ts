import type { Alert, Settings } from '../types';

export const STORAGE_KEYS = {
  alerts: 'iot-border-alerts',
  settings: 'iot-border-alert-settings',
};

export function getAlerts(): Alert[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.alerts);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed as Alert[];
    return [];
  } catch {
    return [];
  }
}

export function saveAlert(alert: Alert): Alert {
  const alerts = getAlerts();
  let exists = false;
  const updated = alerts.map((a) => {
    if (a.id === alert.id) {
      exists = true;
      return alert;
    }
    return a;
  });
  if (!exists) {
    updated.push(alert);
  }
  updated.sort((a, b) => b.timestamp - a.timestamp);
  localStorage.setItem(STORAGE_KEYS.alerts, JSON.stringify(updated));
  return alert;
}

export function addAlert(alert: Alert): Alert {
  return saveAlert(alert);
}

export function clearAlerts(): void {
  localStorage.setItem(STORAGE_KEYS.alerts, JSON.stringify([]));
}

export function getSettings(): Settings {
  const defaults: Settings = {
    deviceId: 'ESP32-001',
    geofenceLat: 13.08268,
    geofenceLng: 80.270718,
    geofenceRadius: 100,
    gpsInterval: 2000,
    alertEnabled: true,
    buzzerEnabled: true,
    demoMode: false,
  };
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.settings);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw);
    return { ...defaults, ...parsed };
  } catch {
    return defaults;
  }
}

export function saveSettings(settings: Settings): Settings {
  localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(settings));
  return settings;
}
