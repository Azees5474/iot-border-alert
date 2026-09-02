import { useState, useEffect, useCallback } from 'react';
import { useAppContext } from '@/context/AppContext';
import { geofenceApi } from '@/services/api';
import { saveSettings, getSettings } from '@/utils/storage';
import { Save, RefreshCw, Settings as SettingsIcon, Smartphone, Wind, ToggleLeft, ToggleRight, Monitor } from 'lucide-react';
import type { Settings, Geofence } from '@/types';

const RADIUS_OPTIONS = [2, 5, 20, 50, 100, 200, 500, 1000];
const INTERVAL_OPTIONS = [1000, 2000, 5000, 10000];

const SettingsPage = () => {
  const { setGeofence, setDemoMode } = useAppContext();
  const [form, setForm] = useState<Settings>(getSettings());
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleToggle = (field: keyof Settings) => {
    setForm((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const handleSave = useCallback(async () => {
    setLoading(true);
    setSaved(false);
    try {
      saveSettings(form);
      const gf: Geofence = {
        latitude: form.geofenceLat,
        longitude: form.geofenceLng,
        radius: form.geofenceRadius,
      };
      await geofenceApi.postGeofence(gf);
      setGeofence(gf);
      setDemoMode(form.demoMode);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      alert('Failed to save settings');
    } finally {
      setLoading(false);
    }
  }, [form, setGeofence, setDemoMode]);

  const handleReset = useCallback(() => {
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
    setForm(defaults);
    saveSettings(defaults);
    setGeofence({
      latitude: defaults.geofenceLat,
      longitude: defaults.geofenceLng,
      radius: defaults.geofenceRadius,
    });
    setDemoMode(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }, [setGeofence, setDemoMode]);

  useEffect(() => {
    const s = getSettings();
    setForm(s);
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <SettingsIcon size={24} />
          Settings
        </h1>
        <p className="text-gray-500">Configure device, geofence, and application preferences</p>
      </div>

      <div className="bg-white rounded-xl shadow-card border border-gray-100 p-6 animate-slide-up">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Smartphone size={18} className="text-ocean-600" />
          Device
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Device ID</label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-ocean-500 focus:border-ocean-500 transition-all"
              value={form.deviceId}
              onChange={(e) => setForm({ ...form, deviceId: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">GPS Update Interval (ms)</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-ocean-500 focus:border-ocean-500 transition-all"
              value={form.gpsInterval}
              onChange={(e) => setForm({ ...form, gpsInterval: Number(e.target.value) })}
            >
              {INTERVAL_OPTIONS.map((i) => (
                <option key={i} value={i}>
                  {i} ms
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-card border border-gray-100 p-6 animate-slide-up" style={{ animationDelay: '100ms' }}>
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Wind size={18} className="text-ocean-600" />
          Geofence
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
            <input
              type="number"
              step="0.000001"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-ocean-500 focus:border-ocean-500 transition-all"
              value={form.geofenceLat}
              onChange={(e) =>
                setForm({ ...form, geofenceLat: Number(e.target.value) })
              }
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
            <input
              type="number"
              step="0.000001"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-ocean-500 focus:border-ocean-500 transition-all"
              value={form.geofenceLng}
              onChange={(e) =>
                setForm({ ...form, geofenceLng: Number(e.target.value) })
              }
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Radius</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-ocean-500 focus:border-ocean-500 transition-all"
              value={form.geofenceRadius}
              onChange={(e) =>
                setForm({ ...form, geofenceRadius: Number(e.target.value) })
              }
            >
              {RADIUS_OPTIONS.map((r) => (
                <option key={r} value={r}>
                  {r} m
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-card border border-gray-100 p-6 animate-slide-up" style={{ animationDelay: '200ms' }}>
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Monitor size={18} className="text-ocean-600" />
          Toggles
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="font-medium text-gray-700">Alert Enabled</span>
              <p className="text-sm text-gray-500">Enable breach alerts</p>
            </div>
            <button
              className={`flex items-center gap-2 px-3 py-1 rounded-lg transition-all ${
                form.alertEnabled
                  ? 'bg-ocean-100 text-ocean-700'
                  : 'bg-gray-100 text-gray-500'
              }`}
              onClick={() => handleToggle('alertEnabled')}
            >
              {form.alertEnabled ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
              {form.alertEnabled ? 'Enabled' : 'Disabled'}
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <span className="font-medium text-gray-700">Buzzer Enabled</span>
              <p className="text-sm text-gray-500">Sound buzzer on breach</p>
            </div>
            <button
              className={`flex items-center gap-2 px-3 py-1 rounded-lg transition-all ${
                form.buzzerEnabled
                  ? 'bg-ocean-100 text-ocean-700'
                  : 'bg-gray-100 text-gray-500'
              }`}
              onClick={() => handleToggle('buzzerEnabled')}
            >
              {form.buzzerEnabled ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
              {form.buzzerEnabled ? 'Enabled' : 'Disabled'}
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <span className="font-medium text-gray-700">Demo Mode</span>
              <p className="text-sm text-gray-500">Simulate GPS positions for presentations</p>
            </div>
            <button
              className={`flex items-center gap-2 px-3 py-1 rounded-lg transition-all ${
                form.demoMode
                  ? 'bg-fishing-100 text-fishing-700'
                  : 'bg-gray-100 text-gray-500'
              }`}
              onClick={() => handleToggle('demoMode')}
            >
              {form.demoMode ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
              {form.demoMode ? 'Enabled' : 'Disabled'}
            </button>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          className="btn btn-primary flex items-center gap-2"
          onClick={handleSave}
          disabled={loading}
        >
          {loading ? <RefreshCw size={16} className="animate-spin" /> : saved ? <Save size={16} /> : <Save size={16} />}
          {loading ? 'Saving...' : saved ? 'Saved!' : 'Save Settings'}
        </button>
        <button className="btn btn-outline flex items-center gap-2" onClick={handleReset}>
          <RefreshCw size={16} />
          Reset to Defaults
        </button>
      </div>
    </div>
  );
};

export default SettingsPage;
