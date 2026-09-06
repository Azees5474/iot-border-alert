import { ReactNode } from 'react';

type StatusType =
  | 'connected'
  | 'disconnected'
  | 'inside'
  | 'outside'
  | 'active'
  | 'inactive'
  | 'unknown'
  | 'safe'
  | 'alert'
  | 'offline'
  | 'online';

interface StatusCardProps {
  title: string;
  value: ReactNode;
  subtext?: ReactNode;
  status?: StatusType;
  icon?: ReactNode;
  unit?: string;
  delay?: number;
}

const SAFE_STATES: StatusType[] = ['connected', 'inside', 'active', 'online', 'safe'];
const ALERT_STATES: StatusType[] = ['disconnected', 'outside', 'alert', 'inactive', 'offline'];

const StatusCard = ({ title, value, subtext, status = 'unknown', icon, unit, delay = 0 }: StatusCardProps) => {
  const isSafe = SAFE_STATES.includes(status);
  const isAlert = ALERT_STATES.includes(status);

  const dotClass = isSafe ? 'bg-status-safe' : isAlert ? 'bg-status-danger' : 'bg-ink-500';
  const borderClass = isSafe ? 'border-l-status-safe/70' : isAlert ? 'border-l-status-danger/70' : 'border-l-signal-cyan/40';
  const iconWrapClass = isSafe
    ? 'bg-status-safe/10 text-status-safe'
    : isAlert
      ? 'bg-status-danger/10 text-status-danger'
      : 'bg-signal-cyan/10 text-signal-cyan';

  return (
    <div
      className={`glass-panel rounded-xl p-5 flex flex-col gap-3 card-hover border-l-2 ${borderClass} animate-slide-up`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${dotClass} ${isSafe ? 'pulse-safe' : isAlert ? 'pulse-danger' : ''}`} />
          <span className="hud-label">{title}</span>
        </div>
        {icon && <div className={`p-1.5 rounded-lg ${iconWrapClass}`}>{icon}</div>}
      </div>

      <div className="text-2xl font-display font-semibold text-white truncate">
        {value} {unit && <span className="text-sm font-normal text-ink-500">{unit}</span>}
      </div>

      {subtext && <div className="text-xs text-ink-500">{subtext}</div>}
    </div>
  );
};

export default StatusCard;
