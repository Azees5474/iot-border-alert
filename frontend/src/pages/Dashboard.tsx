import { useEffect, useState } from 'react';
import { useAppContext } from '@/context/AppContext';

const Dashboard = () => {
  const { currentPosition, geofence, deviceStatus, alerts, gpsTracking } = useAppContext();

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
      <p className="text-gray-500">GPS: {gpsTracking ? 'Active' : 'Inactive'}</p>
      <p className="text-gray-500">Position: {currentPosition ? `${currentPosition.lat.toFixed(6)}, ${currentPosition.lng.toFixed(6)}` : 'None'}</p>
      <p className="text-gray-500">Geofence: {geofence.latitude.toFixed(6)}, {geofence.longitude.toFixed(6)}</p>
      <p className="text-gray-500">Device: {deviceStatus.status}</p>
      <p className="text-gray-500">Alerts: {alerts.length}</p>
    </div>
  );
};

export default Dashboard;
