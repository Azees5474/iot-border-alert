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
  status?: StatusType;
  icon?: ReactNode;
  unit?: string;
  delay?: number;
}

const statusClasses: Record<StatusType, string> = {
  connected: 'bg-green-500',
  safe: 'bg-green-500',
  inside: 'bg-green-500',
  active: 'bg-green-500',
  online: 'bg-green-500',
  disconnected: 'bg-red-500',
  outside: 'bg-red-500',
  alert: 'bg-red-500',
  inactive: 'bg-red-500',
  offline: 'bg-red-500',
  unknown: 'bg-gray-500',
};

const labelClasses: Record<StatusType, string> = {
  connected: 'text-green-600',
  safe: 'text-green-600',
  inside: 'text-green-600',
  active: 'text-green-600',
  online: 'text-green-600',
  disconnected: 'text-red-600',
  outside: 'text-red-600',
  alert: 'text-red-600',
  inactive: 'text-red-600',
  offline: 'text-red-600',
  unknown: 'text-gray-600',
};

const StatusCard = ({ title, value, status = 'unknown', icon, unit, delay = 0 }: StatusCardProps) => {
  const dotColor = statusClasses[status] ?? statusClasses.unknown;
  const labelColor = labelClasses[status] ?? labelClasses.unknown;
  
  const isAlert = status === 'alert' || status === 'outside' || status === 'disconnected' || status === 'offline';
  const isActive = status === 'active' || status === 'inside' || status === 'online' || status === 'connected' || status === 'safe';

  return (
    <div 
      className={`
        bg-white rounded-xl shadow-card border border-gray-100 p-6 
        flex items-center gap-4 card-hover cursor-default
        animate-slide-up
        ${isAlert ? 'border-l-4 border-l-red-500' : isActive ? 'border-l-4 border-l-green-500' : ''}
      `}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className={`
        flex-shrink-0 p-3 rounded-xl transition-all duration-300
        ${isActive ? 'bg-green-50 text-green-600' : isAlert ? 'bg-red-50 text-red-600' : 'bg-gray-50 text-gray-500'}
      `}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span 
            className={`
              inline-block w-2.5 h-2.5 rounded-full ${dotColor}
              ${isActive ? 'animate-pulse-slow' : isAlert ? 'animate-pulse-fast' : ''}
            `}
          />
          <span className={`text-sm font-medium ${labelColor}`}>{title}</span>
        </div>
        <div className="mt-2 text-2xl font-bold text-gray-800 truncate">
          {value} {unit && <span className="text-sm font-normal text-gray-500">{unit}</span>}
        </div>
      </div>
      
      {/* Decorative element */}
      <div className="hidden sm:block opacity-10">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gray-400">
          <circle cx="12" cy="12" r="10" />
        </svg>
      </div>
    </div>
  );
};

export default StatusCard;
