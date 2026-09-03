const express = require('express');
const cors = require('cors');
const http = require('http');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json());

// ===== Default configuration =====
const DEFAULT_GEOFENCE = {
  latitude: 13.082680,
  longitude: 80.270718,
  radius: 100,
};

// ===== In-memory state =====
let currentLocation = {
  latitude: 13.082680,
  longitude: 80.270718,
  accuracy: 0,
  timestamp: new Date().toISOString(),
};

let geofence = {
  latitude: DEFAULT_GEOFENCE.latitude,
  longitude: DEFAULT_GEOFENCE.longitude,
  radius: DEFAULT_GEOFENCE.radius,
};

let deviceStatus = {
  deviceId: 'ESP32-001',
  status: 'offline',
  lastSeen: null,
};

let alertHistory = [];
let registeredDevices = []; // { deviceId, ip, port, lastSeen }
let buzzerCommand = null;   // { id, action: 'on'|'off', ts }

// ===== Haversine formula =====
function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) *
      Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function computeStatus() {
  const distance = haversine(
    currentLocation.latitude,
    currentLocation.longitude,
    geofence.latitude,
    geofence.longitude,
  );
  const inside = distance <= geofence.radius;
  const alert = !inside;
  return { inside, distance: Math.round(distance), alert };
}

function addAlertEntry(inside, distance) {
  const alertEntry = {
    id: Date.now().toString(),
    time: new Date().toISOString(),
    latitude: currentLocation.latitude,
    longitude: currentLocation.longitude,
    accuracy: currentLocation.accuracy,
    distance: Math.round(distance),
    status: inside ? 'SAFE' : 'BREACHED',
    alert: !inside,
    timestamp: Date.now(),
  };
  alertHistory.push(alertEntry);
  if (alertHistory.length > 200) {
    alertHistory = alertHistory.slice(alertHistory.length - 200);
  }
  return alertEntry;
}

// ===== Middleware: auto-status =====
let lastAlertState = false;
function evaluateAndMaybeAlert() {
  const status = computeStatus();
  if (status.alert !== lastAlertState) {
    lastAlertState = status.alert;
    addAlertEntry(status.inside, status.distance);
  }
}

// ===== Forward GPS to ESP32 =====
async function forwardLocationToDevices() {
  const status = computeStatus();
  const payload = {
    latitude: currentLocation.latitude,
    longitude: currentLocation.longitude,
    accuracy: currentLocation.accuracy,
    distance: status.distance,
    alert: status.alert,
    inside: status.inside,
    timestamp: new Date().toISOString(),
  };

  for (const device of registeredDevices) {
    const url = `http://${device.ip}:${device.port || 80}/location?lat=${payload.latitude}&lon=${payload.longitude}&accuracy=${payload.accuracy}&distance=${payload.distance}&alert=${payload.alert ? 1 : 0}`;
    try {
      await http.get(url);
      device.lastSeen = new Date().toISOString();
    } catch (err) {
      console.error(`Failed to forward to ${device.deviceId}:`, err.message);
    }
  }
}

// ===== Routes =====

// --- Location ---
app.get('/api/location', (req, res) => {
  res.json(currentLocation);
});

app.post('/api/location', (req, res) => {
  const { latitude, longitude, accuracy, timestamp } = req.body;
  if (typeof latitude !== 'number' || typeof longitude !== 'number') {
    return res.status(400).json({ error: 'latitude and longitude are required numbers' });
  }
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return res.status(400).json({ error: 'latitude and longitude must be finite numbers' });
  }
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    return res.status(400).json({ error: 'latitude/longitude out of range' });
  }
  if (latitude === 0 && longitude === 0) {
    return res.status(400).json({ error: 'invalid coordinates (0,0)' });
  }
  currentLocation = {
    latitude,
    longitude,
    accuracy: accuracy ?? currentLocation.accuracy,
    timestamp: timestamp ?? new Date().toISOString(),
  };
  evaluateAndMaybeAlert();
  forwardLocationToDevices();
  res.json(currentLocation);
});

// --- Geofence ---
app.get('/api/geofence', (req, res) => {
  res.json(geofence);
});

app.post('/api/geofence', (req, res) => {
  const { latitude, longitude, radius } = req.body;
  geofence = {
    latitude: latitude ?? geofence.latitude,
    longitude: longitude ?? geofence.longitude,
    radius: radius ?? geofence.radius,
  };
  lastAlertState = false;
  res.json(geofence);
});

// --- Status ---
app.get('/api/status', (req, res) => {
  const status = computeStatus();
  res.json(status);
});

// --- Device status ---
app.post('/api/device/status', (req, res) => {
  const { deviceId, status } = req.body;
  deviceStatus = {
    deviceId: deviceId ?? deviceStatus.deviceId,
    status: status ?? deviceStatus.status,
    lastSeen: new Date().toISOString(),
  };
  res.json(deviceStatus);
});

app.get('/api/device/status', (req, res) => {
  res.json(deviceStatus);
});

// --- Device heartbeat ---
app.post('/api/device/heartbeat', (req, res) => {
  const { deviceId, status } = req.body;
  deviceStatus = {
    deviceId: deviceId ?? deviceStatus.deviceId,
    status: status ?? deviceStatus.status,
    lastSeen: new Date().toISOString(),
  };
  res.json({ ok: true, ...deviceStatus });
});

// --- ESP32 Poll ---
app.get('/api/device/poll', (req, res) => {
  const deviceId = req.query.deviceId;
  const status = computeStatus();
  let text =
    'lat=' + currentLocation.latitude +
    '&lon=' + currentLocation.longitude +
    '&acc=' + currentLocation.accuracy +
    '&dist=' + status.distance +
    '&alert=' + (status.alert ? 1 : 0);
  if (buzzerCommand) {
    text += '&buzzer=' + buzzerCommand.action;
    buzzerCommand = null;
  }
  res.type('text/plain').send(text);
});

// --- Buzzer command (sent from the website) ---
app.post('/api/device/buzzer', (req, res) => {
  const { action, deviceId } = req.body || {};
  if (action !== 'on' && action !== 'off') {
    return res.status(400).json({ error: "action must be 'on' or 'off'" });
  }
  buzzerCommand = {
    id: Date.now().toString(),
    action,
    deviceId: deviceId || null,
    ts: new Date().toISOString(),
  };
  res.json({ ok: true, command: buzzerCommand });
});

// --- ESP32 Register IP ---
app.post('/api/device/register', (req, res) => {
  const { deviceId, ip, port } = req.body;
  const existing = registeredDevices.find((d) => d.deviceId === deviceId);
  if (existing) {
    existing.ip = ip ?? existing.ip;
    existing.port = port ?? existing.port;
    existing.lastSeen = new Date().toISOString();
  } else {
    registeredDevices.push({
      deviceId: deviceId ?? 'ESP32-001',
      ip: ip ?? '127.0.0.1',
      port: port ?? 80,
      lastSeen: new Date().toISOString(),
    });
  }
  res.json({ ok: true, registeredDevices });
});

app.get('/api/devices', (req, res) => {
  res.json(registeredDevices);
});

// --- Alerts ---
app.get('/api/alerts', (req, res) => {
  res.json(alertHistory);
});

app.post('/api/alert', (req, res) => {
  const entry = {
    id: Date.now().toString(),
    ...req.body,
    time: req.body.time ?? new Date().toISOString(),
    timestamp: Date.now(),
  };
  alertHistory.push(entry);
  if (alertHistory.length > 200) {
    alertHistory = alertHistory.slice(alertHistory.length - 200);
  }
  res.status(201).json(entry);
});

app.delete('/api/alerts', (req, res) => {
  alertHistory = [];
  res.json({ ok: true });
});

// --- Fallback / health ---
app.get('/', (req, res) => {
  res.json({ service: 'IoT Border Alert Backend', status: 'running', port: PORT });
});

app.listen(PORT, () => {
  console.log(`IoT Border Alert backend listening on http://localhost:${PORT}`);
});
