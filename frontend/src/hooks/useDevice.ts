import { useState, useEffect, useRef } from 'react';
import { deviceApi } from '@/services/api';
import type { DeviceStatus } from '@/types';

export const useDevice = (pollIntervalMs = 2000) => {
  const [deviceStatus, setDeviceStatus] = useState<DeviceStatus>({
    deviceId: '',
    status: 'offline',
    lastSeen: null,
  });
  const [lastSeen, setLastSeen] = useState<number>(Date.now());
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const data = await deviceApi.getDeviceStatus();
      setDeviceStatus(data);
      setLastSeen(Date.now());
    } catch {
      setDeviceStatus({ deviceId: '', status: 'offline', lastSeen: null });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    timerRef.current = setInterval(fetchStatus, pollIntervalMs);
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [pollIntervalMs]);

  return { deviceStatus, lastSeen, loading, refetch: fetchStatus };
};

export default useDevice;
