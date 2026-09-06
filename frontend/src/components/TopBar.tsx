import { useLocation } from 'react-router-dom';
import { Menu, Bell } from 'lucide-react';
import { useAppContext } from '@/context/AppContext';
import SystemClock from '@/components/SystemClock';

const PAGE_TITLES: Record<string, string> = {
  '/': 'Command Center',
  '/tracking': 'Live Tracking',
  '/geofence': 'Geofence',
  '/alerts': 'Alert Center',
  '/device': 'Device Status',
  '/phone': 'Phone GPS',
  '/settings': 'Settings',
};

interface TopBarProps {
  onMenuClick: () => void;
}

const TopBar = ({ onMenuClick }: TopBarProps) => {
  const location = useLocation();
  const { gpsTracking, demoMode, alerts } = useAppContext();
  const gpsActive = gpsTracking || demoMode;
  const pageTitle = PAGE_TITLES[location.pathname] ?? 'Command Center';

  return (
    <header className="sticky top-0 z-20 glass-panel border-b border-signal-cyan/10">
      <div className="flex items-center justify-between gap-3 px-4 md:px-6 py-3">
        <div className="flex items-center gap-3 min-w-0">
          <button
            className="md:hidden p-2 rounded-lg bg-panel-800 text-ink-300 hover:text-white transition-colors"
            onClick={onMenuClick}
            aria-label="Open navigation menu"
          >
            <Menu size={18} />
          </button>
          <div className="min-w-0">
            <div className="hud-label leading-none">IoT Border Alert · Maritime Surveillance</div>
            <h1 className="font-display font-semibold text-base md:text-lg text-white truncate mt-0.5">
              {pageTitle}
            </h1>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-5 hud-label">
          <span className="flex items-center gap-1.5 text-ink-300">
            <span className="w-1.5 h-1.5 rounded-full bg-status-safe pulse-safe" />
            System Online
          </span>
          <span className={`flex items-center gap-1.5 ${gpsActive ? 'text-status-safe' : 'text-ink-500'}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${gpsActive ? 'bg-status-safe pulse-safe' : 'bg-ink-500'}`} />
            GPS {gpsActive ? 'Active' : 'Idle'}
          </span>
          <span className="relative flex items-center gap-1.5 text-ink-300">
            <Bell size={13} className={alerts.length > 0 ? 'text-status-danger' : ''} />
            {alerts.length}
          </span>
          <SystemClock />
        </div>
      </div>
    </header>
  );
};

export default TopBar;
