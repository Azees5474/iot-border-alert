import { useEffect, useState, useMemo } from 'react';
import { useAppContext } from '@/context/AppContext';
import { alertApi } from '@/services/api';
import { clearAlerts as clearStoredAlerts, getAlerts as getStoredAlerts } from '@/utils/storage';
import { Bell, Trash2, RefreshCw, Search, ShieldCheck, MapPinned } from 'lucide-react';
import type { Alert } from '@/types';

const STATUS_FILTERS = ['ALL', 'BREACHED', 'SAFE'] as const;

const AlertsPage = () => {
  const { alerts, clearAlerts } = useAppContext();
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'ALL' | 'BREACHED' | 'SAFE'>('ALL');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      await alertApi.getAlerts();
      getStoredAlerts();
    } catch {
      getStoredAlerts();
    } finally {
      setLoading(false);
    }
  };

  const displayed = useMemo(() => {
    return alerts
      .filter((a) => {
        if (filter !== 'ALL' && a.status !== filter) return false;
        if (search) {
          const term = search.toLowerCase();
          return (
            a.latitude.toString().includes(term) ||
            a.longitude.toString().includes(term) ||
            a.status.toLowerCase().includes(term) ||
            a.distance.toString().includes(term)
          );
        }
        return true;
      })
      .sort((a, b) => b.timestamp - a.timestamp);
  }, [alerts, filter, search]);

  const handleClear = async () => {
    if (!window.confirm('Clear all alert history?')) return;
    clearAlerts();
    clearStoredAlerts();
    try {
      await alertApi.clearAlerts();
    } catch {
      // ignore
    }
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-white flex items-center gap-2">
            <Bell size={22} className="text-signal-cyan" />
            Alert Center
          </h1>
          <p className="text-ink-500 text-sm">All recorded geofence events</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search size={16} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-500" />
            <input
              type="text"
              placeholder="Search..."
              className="pl-8 pr-3 py-2 bg-panel-900 border border-signal-cyan/15 rounded-lg text-sm text-white placeholder:text-ink-500 focus:outline-none focus:ring-2 focus:ring-signal-cyan/50"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-1 bg-panel-900 rounded-lg p-1 border border-signal-cyan/10">
            {STATUS_FILTERS.map((f) => (
              <button
                key={f}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                  filter === f
                    ? 'bg-signal-cyan/20 text-signal-cyan'
                    : 'text-ink-300 hover:text-white'
                }`}
                onClick={() => setFilter(f)}
              >
                {f}
              </button>
            ))}
          </div>
          <button
            className="btn btn-danger flex items-center gap-2"
            onClick={handleClear}
            disabled={displayed.length === 0}
          >
            <Trash2 size={16} />
            Clear History
          </button>
          <button
            className="btn btn-outline"
            onClick={() => {
              alertApi.getAlerts().then(() => {});
            }}
            disabled={loading}
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {displayed.length === 0 ? (
        <div className="glass-panel rounded-xl p-10 text-center animate-scale-in">
          <ShieldCheck size={40} className="mx-auto mb-3 text-status-safe" />
          <div className="font-display font-semibold text-lg text-white">No Active Alerts</div>
          <p className="text-ink-500 text-sm mt-1">System operating normally.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 animate-scale-in">
          {displayed.map((a: Alert, index: number) => {
            const isBreach = a.status === 'BREACHED';
            return (
              <div
                key={a.id}
                className={`glass-panel rounded-xl p-4 border-l-2 table-row-animate ${
                  isBreach ? 'border-l-status-danger/70' : 'border-l-status-safe/70'
                }`}
                style={{ animationDelay: `${index * 30}ms` }}
              >
                <div className="flex items-center justify-between mb-3">
                  <span
                    className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${
                      isBreach ? 'bg-status-danger/15 text-status-danger' : 'bg-status-safe/15 text-status-safe'
                    }`}
                  >
                    {isBreach ? <Bell size={12} /> : <ShieldCheck size={12} />}
                    {isBreach ? 'BORDER ALERT' : 'RETURNED TO SAFE ZONE'}
                  </span>
                  <span className="hud-label text-ink-500">{new Date(a.time).toLocaleTimeString()}</span>
                </div>

                <div className="flex items-start gap-2 mb-2">
                  <MapPinned size={14} className="text-ink-500 mt-0.5 flex-shrink-0" />
                  <div className="hud-value text-sm text-ink-100">
                    {a.latitude.toFixed(6)}° , {a.longitude.toFixed(6)}°
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-ink-500 pt-2 border-t border-signal-cyan/10">
                  <span>Distance from boundary</span>
                  <span className="hud-value text-ink-300">{a.distance} m</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="text-xs text-ink-500 hud-label">
        Total: {displayed.length} alert(s)
      </div>
    </div>
  );
};

export default AlertsPage;
