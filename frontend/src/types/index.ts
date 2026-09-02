export interface Position {
  lat: number;
  lng: number;
  accuracy: number;
  timestamp: number;
}

export interface Geofence {
  latitude: number;
  longitude: number;
  radius: number;
}

export interface DeviceStatus {
  deviceId: string;
  status: string;
  lastSeen: string | null;
}

export interface Alert {
  id: string;
  time: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  distance: number;
  status: 'BREACHED' | 'SAFE';
  alert: boolean;
  timestamp: number;
}

export interface Settings {
  deviceId: string;
  geofenceLat: number;
  geofenceLng: number;
  geofenceRadius: number;
  gpsInterval: number;
  alertEnabled: boolean;
  buzzerEnabled: boolean;
  demoMode: boolean;
}

export interface AppContextType {
  currentPosition: Position | null;
  geofence: Geofence;
  deviceStatus: DeviceStatus;
  alerts: Alert[];
  demoMode: boolean;
  gpsTracking: boolean;
  startTracking: () => void;
  stopTracking: () => void;
  updatePosition: (pos: Position) => void;
  addAlert: (alert: Alert) => void;
  clearAlerts: () => void;
  setGeofence: (gf: Geofence) => void;
  setDemoMode: (mode: boolean) => void;
  setGpsTracking: (tracking: boolean) => void;
}
