interface RadarDisplayProps {
  /** Whether a vessel/position is actively being tracked */
  active: boolean;
  /** true = inside geofence (safe/green), false = outside (danger/red), undefined = unknown */
  inside?: boolean;
  size?: number;
  className?: string;
}

/**
 * Lightweight SVG radar. The sweep always rotates (decorative HUD chrome),
 * but the target dot only renders/pulses when there is a real tracked
 * position, and its color reflects the real geofence state.
 */
const RadarDisplay = ({ active, inside, size = 180, className = '' }: RadarDisplayProps) => {
  const targetColor =
    inside === undefined ? '#94A3B8' : inside ? '#22C55E' : '#EF4444';

  return (
    <div
      className={`relative ${className}`}
      style={{ width: size, height: size }}
      role="img"
      aria-label={active ? 'Radar tracking active' : 'Radar idle, no position data'}
    >
      <svg viewBox="0 0 200 200" width={size} height={size}>
        <circle cx="100" cy="100" r="95" fill="rgba(34,211,238,0.03)" stroke="rgba(56,189,248,0.25)" strokeWidth="1" />
        <circle cx="100" cy="100" r="70" fill="none" stroke="rgba(56,189,248,0.2)" strokeWidth="1" />
        <circle cx="100" cy="100" r="45" fill="none" stroke="rgba(56,189,248,0.2)" strokeWidth="1" />
        <circle cx="100" cy="100" r="20" fill="none" stroke="rgba(56,189,248,0.2)" strokeWidth="1" />
        <line x1="100" y1="5" x2="100" y2="195" stroke="rgba(56,189,248,0.12)" strokeWidth="1" />
        <line x1="5" y1="100" x2="195" y2="100" stroke="rgba(56,189,248,0.12)" strokeWidth="1" />

        {active && (
          <g style={{ transformOrigin: '100px 100px' }} className="animate-radar-sweep">
            <path d="M100,100 L100,5 A95,95 0 0,1 167,33 Z" fill="url(#sweepGradient)" />
          </g>
        )}

        <defs>
          <linearGradient id="sweepGradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#22D3EE" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#22D3EE" stopOpacity="0" />
          </linearGradient>
        </defs>

        {active && (
          <circle cx="100" cy="100" r="5" fill={targetColor}>
            <animate attributeName="r" values="4;7;4" dur="2s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="1;0.5;1" dur="2s" repeatCount="indefinite" />
          </circle>
        )}
      </svg>
    </div>
  );
};

export default RadarDisplay;
