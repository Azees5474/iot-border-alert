import { useState, useEffect, useCallback, useRef } from 'react';
import { useAppContext } from '@/context/AppContext';
import MapView from '@/components/MapView';
import { checkGeofence, headingToOffset } from '@/utils/geofence';
import { Play, Pause, Wifi, Navigation, MapPin, Wind } from 'lucide-react';

const LiveTracking = () => {
  const {
    currentPosition,
    geofence,
    startTracking,
    stopTracking,
    gpsTracking,
    demoMode,
    setDemoMode,
    updatePosition,
  } = useAppContext();

  const [simAnimating, setSimAnimating] = useState(false);

  const moveTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const geofenceResult = currentPosition
    ? checkGeofence(
        currentPosition.lat,
        currentPosition.lng,
        geofence.latitude,
        geofence.longitude,
        geofence.radius,
      )
    : { inside: true, distance: 0 };

  const simulateInside = useCallback(() => {
    updatePosition({
      lat: geofence.latitude,
      lng: geofence.longitude,
      accuracy: 1,
      timestamp: Date.now(),
    });
  }, [geofence, updatePosition]);

  const simulateOutside = useCallback(() => {
    const targetDist = geofence.radius + 50;
    const angle = Math.random() * 360;
    const offset = headingToOffset(targetDist, angle);
    updatePosition({
      lat: geofence.latitude + offset.lat,
      lng: geofence.longitude + offset.lon,
      accuracy: 1,
      timestamp: Date.now(),
    });
  }, [geofence, updatePosition]);

  const startMovement = useCallback(() => {
    if (simAnimating) return;
    setSimAnimating(true);
    let phase = 'leaving';
    let t = 0;

    const center = { lat: geofence.latitude, lng: geofence.longitude };
    const leaveHeading = Math.random() * 360;
    const leaveOffset = headingToOffset(geofence.radius + 50, leaveHeading);
    const leavePoint = { lat: center.lat + leaveOffset.lat, lng: center.lng + leaveOffset.lon };
    const totalSteps = 60;

    const cleanup = () => {
      if (moveTimerRef.current) {
        clearInterval(moveTimerRef.current);
        moveTimerRef.current = null;
      }
    };

    const step = () => {
      t += 1;
      if (phase === 'leaving' && t > totalSteps) {
        phase = 'returning';
        t = 0;
      }
      if (phase === 'returning' && t > totalSteps) {
        setSimAnimating(false);
        cleanup();
        return;
      }

      if (phase === 'leaving') {
        const ratio = Math.min(t / totalSteps, 1);
        updatePosition({
          lat: center.lat + leaveOffset.lat * ratio,
          lng: center.lng + leaveOffset.lon * ratio,
          accuracy: 1,
          timestamp: Date.now(),
        });
      } else {
        const ratio = Math.min(t / totalSteps, 1);
        updatePosition({
          lat: leavePoint.lat + (center.lat - leavePoint.lat) * ratio,
          lng: leavePoint.lng + (center.lng - leavePoint.lng) * ratio,
          accuracy: 1,
          timestamp: Date.now(),
        });
      }
    };

    cleanup();
    moveTimerRef.current = setInterval(step, 150);
  }, [geofence, simAnimating, updatePosition]);

  useEffect(() => {
    return () => {
      if (moveTimerRef.current) {
        clearInterval(moveTimerRef.current);
        moveTimerRef.current = null;
      }
    };
  }, []);

  const toggleTracking = () => {
    if (gpsTracking) {
      stopTracking();
    } else {
      startTracking();
    }
  };

  const center = currentPosition
    ? [currentPosition.lat, currentPosition.lng]
    : [geofence.latitude, geofence.longitude];

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-white flex items-center gap-2">
            <MapPin size={22} className="text-signal-cyan" />
            Live Vessel Tracking
          </h1>
          <p className="text-ink-500 text-sm">Real-time GPS location &amp; geofence monitoring</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            className={`btn ${demoMode ? 'btn-warning' : 'btn-outline'}`}
            onClick={() => setDemoMode(!demoMode)}
          >
            {demoMode ? 'Exit Demo Mode' : 'Demo Mode'}
          </button>
          <button
            className={`btn ${gpsTracking ? 'btn-danger' : 'btn-success'}`}
            onClick={toggleTracking}
            disabled={demoMode}
          >
            {gpsTracking ? <><Pause size={16} className="mr-1" /> Stop Tracking</> : <><Play size={16} className="mr-1" /> Start Tracking</>}
          </button>
        </div>
      </div>

      {demoMode && (
        <div className="demo-banner px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 rounded-xl animate-slide-up">
          <span className="font-bold flex items-center gap-2">
            <span className="animate-pulse-slow text-lg">⚠</span>
            DEMO MODE ACTIVE
          </span>
          <div className="flex flex-wrap gap-2">
            <button className="btn btn-success btn-sm" onClick={simulateInside}>
              Simulate Inside
            </button>
            <button className="btn btn-danger btn-sm" onClick={simulateOutside}>
              Simulate Outside
            </button>
            <button
              className="btn btn-warning btn-sm"
              onClick={startMovement}
              disabled={simAnimating}
            >
              {simAnimating ? 'Animating…' : 'Simulate Movement'}
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <MapView
            center={center as [number, number]}
            geofenceCenter={[geofence.latitude, geofence.longitude]}
            geofenceRadius={geofence.radius}
            phoneMarker={currentPosition ? [currentPosition.lat, currentPosition.lng] : null}
            showGeofenceCircle={true}
            inside={geofenceResult.inside}
          />
        </div>

        {/* Vessel status side panel */}
        <div className="glass-panel rounded-xl p-5 h-fit">
          <h3 className="hud-label mb-4 flex items-center gap-1.5">
            <Navigation size={14} className="text-signal-cyan" /> Vessel Status
          </h3>
          {currentPosition ? (
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-ink-500">Device</span>
                <span className={`flex items-center gap-1.5 font-medium ${gpsTracking ? 'text-status-safe' : 'text-ink-500'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${gpsTracking ? 'bg-status-safe pulse-safe' : 'bg-ink-500'}`} />
                  {gpsTracking ? 'ONLINE' : 'IDLE'}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-ink-500">Latitude</span>
                <span className="hud-value">{currentPosition.lat.toFixed(6)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-ink-500">Longitude</span>
                <span className="hud-value">{currentPosition.lng.toFixed(6)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-ink-500">Accuracy</span>
                <span className="hud-value">{currentPosition.accuracy} m</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-ink-500">Distance</span>
                <span className="hud-value">{geofenceResult.distance} m</span>
              </div>
              <div className="flex justify-between text-sm items-center pt-2 border-t border-signal-cyan/10">
                <span className="text-ink-500">Status</span>
                <span className={`font-semibold text-sm ${geofenceResult.inside ? 'text-status-safe' : 'text-status-danger'}`}>
                  {geofenceResult.inside ? 'SAFE ZONE' : 'BOUNDARY BREACH'}
                </span>
              </div>
            </div>
          ) : (
            <p className="text-ink-500 text-sm">Waiting for GPS…</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-panel rounded-xl p-4">
          <div className="flex items-center gap-2 hud-label mb-1">
            <Wind size={14} /> Geofence Radius
          </div>
          <div className="text-xl font-display font-semibold text-white">{geofence.radius} m</div>
        </div>
        <div className="glass-panel rounded-xl p-4">
          <div className="flex items-center gap-2 hud-label mb-1">
            <Wifi size={14} /> GPS Source
          </div>
          <div className="text-xl font-display font-semibold text-white">{demoMode ? 'Simulated' : gpsTracking ? 'Smartphone' : 'Idle'}</div>
        </div>
        <div className="glass-panel rounded-xl p-4">
          <div className="flex items-center gap-2 hud-label mb-1">
            <MapPin size={14} /> Tracking
          </div>
          <div className={`text-xl font-display font-semibold ${gpsTracking ? 'text-status-safe' : 'text-ink-500'}`}>
            {gpsTracking ? 'ON' : 'OFF'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveTracking;
