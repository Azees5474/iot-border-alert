import { Satellite, Cpu, ShieldCheck, BellRing } from "lucide-react";
import { useAppContext } from "@/context/AppContext";
import { checkGeofence } from "@/utils/geofence";
import MaritimeHero from "@/components/MaritimeHero";
import StatusCard from "@/components/StatusCard";

const Dashboard = () => {
  const {
    currentPosition,
    geofence,
    deviceStatus,
    alerts,
    gpsTracking,
    demoMode,
    phoneName,
  } = useAppContext();

  const gpsActive = gpsTracking || demoMode;

  const geofenceResult = currentPosition
    ? checkGeofence(
        currentPosition.lat,
        currentPosition.lng,
        geofence.latitude,
        geofence.longitude,
        geofence.radius,
      )
    : null;

  const deviceOnline =
    deviceStatus.status === "online" || deviceStatus.status === "connected";
  const breachCount = alerts.filter((a) => a.status === "BREACHED").length;

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
              status={gpsActive ? "active" : "inactive"}
              value={gpsActive ? phoneName : "IDLE"}
              subtext={
                currentPosition
                  ? `${currentPosition.lat.toFixed(6)}, ${currentPosition.lng.toFixed(6)}`
                  : "No fix yet"
              }
              delay={0}
            />
            <StatusCard
              title="Device Status"
              icon={<Cpu size={16} />}
              status={deviceOnline ? "online" : "offline"}
              value={deviceOnline ? "ONLINE" : "OFFLINE"}
              subtext={deviceStatus.deviceId || "No device registered"}
              delay={60}
            />
            <StatusCard
              title="Geofence"
              icon={<ShieldCheck size={16} />}
              status={
                geofenceResult
                  ? geofenceResult.inside
                    ? "safe"
                    : "outside"
                  : "unknown"
              }
              value={
                geofenceResult
                  ? geofenceResult.inside
                    ? "SAFE"
                    : "BREACH"
                  : "N/A"
              }
              subtext={
                geofenceResult
                  ? `${geofenceResult.distance} m from center`
                  : "Awaiting position"
              }
              delay={120}
            />
            <StatusCard
              title="Active Alerts"
              icon={<BellRing size={16} />}
              status={breachCount > 0 ? "alert" : "safe"}
              value={String(alerts.length).padStart(2, "0")}
              subtext={
                breachCount > 0
                  ? `${breachCount} breach event(s)`
                  : "No active alerts"
              }
              delay={180}
            />
          </div>
        </section>
      </div>
    </div>
  );
};

export default Dashboard;
