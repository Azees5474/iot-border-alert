import { Link } from 'react-router-dom';
import { Satellite, Cpu, ShieldCheck, BellRing, ArrowRight } from 'lucide-react';
import { useAppContext } from '@/context/AppContext';
import { checkGeofence } from '@/utils/geofence';
import MaritimeHero from '@/components/MaritimeHero';
import StatusCard from '@/components/StatusCard';
import MapView from '@/components/MapView';

const Dashboard = () => {
  const { currentPosition, geofence, deviceStatus, alerts, gpsTracking, demoMode } = useAppContext();

  const gpsActive = gpsTracking || demoMode;

  const geofenceResult = currentPosition
    ? checkGeofence(currentPosition.lat, currentPosition.lng, geofence.latitude, geofence.longitude, geofence.radius)
    : null;

  const deviceOnline = deviceStatus.status === 'online' || deviceStatus.status === 'connected';
  const recentAlerts = alerts.slice(0, 4);
  const breachCount = alerts.filter((a) => a.status === 'BREACHED').length;

  const center: [number, number] = currentPosition
    ? [currentPosition.lat, currentPosition.lng]
    : [geofence.latitude, geofence.longitude];

  return (
    <div>
      <MaritimeHero />

      <div className="p-4 md:p-6 lg:p-8 space-y-8">
        {/* SYSTEM OVERVIEW */}
        <section id="system-overview" className="scroll-mt-20">
          <div className="hud-label mb-3">System Overview</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatusCard
              title="GPS Signal"
              icon={<Satellite size={16} />}
              status={gpsActive ? 'active' : 'inactive'}
              value={gpsActive ? 'ACTIVE' : 'IDLE'}
              subtext={
                currentPosition
                  ? `${currentPosition.lat.toFixed(6)}, ${currentPosition.lng.toFixed(6)}`
                  : 'No fix yet'
              }
              delay={0}
            />
            <StatusCard
              title="Device Status"
              icon={<Cpu size={16} />}
              status={deviceOnline ? 'online' : 'offline'}
              value={deviceOnline ? 'ONLINE' : 'OFFLINE'}
              subtext={deviceStatus.deviceId || 'No device registered'}
              delay={60}
            />
            <StatusCard
              title="Geofence"
              icon={<ShieldCheck size={16} />}
              status={geofenceResult ? (geofenceResult.inside ? 'safe' : 'outside') : 'unknown'}
              value={geofenceResult ? (geofenceResult.inside ? 'SAFE' : 'BREACH') : 'N/A'}
              subtext={geofenceResult ? `${geofenceResult.distance} m from center` : 'Awaiting position'}
              delay={120}
            />
            <StatusCard
              title="Active Alerts"
              icon={<BellRing size={16} />}
              status={breachCount > 0 ? 'alert' : 'safe'}
              value={String(alerts.length).padStart(2, '0')}
              subtext={breachCount > 0 ? `${breachCount} breach event(s)` : 'No active alerts'}
              delay={180}
            />
          </div>
        </section>

        {/* LIVE TRACKING PREVIEW */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <div className="hud-label">Live Vessel Tracking</div>
            <Link to="/tracking" className="text-xs text-signal-cyan hover:text-signal-blue flex items-center gap-1 font-medium">
              Full Tracking View <ArrowRight size={13} />
            </Link>
          </div>
          <MapView
            center={center}
            geofenceCenter={[geofence.latitude, geofence.longitude]}
            geofenceRadius={geofence.radius}
            phoneMarker={currentPosition ? [currentPosition.lat, currentPosition.lng] : null}
            showGeofenceCircle={true}
            inside={geofenceResult ? geofenceResult.inside : true}
          />
        </section>

        {/* RECENT ALERTS */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <div className="hud-label">Recent Events</div>
            <Link to="/alerts" className="text-xs text-signal-cyan hover:text-signal-blue flex items-center gap-1 font-medium">
              View All <ArrowRight size={13} />
            </Link>
          </div>

          {recentAlerts.length === 0 ? (
            <div className="glass-panel rounded-xl p-8 text-center">
              <ShieldCheck size={32} className="mx-auto mb-3 text-status-safe" />
              <div className="font-display font-semibold text-white">System Clear</div>
              <p className="text-sm text-ink-500 mt-1">No active border violations detected.</p>
            </div>
          ) : (
            <div className="glass-panel rounded-xl divide-y divide-signal-cyan/10 overflow-hidden">
              {recentAlerts.map((a) => (
                <div key={a.id} className="flex items-center justify-between px-4 py-3 text-sm">
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        a.status === 'BREACHED' ? 'bg-status-danger pulse-danger' : 'bg-status-safe'
                      }`}
                    />
                    <span className="hud-value text-ink-300 truncate">
                      {a.latitude.toFixed(4)}, {a.longitude.toFixed(4)}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 flex-shrink-0">
                    <span className="hud-label text-ink-500">{new Date(a.time).toLocaleTimeString()}</span>
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        a.status === 'BREACHED'
                          ? 'bg-status-danger/15 text-status-danger'
                          : 'bg-status-safe/15 text-status-safe'
                      }`}
                    >
                      {a.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default Dashboard;
