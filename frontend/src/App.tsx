import { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider, useAppContext } from '@/context/AppContext';
import Dashboard from '@/pages/Dashboard';
import LiveTracking from '@/pages/LiveTracking';
import Geofence from '@/pages/Geofence';
import Alerts from '@/pages/Alerts';
import Device from '@/pages/Device';
import Settings from '@/pages/Settings';
import PhoneGPS from '@/pages/PhoneGPS';
import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';
import ErrorBoundary from '@/components/ErrorBoundary';

const AppContent = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { demoMode } = useAppContext();

  return (
    <div className="min-h-screen flex bg-abyss-950">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-h-screen min-w-0">
        {demoMode && (
          <div className="demo-banner px-4 py-2.5 flex items-center justify-center font-bold text-sm gap-2 relative z-50">
            <span className="animate-pulse-slow">⚠</span>
            <span>DEMO MODE ACTIVE — Using simulated GPS data</span>
            <span className="animate-pulse-slow">⚠</span>
          </div>
        )}

        <TopBar onMenuClick={() => setSidebarOpen(true)} />

        <main className="flex-1 overflow-auto page-enter">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/tracking" element={<LiveTracking />} />
            <Route path="/geofence" element={<Geofence />} />
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/device" element={<Device />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/phone" element={<PhoneGPS />} />
          </Routes>
        </main>

        <footer className="border-t border-signal-cyan/10 px-4 md:px-6 py-3 flex flex-col sm:flex-row items-center justify-between gap-1 hud-label text-ink-500">
          <span>IoT Border Alert · Maritime Safety &amp; Surveillance System</span>
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-status-safe pulse-safe" />
            System Status: Operational
          </span>
        </footer>
      </div>
    </div>
  );
};

function AppRoutes() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AppProvider>
        <ErrorBoundary>
          <AppContent />
        </ErrorBoundary>
      </AppProvider>
    </BrowserRouter>
  );
}

const App = () => {
  return <AppRoutes />;
};

export default App;
