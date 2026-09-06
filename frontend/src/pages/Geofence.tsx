import { useState, useEffect } from 'react';
import { useAppContext } from '@/context/AppContext';
import { geofenceApi } from '@/services/api';
import { checkGeofence } from '@/utils/geofence';
import { Save, RefreshCw, Wind, MapPin, Check, Crosshair } from 'lucide-react';

const RADIUS_OPTIONS = [2, 5, 20, 50, 100, 200, 500, 1000];

const Geofence = () => {
  const { geofence, setGeofence, currentPosition } = useAppContext();
  const [form, setForm] = useState({
    latitude: geofence.latitude,
    longitude: geofence.longitude,
    radius: geofence.radius,
  });
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setForm({
      latitude: geofence.latitude,
      longitude: geofence.longitude,
      radius: geofence.radius,
    });
  }, [geofence]);

  const handleSave = async () => {
    setLoading(true);
    setSaved(false);
    try {
      const updated = await geofenceApi.postGeofence({
        latitude: Number(form.latitude),
        longitude: Number(form.longitude),
        radius: Number(form.radius),
      });
      setGeofence(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      alert('Failed to save geofence');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    const defaults = {
      latitude: 13.08268,
      longitude: 80.270718,
      radius: 100,
    };
    setForm(defaults);
    setLoading(true);
    try {
      const updated = await geofenceApi.postGeofence(defaults);
      setGeofence(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      // still update local
    } finally {
      setLoading(false);
    }
  };

  const handleSetToCurrentLocation = () => {
    if (!currentPosition) {
      alert('No GPS position available. Start tracking first.');
      return;
    }
    setForm({
      latitude: Number(currentPosition.lat.toFixed(6)),
      longitude: Number(currentPosition.lng.toFixed(6)),
      radius: form.radius,
    });
  };

  const distanceFromPhone = currentPosition
    ? checkGeofence(
        currentPosition.lat,
        currentPosition.lng,
        form.latitude,
        form.longitude,
        form.radius,
      )
    : null;

  const inputClass =
    'w-full px-3 py-2 bg-panel-900 border border-signal-cyan/15 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-signal-cyan/50 focus:border-signal-cyan/50 transition-all font-mono text-sm';

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-white flex items-center gap-2">
          <Wind size={22} className="text-signal-cyan" />
          Geofence Configuration
        </h1>
        <p className="text-ink-500 text-sm">Set the geofence boundary center and radius</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-panel rounded-xl p-6 animate-slide-up">
          <h3 className="hud-label mb-4 flex items-center gap-1.5">
            <Wind size={14} className="text-signal-cyan" />
            Edit Geofence
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-ink-500 mb-1">Latitude</label>
              <input
                type="number"
                step="0.000001"
                className={inputClass}
                value={form.latitude}
                onChange={(e) => setForm({ ...form, latitude: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="block text-xs text-ink-500 mb-1">Longitude</label>
              <input
                type="number"
                step="0.000001"
                className={inputClass}
                value={form.longitude}
                onChange={(e) => setForm({ ...form, longitude: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="block text-xs text-ink-500 mb-1">Radius (meters)</label>
              <select
                className={inputClass}
                value={form.radius}
                onChange={(e) => setForm({ ...form, radius: Number(e.target.value) })}
              >
                {RADIUS_OPTIONS.map((r) => (
                  <option key={r} value={r}>
                    {r} m
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              className="btn btn-primary flex items-center gap-2"
              onClick={handleSave}
              disabled={loading}
            >
              {loading ? <RefreshCw size={16} className="animate-spin" /> : saved ? <Check size={16} /> : <Save size={16} />}
              {loading ? 'Saving...' : saved ? 'Saved!' : 'Save Geofence'}
            </button>
            <button
              className="btn btn-outline flex items-center gap-2"
              onClick={handleSetToCurrentLocation}
              disabled={!currentPosition}
            >
              <Crosshair size={16} />
              Use Current Location
            </button>
            <button className="btn btn-outline" onClick={handleReset}>
              Reset to Defaults
            </button>
          </div>
        </div>

        <div className="space-y-6">
          <div className="glass-panel rounded-xl p-6 animate-slide-up" style={{ animationDelay: '100ms' }}>
            <h3 className="hud-label mb-4">Current Configuration</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-ink-500">Latitude</span>
                <span className="hud-value">{geofence.latitude.toFixed(6)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-500">Longitude</span>
                <span className="hud-value">{geofence.longitude.toFixed(6)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-500">Radius</span>
                <span className="hud-value">{geofence.radius} m</span>
              </div>
            </div>
          </div>

          <div className="glass-panel rounded-xl p-6 animate-slide-up" style={{ animationDelay: '200ms' }}>
            <h3 className="hud-label mb-4 flex items-center gap-1.5">
              <MapPin size={14} className="text-signal-cyan" /> Your Position vs Geofence
            </h3>
            {distanceFromPhone ? (
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-ink-500">Distance</span>
                  <span className="hud-value">{distanceFromPhone.distance} m</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-ink-500">Status</span>
                  <span
                    className={`font-semibold px-2.5 py-0.5 rounded-full text-xs ${
                      distanceFromPhone.inside
                        ? 'bg-status-safe/15 text-status-safe'
                        : 'bg-status-danger/15 text-status-danger'
                    }`}
                  >
                    {distanceFromPhone.inside ? 'INSIDE' : 'OUTSIDE'}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-ink-500 text-sm">Start tracking to see your position relative to this geofence.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Geofence;
