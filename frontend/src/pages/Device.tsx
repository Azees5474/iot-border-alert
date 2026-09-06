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
  const { deviceStatus: polledStatus, lastSeen, refetch } = useDevice(5000);
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

  const infoRow = (label: string, node: React.ReactNode) => (
    <div>
      <span className="text-xs text-ink-500">{label}</span>
      <div className="mt-0.5">{node}</div>
    </div>
  );

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-white flex items-center gap-2">
          <Smartphone size={22} className="text-signal-cyan" />
          ESP32 Device
        </h1>
        <p className="text-ink-500 text-sm">IoT border controller status</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-panel rounded-xl p-6 card-hover animate-slide-up">
            <h3 className="hud-label mb-4 flex items-center gap-1.5">
              <Smartphone size={14} className="text-signal-cyan" />
              Device Information
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              {infoRow('Device ID', <span className="hud-value font-medium text-white">{status.deviceId || 'ESP32-001'}</span>)}
              {infoRow(
                'Connection',
                <div className="flex items-center gap-2">
                  <span className={`inline-block w-2 h-2 rounded-full ${online ? 'bg-status-safe pulse-safe' : 'bg-status-danger'}`} />
                  <span className={online ? 'text-status-safe font-medium' : 'text-status-danger font-medium'}>
                    {online ? 'ONLINE' : 'OFFLINE'}
                  </span>
                </div>,
              )}
              {infoRow(
                'Wi-Fi',
                <div className="flex items-center gap-2">
                  <Wifi size={16} className="text-signal-blue" />
                  <span className="font-medium text-status-safe">CONNECTED</span>
                </div>,
              )}
              {infoRow('Last Seen', <span className="hud-value text-white">{lastSeenStr}</span>)}
              {infoRow(
                'OLED Display',
                <div className="flex items-center gap-2">
                  <Zap size={16} className="text-status-warn" />
                  <span className="font-medium text-status-safe">CONNECTED</span>
                </div>,
              )}
              {infoRow(
                'Buzzer',
                <div className="flex items-center gap-2">
                  <Power size={16} className="text-ink-300" />
                  <span className={buzzerOn ? 'text-status-danger font-medium alert-pulse' : 'text-status-safe font-medium'}>
                    {buzzerOn ? 'ACTIVE' : 'READY'}
                  </span>
                </div>,
              )}
              {infoRow(
                'GPS Source',
                <div className="flex items-center gap-2">
                  <MapPin size={16} className="text-signal-blue" />
                  <span className="font-medium text-signal-blue">SMARTPHONE</span>
                </div>,
              )}
            </div>
          </div>

          <div className="glass-panel rounded-xl p-6 animate-slide-up" style={{ animationDelay: '100ms' }}>
            <h3 className="hud-label mb-4">Actions</h3>
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
              <div className="mt-4 p-3 bg-status-danger/10 rounded-lg border border-status-danger/30 animate-pulse-slow">
                <span className="text-status-danger font-medium flex items-center gap-2 text-sm">
                  <Bell size={16} /> Buzzer is currently ACTIVE (test mode)
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="glass-panel rounded-xl p-6">
            <h3 className="hud-label mb-4">Geofence Status</h3>
            <div className="space-y-3 text-sm">
              <div>
                <span className="text-ink-500">Center</span>
                <div className="hud-value text-white">
                  {geofence.latitude.toFixed(6)}, {geofence.longitude.toFixed(6)}
                </div>
              </div>
              <div>
                <span className="text-ink-500">Radius</span>
                <div className="hud-value text-white">{geofence.radius} m</div>
              </div>
              <div>
                <span className="text-ink-500">Boundary Breach</span>
                <div className={`hud-value ${geofenceDistance > geofence.radius ? 'text-status-danger' : 'text-status-safe'}`}>
                  {geofenceDistance > geofence.radius ? 'ALERT' : 'SAFE'}
                </div>
              </div>
            </div>
          </div>

          <div className="glass-panel rounded-xl p-6">
            <h3 className="hud-label mb-4">Alert Status</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-ink-500">Current Alert</span>
                <span
                  className={`font-medium ${geofenceDistance > geofence.radius ? 'text-status-danger' : 'text-status-safe'}`}
                >
                  {geofenceDistance > geofence.radius ? 'TRIGGERED' : 'CLEAR'}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-ink-500">Buzzer Status</span>
                <span className={buzzerOn ? 'text-status-danger font-medium' : 'text-ink-300'}>
                  {buzzerOn ? 'ON' : 'OFF'}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-ink-500">OLED Display</span>
                <span className="text-status-safe font-medium">ACTIVE</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Device;
