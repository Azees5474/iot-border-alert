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
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'Live Tracking', path: '/tracking', icon: MapPin },
  { name: 'Geofence', path: '/geofence', icon: Wind },
  { name: 'Alerts', path: '/alerts', icon: Bell },
  { name: 'Device', path: '/device', icon: Smartphone },
  { name: 'Settings', path: '/settings', icon: Settings },
];

const Sidebar = ({ open, onClose }: SidebarProps) => {
  const location = useLocation();

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-30 md:hidden bg-black/40 backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-40 h-screen w-72 
          bg-gradient-to-b from-ocean-950 via-ocean-900 to-ocean-800 
          text-gray-100 shadow-2xl
          transform transition-transform duration-300 ease-in-out
          ${open ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0 md:static md:flex md:flex-col
        `}
      >
        {/* Logo section with fishing theme */}
        <div className="flex items-center justify-between p-5 border-b border-ocean-700/50 bg-ocean-950/30">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="p-2 bg-ocean-600/20 rounded-lg border border-ocean-500/30">
                <Anchor size={24} className="text-ocean-300 animate-float" />
              </div>
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-fishing-400 rounded-full animate-pulse-slow" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-wide">IoT Border</h2>
              <p className="text-xs text-ocean-300 font-medium tracking-wider uppercase">Alert System</p>
            </div>
          </div>
          <button
            className="md:hidden text-ocean-300 hover:text-white transition-colors p-1 rounded-lg hover:bg-ocean-800/50"
            onClick={onClose}
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 overflow-y-auto px-3">
          <div className="mb-2 px-3 text-xs font-semibold text-ocean-400 uppercase tracking-wider">
            Navigation
          </div>
          {navItems.map((item, index) => {
            const isActive =
              location.pathname === item.path ||
              (item.path === '/' && location.pathname === '/');
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-xl mx-1 mb-1 
                  transition-all duration-200
                  animate-slide-in-right
                  ${isActive
                    ? 'bg-ocean-600 text-white shadow-lg shadow-ocean-600/30 border border-ocean-500/50'
                    : 'text-ocean-100 hover:bg-ocean-800/50 hover:text-white border border-transparent hover:border-ocean-700/30'
                  }
                `}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="p-1.5 rounded-lg bg-ocean-800/50 text-ocean-300">
                  <Icon size={18} />
                </div>
                <span className="font-medium text-sm">{item.name}</span>
                {isActive && (
                  <div className="ml-auto w-1.5 h-1.5 bg-white rounded-full animate-pulse-slow" />
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom section */}
        <div className="p-4 border-t border-ocean-700/50 bg-ocean-950/30">
          <div className="mb-3 px-3 text-xs font-semibold text-ocean-400 uppercase tracking-wider">
            GPS Source
          </div>
          <NavLink
            to="/phone"
            onClick={onClose}
            className={({ isActive }) => `
              flex items-center gap-3 px-4 py-3 rounded-xl mx-1 mb-1 
              transition-all duration-200
              ${isActive
                ? 'bg-ocean-600 text-white shadow-lg shadow-ocean-600/30 border border-ocean-500/50'
                : 'text-ocean-100 hover:bg-ocean-800/50 hover:text-white border border-transparent hover:border-ocean-700/30'
              }
            `}
          >
            <div className="p-1.5 rounded-lg bg-ocean-800/50 text-ocean-300">
              <Smartphone size={18} />
            </div>
            <span className="font-medium text-sm">Phone GPS</span>
            {location.pathname === '/phone' && (
              <div className="ml-auto w-1.5 h-1.5 bg-white rounded-full animate-pulse-slow" />
            )}
          </NavLink>

          {/* Decorative fishing boat footer */}
          <div className="mt-4 px-3 py-2 bg-ocean-800/30 rounded-lg border border-ocean-700/30 flex items-center justify-center gap-2 opacity-60">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-ocean-300 animate-float-delayed">
              <path d="M2 21c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1 .6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" />
              <path d="M19.38 20A11.6 11.6 0 0 0 21 14l-9-4-9 4c0 2.9.94 5.34 2.81 7.76" />
              <path d="M19 13V7a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v6" />
            </svg>
            <span className="text-xs text-ocean-400 font-medium">Maritime Monitoring</span>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
