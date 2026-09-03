import axios from 'axios';
import type { Geofence, Alert, DeviceStatus } from '../types';

const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
const baseURL = API_URL ? `${API_URL}/api` : '/api';

const api = axios.create({
  baseURL,
  timeout: 10000,
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API error:', error.message);
    return Promise.reject(error);
  },
);

export const locationApi = {
  getLocation: async () => {
    const res = await api.get('/location');
    return res.data;
  },
  postLocation: async (data: {
    latitude: number;
    longitude: number;
    accuracy: number;
    timestamp: string;
  }) => {
    const res = await api.post('/location', data);
    return res.data;
  },
};

export const geofenceApi = {
  getGeofence: async () => {
    const res = await api.get('/geofence');
    return res.data as Geofence;
  },
  postGeofence: async (data: Partial<Geofence>) => {
    const res = await api.post('/geofence', data);
    return res.data as Geofence;
  },
};

export const statusApi = {
  getStatus: async () => {
    const res = await api.get('/status');
    return res.data;
  },
};

export const deviceApi = {
  postDeviceStatus: async (data: { deviceId: string; status: string }) => {
    const res = await api.post('/device/status', data);
    return res.data as DeviceStatus & { ok: boolean };
  },
  postHeartbeat: async (data: { deviceId: string; status: string }) => {
    const res = await api.post('/device/heartbeat', data);
    return res.data;
  },
  getDeviceStatus: async () => {
    const res = await api.get('/device/status');
    return res.data as DeviceStatus;
  },
  setBuzzer: async (data: { action: 'on' | 'off'; deviceId?: string }) => {
    const res = await api.post('/device/buzzer', data);
    return res.data;
  },
};

export const alertApi = {
  getAlerts: async () => {
    const res = await api.get('/alerts');
    return res.data as Alert[];
  },
  postAlert: async (data: Partial<Alert>) => {
    const res = await api.post('/alert', data);
    return res.data as Alert;
  },
  clearAlerts: async () => {
    const res = await api.delete('/alerts');
    return res.data;
  },
};

export default api;
