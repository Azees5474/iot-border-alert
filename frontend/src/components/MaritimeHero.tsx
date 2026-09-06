import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Anchor, Radio } from "lucide-react";
import { useAppContext } from "@/context/AppContext";
import RadarDisplay from "@/components/RadarDisplay";
import SystemClock from "@/components/SystemClock";

/**
 * Full-width cinematic hero. Looks for /videos/fishing-boat.mp4 (see README note
 * in public/videos). If it's missing or fails to load, we silently fall back to
 * a dark ocean gradient + grid — the page never breaks and no broken <video>
 * element is ever shown.
 */
const MaritimeHero = () => {
  const [videoFailed, setVideoFailed] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { currentPosition, gpsTracking, demoMode, deviceStatus } =
    useAppContext();
  const gpsActive = gpsTracking || demoMode;

  return (
    <section className="relative overflow-hidden min-h-[440px] md:min-h-[560px] flex items-end">
      {/* Background: video if available, otherwise a cinematic gradient fallback */}
      <div className="absolute inset-0 bg-gradient-to-br from-abyss-950 via-abyss-900 to-panel-900">
        {!videoFailed && (
          <video
            ref={videoRef}
            className="absolute inset-0 w-full h-full object-cover opacity-70"
            autoPlay
            muted
            loop
            playsInline
            poster="/videos/fishing-boat-poster.jpg"
            onError={() => setVideoFailed(true)}
            onLoadedMetadata={(e) => {
              // Original footage plays a little too slowly for a "moving boat" feel —
              // nudge playback speed up without affecting audio (it's muted anyway).
              e.currentTarget.playbackRate = 1.4;
            }}
          >
            <source src="/videos/fishing-boat.mp4" type="video/mp4" />
          </video>
        )}
        {/* fallback ocean texture, always present under the video for a seamless blend */}
        <div className="absolute inset-0 tech-grid opacity-30" />
      </div>

      {/* Gradient overlay: dark left, semi-transparent center, lighter right */}
      <div className="absolute inset-0 bg-gradient-to-r from-abyss-950 via-abyss-950/70 to-abyss-950/30" />
      <div className="absolute inset-0 bg-gradient-to-t from-abyss-950 via-transparent to-abyss-950/40" />

      {/* Scanning line */}
      <div className="scan-overlay" />

      {/* Radar, top-right */}
      <div className="hidden lg:block absolute top-10 right-10 opacity-80">
        <RadarDisplay
          active={gpsActive}
          inside={currentPosition ? undefined : undefined}
          size={170}
        />
      </div>

      <div className="relative z-10 w-full px-5 md:px-10 lg:px-14 pb-10 md:pb-14 pt-24">
        <div className="max-w-4xl">
          <div className="flex items-center gap-2 hud-label text-signal-cyan animate-hud-fade">
            <Radio size={12} className="animate-pulse-slow" />
            Live Maritime Monitoring
          </div>

          <h1
            className="mt-3 font-display font-bold text-3xl sm:text-4xl md:text-5xl lg:text-6xl leading-[1.05] text-white animate-hud-fade"
            style={{ animationDelay: "80ms" }}
          >
            Maritime Border
            <br />
            <span className="gradient-text">Safety &amp; Surveillance</span>
          </h1>

          <p
            className="mt-4 max-w-xl text-ink-300 text-sm md:text-base animate-hud-fade"
            style={{ animationDelay: "160ms" }}
          >
            Real-time GPS intelligence for safer maritime navigation and border
            monitoring — powered by live device telemetry and intelligent
            geofencing.
          </p>

          <div
            className="mt-6 flex flex-wrap items-center gap-3 animate-hud-fade"
            style={{ animationDelay: "240ms" }}
          >
            <Link
              to="/tracking"
              className="btn btn-primary flex items-center gap-2"
            >
              <Anchor size={16} /> Open Live Tracking
            </Link>
            <a href="#system-overview" className="btn btn-outline">
              View System Status
            </a>
          </div>

          {/* HUD strip — real data only */}
          <div
            className="mt-8 flex flex-wrap gap-x-8 gap-y-3 corner-brackets p-4 max-w-xl animate-hud-fade"
            style={{ animationDelay: "320ms" }}
          >
            <div>
              <div className="hud-label">GPS Position</div>
              <div className="hud-value text-sm md:text-base">
                {currentPosition
                  ? `${currentPosition.lat.toFixed(6)}°, ${currentPosition.lng.toFixed(6)}°`
                  : "No fix"}
              </div>
            </div>
            <div>
              <div className="hud-label">Device Status</div>
              <div
                className={`hud-value text-sm md:text-base flex items-center gap-1.5 ${deviceStatus.status === "online" ? "text-status-safe" : "text-ink-500"}`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${deviceStatus.status === "online" ? "bg-status-safe pulse-safe" : "bg-ink-500"}`}
                />
                {deviceStatus.status.toUpperCase()}
              </div>
            </div>
            <div>
              <div className="hud-label">System Time</div>
              <div className="hud-value text-sm md:text-base">
                <SystemClock />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MaritimeHero;
