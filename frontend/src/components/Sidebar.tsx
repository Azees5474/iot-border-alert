import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  MapPin,
  Wind,
  Bell,
  Smartphone,
  Settings,
  X,
  Anchor,
} from 'lucide-react';
import { useAppContext } from '@/context/AppContext';

interface NavItem {
  name: string;
  path: string;
  icon: React.ElementType;
}

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

const navItems: NavItem[] = [
  { name: 'Command Center', path: '/', icon: LayoutDashboard },
  { name: 'Live Tracking', path: '/tracking', icon: MapPin },
  { name: 'Geofence', path: '/geofence', icon: Wind },
  { name: 'Alert Center', path: '/alerts', icon: Bell },
  { name: 'Device Status', path: '/device', icon: Smartphone },
];

const systemItems: NavItem[] = [
  { name: 'Phone GPS', path: '/phone', icon: Smartphone },
  { name: 'Settings', path: '/settings', icon: Settings },
];

const NavRow = ({ item, index, onClose }: { item: NavItem; index: number; onClose: () => void }) => {
  const location = useLocation();
  const isActive = location.pathname === item.path;
  const Icon = item.icon;
  return (
    <NavLink
      to={item.path}
      onClick={onClose}
      className={`
        flex items-center gap-3 px-4 py-3 rounded-lg mx-1 mb-1
        transition-all duration-200 border-l-2
        animate-slide-in-right
        ${isActive
          ? 'bg-signal-cyan/10 text-white border-l-signal-cyan shadow-[0_0_16px_rgba(34,211,238,0.15)]'
          : 'text-ink-300 hover:bg-panel-800/60 hover:text-white border-l-transparent'
        }
      `}
      style={{ animationDelay: `${index * 40}ms` }}
    >
      <div className={`p-1.5 rounded-lg ${isActive ? 'bg-signal-cyan/15 text-signal-cyan' : 'bg-panel-800 text-ink-500'}`}>
        <Icon size={17} />
      </div>
      <span className="font-medium text-sm tracking-wide">{item.name}</span>
      {isActive && <div className="ml-auto w-1.5 h-1.5 bg-signal-cyan rounded-full pulse-safe" />}
    </NavLink>
  );
};

const Sidebar = ({ open, onClose }: SidebarProps) => {
  const { alerts } = useAppContext();

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-30 md:hidden bg-abyss-950/70 backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-40 h-screen w-72
          bg-abyss-950 border-r border-signal-cyan/10
          text-ink-100 shadow-2xl tech-grid
          transform transition-transform duration-300 ease-in-out
          ${open ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0 md:static md:flex md:flex-col
        `}
      >
        {/* Logo section */}
        <div className="flex items-center justify-between p-5 border-b border-signal-cyan/10 bg-abyss-950/60">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="p-2 bg-signal-cyan/10 rounded-lg border border-signal-cyan/25">
                <Anchor size={22} className="text-signal-cyan" />
              </div>
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-status-safe rounded-full pulse-safe" />
            </div>
            <div>
              <h2 className="text-base font-display font-bold text-white tracking-wide leading-none">IOT BORDER</h2>
              <p className="text-[11px] text-signal-cyan font-medium tracking-[0.15em] uppercase mt-1">Alert System</p>
            </div>
          </div>
          <button
            className="md:hidden text-ink-300 hover:text-white transition-colors p-1 rounded-lg hover:bg-panel-800"
            onClick={onClose}
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 overflow-y-auto px-3">
          <div className="mb-2 px-3 hud-label">Navigation</div>
          {navItems.map((item, index) => (
            <NavRow key={item.path} item={item} index={index} onClose={onClose} />
          ))}

          <div className="mt-6 mb-2 px-3 hud-label">System</div>
          {systemItems.map((item, index) => (
            <NavRow key={item.path} item={item} index={index} onClose={onClose} />
          ))}
        </nav>

        {/* Bottom section */}
        <div className="p-4 border-t border-signal-cyan/10 bg-abyss-950/60">
          <div className="px-3 py-2.5 bg-panel-900 rounded-lg border border-signal-cyan/10 flex items-center justify-between">
            <span className="flex items-center gap-2 hud-label text-ink-300">
              <span className="w-1.5 h-1.5 rounded-full bg-status-safe pulse-safe" />
              System Online
            </span>
            {alerts.length > 0 && (
              <span className="hud-value text-[11px] text-status-danger">{alerts.length} alert{alerts.length === 1 ? '' : 's'}</span>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
