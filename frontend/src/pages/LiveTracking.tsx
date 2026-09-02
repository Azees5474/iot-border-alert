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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <MapPin size={24} />
            Live Tracking
          </h1>
          <p className="text-gray-500">Real-time GPS location & geofence monitoring</p>
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
        <div className="demo-banner text-white px-4 py-3 flex items-center justify-between rounded-xl animate-slide-up">
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

      <div className="relative">
        <MapView
          center={center as [number, number]}
          geofenceCenter={[geofence.latitude, geofence.longitude]}
          geofenceRadius={geofence.radius}
          phoneMarker={currentPosition ? [currentPosition.lat, currentPosition.lng] : null}
          showGeofenceCircle={true}
          inside={geofenceResult.inside}
        />

        <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-ocean-100 p-4 min-w-[200px] animate-slide-in-right">
          <h3 className="text-sm font-medium text-gray-500 mb-2 flex items-center gap-1">
            <Navigation size={14} className="text-ocean-600" /> Live Coordinates
          </h3>
          {currentPosition ? (
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Latitude</span>
                <span className="font-mono font-medium">{currentPosition.lat.toFixed(6)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Longitude</span>
                <span className="font-mono font-medium">{currentPosition.lng.toFixed(6)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Accuracy</span>
                <span className="font-mono font-medium">{currentPosition.accuracy} m</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Distance</span>
                <span className="font-mono font-medium">{geofenceResult.distance} m</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Status</span>
                <span className={geofenceResult.inside ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                  {geofenceResult.inside ? 'Inside' : 'Outside'}
                </span>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 text-sm">Waiting for GPS…</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
            <Wind size={14} /> Geofence Radius
          </div>
          <div className="text-xl font-bold text-gray-800">{geofence.radius} m</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
            <Wifi size={14} /> GPS Source
          </div>
          <div className="text-xl font-bold text-gray-800">{demoMode ? 'Simulated' : gpsTracking ? 'Smartphone' : 'Idle'}</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
            <MapPin size={14} /> Tracking
          </div>
          <div className={`text-xl font-bold ${gpsTracking ? 'text-green-600' : 'text-gray-400'}`}>
            {gpsTracking ? 'ON' : 'OFF'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveTracking;
