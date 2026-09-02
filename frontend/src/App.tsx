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
import { Menu } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import ErrorBoundary from '@/components/ErrorBoundary';

const AppContent = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { demoMode } = useAppContext();

  return (
    <div className="min-h-screen flex bg-ocean-light">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 md:hidden bg-black/40 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-h-screen">
        {demoMode && (
          <div className="demo-banner text-white px-4 py-3 flex items-center justify-center font-bold text-sm gap-2 relative z-50">
            <span className="animate-pulse-slow">⚠</span>
            <span>DEMO MODE ACTIVE — Using simulated GPS data</span>
            <span className="animate-pulse-slow">⚠</span>
          </div>
        )}

        {/* Mobile header */}
        <div className="md:hidden flex items-center justify-between p-4 bg-white border-b border-gray-200">
          <button
            className="p-2 rounded-lg bg-ocean-900 text-white"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={20} />
          </button>
          <h1 className="text-lg font-bold text-ocean-900">IoT Border Alert</h1>
          <div className="w-10" />
        </div>

        <main className="flex-1 overflow-auto">
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
