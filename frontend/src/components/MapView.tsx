import { useEffect } from 'react';
import {
  MapContainer,
  TileLayer,
  Circle,
  Marker,
  Popup,
  useMap,
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

type LatLngTuple = [number, number];

interface MapViewProps {
  center: LatLngTuple;
  geofenceCenter: LatLngTuple;
  geofenceRadius: number;
  phoneMarker: LatLngTuple | null;
  showGeofenceCircle: boolean;
  inside: boolean;
}

const createPhoneIcon = () => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="22" height="22">
    <path d="M12 2 L8 12 L16 12 Z" fill="#3b82f6" stroke="white" stroke-width="1.5" stroke-linejoin="round"/>
    <path d="M12 6 L12 18 M12 10 L18 8 M12 14 L18 16" stroke="white" stroke-width="1.5" stroke-linecap="round"/>
  </svg>`;
  return new L.DivIcon({
    html: svg,
    className: 'custom-phone-marker',
    iconSize: [22, 22],
    iconAnchor: [11, 11],
    popupAnchor: [0, -11],
  });
};

const createGeofenceIcon = () => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18">
    <circle cx="12" cy="12" r="8" fill="none" stroke="#ef4444" stroke-width="2"/>
    <circle cx="12" cy="12" r="2" fill="#ef4444"/>
  </svg>`;
  return new L.DivIcon({
    html: svg,
    className: 'custom-geofence-marker',
    iconSize: [18, 18],
    iconAnchor: [9, 9],
    popupAnchor: [0, -9],
  });
};

const PhoneIcon = createPhoneIcon();

const FixLeafletAssets = () => {
  useEffect(() => {
    const proto = L.Icon.Default.prototype as unknown as {
      _getIconUrl: unknown;
    };
    if (proto._getIconUrl) {
      delete proto._getIconUrl;
    }
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
    });
  }, []);
  return null;
};

const FlyToPhone = ({ pos }: { pos: LatLngTuple | null }) => {
  const map = useMap();
  useEffect(() => {
    if (pos) {
      map.flyTo(pos, 20, { duration: 1.5 });
    }
  }, [pos, map]);
  return null;
};

const CenterMapBtn = ({ pos }: { pos: LatLngTuple }) => {
  const map = useMap();
  return (
    <button
      className="absolute top-4 right-4 z-[1000] bg-white/90 backdrop-blur-sm rounded-xl shadow-lg px-4 py-2.5 text-sm font-medium hover:bg-white transition-all active:scale-95 border border-ocean-200 text-ocean-700 hover:text-ocean-800"
      onClick={() => map.setView(pos, 20)}
    >
      Center Map
    </button>
  );
};

const LocatePhoneBtn = ({ pos }: { pos: LatLngTuple | null }) => {
  const map = useMap();
  return (
    <button
      className="absolute top-4 left-4 z-[1000] bg-white/90 backdrop-blur-sm rounded-xl shadow-lg px-4 py-2.5 text-sm font-medium hover:bg-white transition-all active:scale-95 border border-ocean-200 text-ocean-700 hover:text-ocean-800 disabled:opacity-50 disabled:cursor-not-allowed"
      onClick={() => {
        if (pos) map.flyTo(pos, 21, { duration: 1.5 });
      }}
      disabled={!pos}
    >
      Locate Phone
    </button>
  );
};

const MapView = ({
  center,
  geofenceCenter,
  geofenceRadius,
  phoneMarker,
  showGeofenceCircle,
  inside,
}: MapViewProps) => {
  const circleColor = inside
    ? '#22c55e'
    : phoneMarker
      ? '#ef4444'
      : '#ef4444';

  return (
    <div className="relative h-[500px] w-full rounded-2xl shadow-card border border-ocean-100 overflow-hidden map-glow animate-scale-in">
      <FixLeafletAssets />
      <MapContainer
        center={center}
        zoom={20}
        className="h-full w-full"
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FlyToPhone pos={phoneMarker} />
        <CenterMapBtn pos={geofenceCenter} />
        <LocatePhoneBtn pos={phoneMarker} />

        {showGeofenceCircle && (
          <Circle
            center={geofenceCenter}
            radius={geofenceRadius}
            pathOptions={{
              color: circleColor,
              fillColor: circleColor,
              fillOpacity: 0.25,
              weight: 4,
              dashArray: '4, 4',
              className: inside ? 'animate-pulse-slow' : '',
            }}
          >
            <Popup>Geofence boundary — Radius: {geofenceRadius} m</Popup>
          </Circle>
        )}

        {phoneMarker && (
          <Marker position={phoneMarker} icon={PhoneIcon}>
            <Popup>
              <span className="font-medium text-blue-600">Phone</span>
              <br />
              {phoneMarker[0].toFixed(6)}, {phoneMarker[1].toFixed(6)}
            </Popup>
          </Marker>
        )}
      </MapContainer>

      {/* Legend overlay */}
      <div className="absolute bottom-4 right-4 z-[1000] bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-ocean-100 p-3">
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-blue-500" />
            <span className="text-gray-700 font-medium">Phone</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-3 rounded-full bg-green-500/30 border-2 border-green-500" />
            <span className="text-gray-700 font-medium">Zone</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapView;
