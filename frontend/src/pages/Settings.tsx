import { useState, useEffect, useCallback } from 'react';
import { useAppContext } from '@/context/AppContext';
import { geofenceApi } from '@/services/api';
import { saveSettings, getSettings } from '@/utils/storage';
import { Save, RefreshCw, Settings as SettingsIcon, Smartphone, Wind, ToggleLeft, ToggleRight, Monitor } from 'lucide-react';
import type { Settings, Geofence } from '@/types';

const RADIUS_OPTIONS = [2, 5, 20, 50, 100, 200, 500, 1000];
const INTERVAL_OPTIONS = [1000, 2000, 5000, 10000];

const inputClass =
  'w-full px-3 py-2 bg-panel-900 border border-signal-cyan/15 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-signal-cyan/50 focus:border-signal-cyan/50 transition-all text-sm';

const SettingsPanel = ({
  title,
  icon,
  children,
  delay = 0,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  delay?: number;
}) => (
  <div className="glass-panel rounded-xl p-6 animate-slide-up" style={{ animationDelay: `${delay}ms` }}>
    <h3 className="hud-label mb-4 flex items-center gap-1.5">
      {icon}
      {title}
    </h3>
    {children}
  </div>
);

const ToggleRow = ({
  label,
  description,
  active,
  onClick,
  activeClass = 'bg-signal-cyan/15 text-signal-cyan',
}: {
  label: string;
  description: string;
  active: boolean;
  onClick: () => void;
  activeClass?: string;
}) => (
  <div className="flex items-center justify-between">
    <div>
      <span className="font-medium text-ink-100 text-sm">{label}</span>
      <p className="text-xs text-ink-500">{description}</p>
    </div>
    <button
      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all text-sm ${
        active ? activeClass : 'bg-panel-900 text-ink-500'
      }`}
      onClick={onClick}
    >
      {active ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
      {active ? 'Enabled' : 'Disabled'}
    </button>
  </div>
);

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
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-white flex items-center gap-2">
          <SettingsIcon size={22} className="text-signal-cyan" />
          Settings
        </h1>
        <p className="text-ink-500 text-sm">Configure device, geofence, and application preferences</p>
      </div>

      <SettingsPanel title="Device" icon={<Smartphone size={14} className="text-signal-cyan" />}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-ink-500 mb-1">Device ID</label>
            <input
              type="text"
              className={inputClass}
              value={form.deviceId}
              onChange={(e) => setForm({ ...form, deviceId: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-xs text-ink-500 mb-1">GPS Update Interval (ms)</label>
            <select
              className={inputClass}
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
      </SettingsPanel>

      <SettingsPanel title="Geofence" icon={<Wind size={14} className="text-signal-cyan" />} delay={80}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs text-ink-500 mb-1">Latitude</label>
            <input
              type="number"
              step="0.000001"
              className={inputClass}
              value={form.geofenceLat}
              onChange={(e) => setForm({ ...form, geofenceLat: Number(e.target.value) })}
            />
          </div>
          <div>
            <label className="block text-xs text-ink-500 mb-1">Longitude</label>
            <input
              type="number"
              step="0.000001"
              className={inputClass}
              value={form.geofenceLng}
              onChange={(e) => setForm({ ...form, geofenceLng: Number(e.target.value) })}
            />
          </div>
          <div>
            <label className="block text-xs text-ink-500 mb-1">Radius</label>
            <select
              className={inputClass}
              value={form.geofenceRadius}
              onChange={(e) => setForm({ ...form, geofenceRadius: Number(e.target.value) })}
            >
              {RADIUS_OPTIONS.map((r) => (
                <option key={r} value={r}>
                  {r} m
                </option>
              ))}
            </select>
          </div>
        </div>
      </SettingsPanel>

      <SettingsPanel title="Toggles" icon={<Monitor size={14} className="text-signal-cyan" />} delay={160}>
        <div className="space-y-4">
          <ToggleRow
            label="Alert Enabled"
            description="Enable breach alerts"
            active={form.alertEnabled}
            onClick={() => handleToggle('alertEnabled')}
          />
          <ToggleRow
            label="Buzzer Enabled"
            description="Sound buzzer on breach"
            active={form.buzzerEnabled}
            onClick={() => handleToggle('buzzerEnabled')}
          />
          <ToggleRow
            label="Demo Mode"
            description="Simulate GPS positions for presentations"
            active={form.demoMode}
            activeClass="bg-status-warn/15 text-status-warn"
            onClick={() => handleToggle('demoMode')}
          />
        </div>
      </SettingsPanel>

      <div className="flex gap-3">
        <button
          className="btn btn-primary flex items-center gap-2"
          onClick={handleSave}
          disabled={loading}
        >
          {loading ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
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
