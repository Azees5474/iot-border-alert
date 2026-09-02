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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Wind size={24} />
          Geofence Configuration
        </h1>
        <p className="text-gray-500">Set the geofence boundary center and radius</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-card border border-gray-100 p-6 animate-slide-up">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Wind size={18} className="text-ocean-600" />
            Edit Geofence
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Latitude
              </label>
              <input
                type="number"
                step="0.000001"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-ocean-500 focus:border-ocean-500 transition-all"
                value={form.latitude}
                onChange={(e) => setForm({ ...form, latitude: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Longitude
              </label>
              <input
                type="number"
                step="0.000001"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-ocean-500 focus:border-ocean-500 transition-all"
                value={form.longitude}
                onChange={(e) => setForm({ ...form, longitude: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Radius (meters)
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-ocean-500 focus:border-ocean-500 transition-all"
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
          <div className="bg-white rounded-xl shadow-card border border-gray-100 p-6 animate-slide-up" style={{ animationDelay: '100ms' }}>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Current Configuration</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Latitude</span>
                <span className="font-mono font-medium">{geofence.latitude.toFixed(6)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Longitude</span>
                <span className="font-mono font-medium">{geofence.longitude.toFixed(6)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Radius</span>
                <span className="font-mono font-medium">{geofence.radius} m</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-card border border-gray-100 p-6 animate-slide-up" style={{ animationDelay: '200ms' }}>
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <MapPin size={18} className="text-ocean-600" /> Your Position vs Geofence
            </h3>
            {distanceFromPhone ? (
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Distance</span>
                  <span className="font-mono font-medium">{distanceFromPhone.distance} m</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Status</span>
                  <span className={distanceFromPhone.inside ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                    {distanceFromPhone.inside ? 'Inside' : 'Outside'}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 text-sm">Start tracking to see your position relative to this geofence.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Geofence;
