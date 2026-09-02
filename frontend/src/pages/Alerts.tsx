import { useEffect, useState, useMemo } from 'react';
import { useAppContext } from '@/context/AppContext';
import { alertApi } from '@/services/api';
import { clearAlerts as clearStoredAlerts, getAlerts as getStoredAlerts } from '@/utils/storage';
import { Bell, Trash2, RefreshCw, Search } from 'lucide-react';
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Bell size={24} />
            Alert History
          </h1>
          <p className="text-gray-500">All recorded geofence events</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={16} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              className="pl-8 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
            {STATUS_FILTERS.map((f) => (
              <button
                key={f}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  filter === f
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 hover:bg-gray-200'
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

      <div className="bg-white rounded-xl shadow-card border border-gray-100 overflow-hidden animate-scale-in">
        {displayed.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Bell size={48} className="mx-auto mb-3 text-gray-300 animate-float" />
            <p>No alerts recorded</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-ocean-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-ocean-700 uppercase tracking-wider">
                    Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-ocean-700 uppercase tracking-wider">
                    Latitude
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-ocean-700 uppercase tracking-wider">
                    Longitude
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-ocean-700 uppercase tracking-wider">
                    Distance (m)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-ocean-700 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {displayed.map((a: Alert, index: number) => (
                  <tr 
                    key={a.id} 
                    className="hover:bg-ocean-50/50 transition-colors table-row-animate"
                    style={{ animationDelay: `${index * 30}ms` }}
                  >
                    <td className="px-6 py-3 text-sm text-gray-800 whitespace-nowrap">
                      {new Date(a.time).toLocaleString()}
                    </td>
                    <td className="px-6 py-3 text-sm font-mono text-gray-700">
                      {a.latitude.toFixed(6)}
                    </td>
                    <td className="px-6 py-3 text-sm font-mono text-gray-700">
                      {a.longitude.toFixed(6)}
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-700">
                      {a.distance}
                    </td>
                    <td className="px-6 py-3">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          a.alert
                            ? 'bg-red-100 text-red-800'
                            : 'bg-green-100 text-green-800'
                        }`}
                      >
                        {a.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="text-sm text-gray-500">
        Total: {displayed.length} alert(s)
      </div>
    </div>
  );
};

export default AlertsPage;
