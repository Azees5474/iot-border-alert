import { useState, useEffect } from 'react';
import { useAppContext } from '@/context/AppContext';
import useGeolocation from '@/hooks/useGeolocation';
import { Check, X, Play, Pause, Crosshair, Wifi } from 'lucide-react';

const PhoneGPS = () => {
  const { updatePosition, startTracking, stopTracking } = useAppContext();
  const geo = useGeolocation();

  const [permission, setPermission] = useState<'granted' | 'denied' | 'unknown'>('unknown');
  const [gpsStatus, setGpsStatus] = useState<'active' | 'inactive'>('inactive');

  useEffect(() => {
    if (geo.isTracking) {
      setGpsStatus('active');
    } else if (!geo.isTracking) {
      setGpsStatus('inactive');
    }
  }, [geo.isTracking]);

  useEffect(() => {
    if (geo.currentPosition) {
      updatePosition(geo.currentPosition);
    }
  }, [geo.currentPosition, updatePosition]);

  useEffect(() => {
    const checkPermission = async () => {
      if (!navigator.geolocation) {
        setPermission('denied');
        return;
      }
      if ('permissions' in navigator && 'query' in navigator.permissions) {
        try {
          const result = await navigator.permissions.query({ name: 'geolocation' });
          setPermission(result.state === 'granted' ? 'granted' : 'denied');
        } catch {
          setPermission('unknown');
        }
      } else {
        setPermission('unknown');
      }
    };
    checkPermission();
  }, []);

  const handleStart = () => {
    geo.startTracking();
    startTracking();
  };

  const handleStop = () => {
    geo.stopTracking();
    stopTracking();
  };

  const pos = geo.currentPosition;

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-white flex items-center gap-2">
          <Wifi size={22} className="text-signal-cyan" />
          Phone GPS
        </h1>
        <p className="text-ink-500 text-sm">Browser-based GPS tracking for the phone</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <div className="glass-panel rounded-xl p-6 animate-slide-up">
            <h3 className="hud-label mb-4 flex items-center gap-1.5">
              <Crosshair size={14} className="text-signal-cyan" />
              GPS Status
            </h3>
            <div className="space-y-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-ink-500">GPS Permission</span>
                <span
                  className={`font-medium flex items-center gap-1 ${
                    permission === 'granted'
                      ? 'text-status-safe'
                      : permission === 'denied'
                      ? 'text-status-danger'
                      : 'text-status-warn'
                  }`}
                >
                  {permission === 'granted' ? (
                    <Check size={16} />
                  ) : permission === 'denied' ? (
                    <X size={16} />
                  ) : (
                    <Crosshair size={16} />
                  )}{' '}
                  {permission === 'granted'
                    ? 'Granted'
                    : permission === 'denied'
                    ? 'Denied'
                    : 'Unknown'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-ink-500">GPS Status</span>
                <span
                  className={`font-medium flex items-center gap-1.5 ${gpsStatus === 'active' ? 'text-status-safe' : 'text-ink-500'}`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${gpsStatus === 'active' ? 'bg-status-safe pulse-safe' : 'bg-ink-500'}`} />
                  {gpsStatus.toUpperCase()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-ink-500">Accuracy</span>
                <span className="hud-value text-white">{geo.accuracy || 0} m</span>
              </div>
              {geo.error && (
                <div className="text-status-danger text-sm">{geo.error}</div>
              )}
            </div>
          </div>

          <div className="glass-panel rounded-xl p-6 animate-slide-up" style={{ animationDelay: '100ms' }}>
            <h3 className="hud-label mb-4">GPS Coordinates</h3>
            <div className="space-y-3 text-sm">
              <div>
                <span className="text-ink-500">Latitude</span>
                <div className="hud-value text-xl text-white">
                  {pos ? pos.lat.toFixed(6) : '—'}
                </div>
              </div>
              <div>
                <span className="text-ink-500">Longitude</span>
                <div className="hud-value text-xl text-white">
                  {pos ? pos.lng.toFixed(6) : '—'}
                </div>
              </div>
              <div>
                <span className="text-ink-500">Timestamp</span>
                <div className="hud-value text-white">
                  {pos ? new Date(pos.timestamp).toLocaleString() : '—'}
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              className="btn btn-success flex items-center gap-2"
              onClick={handleStart}
              disabled={geo.isTracking || permission === 'denied'}
            >
              <Play size={16} /> Start GPS
            </button>
            <button
              className="btn btn-danger flex items-center gap-2"
              onClick={handleStop}
              disabled={!geo.isTracking}
            >
              <Pause size={16} /> Stop GPS
            </button>
          </div>
        </div>

        <div className="glass-panel rounded-xl p-6 animate-slide-up" style={{ animationDelay: '200ms' }}>
          <h3 className="hud-label mb-4 flex items-center gap-1.5">
            <Crosshair size={14} className="text-signal-cyan" /> Raw Geolocation Data
          </h3>
          {pos ? (
            <div className="space-y-2 text-sm font-mono bg-panel-900 text-ink-300 p-4 rounded-lg overflow-x-auto border border-signal-cyan/10">
              <div>{JSON.stringify({ latitude: pos.lat, longitude: pos.lng }, null, 2)}</div>
              <div>{JSON.stringify({ accuracy: pos.accuracy, timestamp: pos.timestamp }, null, 2)}</div>
            </div>
          ) : (
            <div className="text-ink-500 text-center py-8 text-sm">
              No GPS data available. Start tracking to get coordinates.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PhoneGPS;
