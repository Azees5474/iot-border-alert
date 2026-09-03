import { useEffect, useState } from 'react';
import { useAppContext } from '@/context/AppContext';
import useDevice from '@/hooks/useDevice';
import { deviceApi } from '@/services/api';
import {
  Smartphone,
  Wifi,
  Power,
  Bell,
  Zap,
  MapPin,
  Send,
  RefreshCw,
} from 'lucide-react';

const Device = () => {
  const { geofence, currentPosition } = useAppContext();
  const { deviceStatus: polledStatus, lastSeen, refetch } = useDevice(2000);
  const [buzzerOn, setBuzzerOn] = useState(false);
  const [sending, setSending] = useState(false);

  const status = polledStatus;
  const online = status.status === 'online' || status.status === 'connected';
  const lastSeenStr = lastSeen ? new Date(lastSeen).toLocaleString() : '—';

  const handleTestBuzzer = async () => {
    setSending(true);
    try {
      const next = !buzzerOn;
      await deviceApi.setBuzzer({ action: next ? 'on' : 'off', deviceId: status.deviceId || 'ESP32-001' });
      setBuzzerOn(next);
      setTimeout(() => setSending(false), 500);
    } catch {
      setSending(false);
    }
  };

  const handleRegisterDevice = async () => {
    setSending(true);
    try {
      await deviceApi.postDeviceStatus({ deviceId: 'ESP32-001', status: 'online' });
    } catch {
      // ignore
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    handleRegisterDevice();
  }, []);

  const geofenceDistance = currentPosition
    ? Math.round(
        Math.sqrt(
          (currentPosition.lat - geofence.latitude) ** 2 +
            (currentPosition.lng - geofence.longitude) ** 2,
        ) * 111000,
      )
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Smartphone size={24} />
          ESP32 Device
        </h1>
        <p className="text-gray-500">IoT border controller status</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-card border border-gray-100 p-6 card-hover animate-slide-up" style={{ animationDelay: '0ms' }}>
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Smartphone size={18} className="text-ocean-600" />
              Device Information
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Device ID</span>
                <div className="font-medium text-gray-800">{status.deviceId || 'ESP32-001'}</div>
              </div>
              <div>
                <span className="text-gray-500">Connection</span>
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-block w-2 h-2 rounded-full ${online ? 'bg-green-500 animate-pulse-slow' : 'bg-red-500'}`}
                  />
                  <span className={online ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                    {online ? 'ONLINE' : 'OFFLINE'}
                  </span>
                </div>
              </div>
              <div>
                <span className="text-gray-500">Wi-Fi</span>
                <div className="flex items-center gap-2">
                  <Wifi size={16} className="text-blue-500" />
                  <span className="font-medium text-green-600">CONNECTED</span>
                </div>
              </div>
              <div>
                <span className="text-gray-500">IP Address</span>
                <div className="font-medium text-gray-800 font-mono">192.168.1.100</div>
              </div>
              <div>
                <span className="text-gray-500">Last Seen</span>
                <div className="font-medium text-gray-800">{lastSeenStr}</div>
              </div>
              <div>
                <span className="text-gray-500">OLED Display</span>
                <div className="flex items-center gap-2">
                  <Zap size={16} className="text-yellow-500" />
                  <span className="font-medium text-green-600">CONNECTED</span>
                </div>
              </div>
              <div>
                <span className="text-gray-500">Buzzer</span>
                <div className="flex items-center gap-2">
                  <Power size={16} />
                  <span className={buzzerOn ? 'text-red-600 font-medium animate-pulse-fast' : 'text-green-600 font-medium'}>
                    {buzzerOn ? 'ACTIVE' : 'READY'}
                  </span>
                </div>
              </div>
              <div>
                <span className="text-gray-500">GPS Source</span>
                <div className="flex items-center gap-2">
                  <MapPin size={16} className="text-blue-500" />
                  <span className="font-medium text-blue-600">SMARTPHONE</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-card border border-gray-100 p-6 animate-slide-up" style={{ animationDelay: '100ms' }}>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Actions</h3>
            <div className="flex flex-wrap gap-3">
              <button
                className={`btn ${buzzerOn ? 'btn-danger' : 'btn-warning'} flex items-center gap-2`}
                onClick={handleTestBuzzer}
                disabled={sending}
              >
                <Send size={16} />
                {sending ? 'Sending...' : buzzerOn ? 'Stop Buzzer' : 'Test Buzzer'}
              </button>
              <button
                className="btn btn-outline flex items-center gap-2"
                onClick={refetch}
              >
                <RefreshCw size={16} />
                Refresh Status
              </button>
              <button
                className="btn btn-outline flex items-center gap-2"
                onClick={handleRegisterDevice}
                disabled={sending}
              >
                <Smartphone size={16} />
                Register Device
              </button>
            </div>
            {buzzerOn && (
              <div className="mt-4 p-3 bg-red-50 rounded-lg border border-red-200 animate-pulse-slow">
                <span className="text-red-700 font-medium flex items-center gap-2">
                  <Bell size={16} /> Buzzer is currently ACTIVE (test mode)
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Geofence Status</h3>
            <div className="space-y-3 text-sm">
              <div>
                <span className="text-gray-500">Center</span>
                <div className="font-mono text-gray-800">
                  {geofence.latitude.toFixed(6)}, {geofence.longitude.toFixed(6)}
                </div>
              </div>
              <div>
                <span className="text-gray-500">Radius</span>
                <div className="font-mono text-gray-800">{geofence.radius} m</div>
              </div>
              <div>
                <span className="text-gray-500">Boundary Breach</span>
                <div className="font-mono text-gray-800">{geofenceDistance > geofence.radius ? 'ALERT' : 'SAFE'}</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Alert Status</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Current Alert</span>
                <span
                  className={`font-medium ${geofenceDistance > geofence.radius ? 'text-red-600' : 'text-green-600'}`}
                >
                  {geofenceDistance > geofence.radius ? 'TRIGGERED' : 'CLEAR'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Buzzer Status</span>
                <span className={buzzerOn ? 'text-red-600 font-medium' : 'text-gray-600'}>
                  {buzzerOn ? 'ON' : 'OFF'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">OLED Display</span>
                <span className="text-green-600 font-medium">ACTIVE</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Device;
