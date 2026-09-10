import { useState, useEffect, useRef } from 'react';
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
import { Layers, Compass, Crosshair } from 'lucide-react';

type LatLngTuple = [number, number];

type MapStyle = 'dark' | 'satellite' | 'street';

interface MapViewProps {
  center: LatLngTuple;
  geofenceCenter: LatLngTuple;
  geofenceRadius: number;
  phoneMarker: LatLngTuple | null;
  showGeofenceCircle: boolean;
  inside: boolean;
}

const BASEMAPS: Record<
  MapStyle,
  { name: string; url: string; attribution: string; maxZoom: number }
> = {
  dark: {
    name: 'Radar Dark',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19,
  },
  satellite: {
    name: 'Satellite',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution:
      'Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics',
    maxZoom: 19,
  },
  street: {
    name: 'Streets',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19,
  },
};

const createPhoneIcon = () => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
    <circle cx="12" cy="12" r="10" fill="#0284c7" fill-opacity="0.3" stroke="#38bdf8" stroke-width="2"/>
    <polygon points="12,4 16,16 12,13 8,16" fill="#38bdf8" stroke="#ffffff" stroke-width="1.5" stroke-linejoin="round"/>
  </svg>`;
  return new L.DivIcon({
    html: svg,
    className: 'custom-phone-marker',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
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
      iconRetinaUrl:
        'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
      iconUrl:
        'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
      shadowUrl:
        'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
    });
  }, []);
  return null;
};

const FlyToPhone = ({ pos }: { pos: LatLngTuple | null }) => {
  const map = useMap();
  const lastPos = useRef<LatLngTuple | null>(null);
  useEffect(() => {
    if (!pos) return;
    const prev = lastPos.current;
    if (prev && prev[0] === pos[0] && prev[1] === pos[1]) return;
    lastPos.current = pos;
    map.flyTo(pos, 18, { duration: 1.5 });
  }, [pos, map]);
  return null;
};

const MapControls = ({
  geofenceCenter,
  phoneMarker,
  mapStyle,
  setMapStyle,
}: {
  geofenceCenter: LatLngTuple;
  phoneMarker: LatLngTuple | null;
  mapStyle: MapStyle;
  setMapStyle: (style: MapStyle) => void;
}) => {
  const map = useMap();

  return (
    <>
      {/* Top action buttons */}
      <div className="absolute top-4 left-4 z-[1000] flex items-center gap-2">
        <button
          className="glass-panel rounded-lg px-3.5 py-2 text-xs font-semibold hover:bg-panel-800/90 transition-all active:scale-95 text-ink-100 flex items-center gap-1.5 shadow-lg border border-cyan-500/20 disabled:opacity-40 disabled:cursor-not-allowed"
          onClick={() => {
            if (phoneMarker) map.flyTo(phoneMarker, 18, { duration: 1.2 });
          }}
          disabled={!phoneMarker}
          title="Zoom to device location"
        >
          <Crosshair size={14} className="text-signal-cyan" />
          Locate Vessel
        </button>
      </div>

      <div className="absolute top-4 right-4 z-[1000] flex items-center gap-2">
        <button
          className="glass-panel rounded-lg px-3.5 py-2 text-xs font-semibold hover:bg-panel-800/90 transition-all active:scale-95 text-ink-100 flex items-center gap-1.5 shadow-lg border border-cyan-500/20"
          onClick={() => map.setView(geofenceCenter, 18)}
          title="Center on geofence center"
        >
          <Compass size={14} className="text-signal-blue" />
          Center Zone
        </button>
      </div>

      {/* Layer Switcher - Bottom Left */}
      <div className="absolute bottom-4 left-4 z-[1000] glass-panel rounded-lg p-1.5 flex items-center gap-1 border border-cyan-500/20 shadow-xl backdrop-blur-md">
        <div className="px-2 text-[10px] uppercase font-bold tracking-wider text-ink-400 flex items-center gap-1">
          <Layers size={12} className="text-signal-cyan" />
          Map
        </div>
        {(['dark', 'satellite', 'street'] as MapStyle[]).map((style) => (
          <button
            key={style}
            onClick={() => setMapStyle(style)}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
              mapStyle === style
                ? 'bg-signal-cyan text-abyss-950 font-bold shadow-sm'
                : 'text-ink-200 hover:text-white hover:bg-panel-800/60'
            }`}
          >
            {BASEMAPS[style].name}
          </button>
        ))}
      </div>
    </>
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
  const [mapStyle, setMapStyle] = useState<MapStyle>('dark');

  const circleColor = inside ? '#22c55e' : '#ef4444';
  const currentBasemap = BASEMAPS[mapStyle];

  return (
    <div
      className={`relative h-[500px] w-full rounded-2xl border border-signal-cyan/20 overflow-hidden map-glow animate-scale-in ${
        mapStyle === 'dark' ? 'map-dark-tiles' : ''
      }`}
    >
      <FixLeafletAssets />
      <MapContainer
        center={center}
        zoom={17}
        className="h-full w-full"
        scrollWheelZoom={true}
      >
        <TileLayer
          key={mapStyle}
          attribution={currentBasemap.attribution}
          url={currentBasemap.url}
          maxZoom={currentBasemap.maxZoom}
        />

        <FlyToPhone pos={phoneMarker} />

        <MapControls
          geofenceCenter={geofenceCenter}
          phoneMarker={phoneMarker}
          mapStyle={mapStyle}
          setMapStyle={setMapStyle}
        />

        {showGeofenceCircle && (
          <Circle
            center={geofenceCenter}
            radius={geofenceRadius}
            pathOptions={{
              color: circleColor,
              fillColor: circleColor,
              fillOpacity: 0.25,
              weight: 3.5,
              dashArray: inside ? '6, 6' : '3, 3',
              className: inside ? 'animate-pulse-slow' : 'pulse-fast',
            }}
          >
            <Popup>
              <div className="text-xs space-y-1">
                <p className="font-bold text-white">Geofence Boundary</p>
                <p className="text-ink-300">Radius: {geofenceRadius} m</p>
                <p
                  className={`font-semibold ${
                    inside ? 'text-status-safe' : 'text-status-danger'
                  }`}
                >
                  Status: {inside ? 'SECURE' : 'BREACHED'}
                </p>
              </div>
            </Popup>
          </Circle>
        )}

        {phoneMarker && (
          <Marker position={phoneMarker} icon={PhoneIcon}>
            <Popup>
              <div className="text-xs space-y-1">
                <p className="font-bold text-signal-cyan">Vessel Position</p>
                <p className="font-mono text-white">
                  {phoneMarker[0].toFixed(6)}, {phoneMarker[1].toFixed(6)}
                </p>
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>

      {/* Legend overlay */}
      <div className="absolute bottom-4 right-4 z-[1000] glass-panel rounded-lg p-2.5 border border-cyan-500/20 shadow-xl backdrop-blur-md">
        <div className="flex items-center gap-3.5 hud-label text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-signal-cyan shadow-sm" />
            <span className="text-ink-100 normal-case tracking-normal font-medium">
              Vessel
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span
              className={`w-3.5 h-3.5 rounded-full border-2 ${
                inside
                  ? 'bg-status-safe/30 border-status-safe'
                  : 'bg-status-danger/30 border-status-danger animate-pulse'
              }`}
            />
            <span className="text-ink-100 normal-case tracking-normal font-medium">
              {inside ? 'Safe Zone' : 'Breach Alert'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapView;
