# IoT Border Alert & Geofence Monitoring System

## Overview
Real-time GPS geofence monitoring using smartphone GPS, a web dashboard, and ESP32 IoT controller. The system tracks a phone's location via the browser, calculates distance to a geofence center using the Haversine formula, and triggers alerts when the device crosses the boundary.

## Architecture
```
Phone GPS -> Web App -> Backend (Express) -> ESP32 -> OLED + Buzzer
```

## Features
- Live GPS tracking via browser `navigator.geolocation`
- Interactive Leaflet map with OpenStreetMap tiles
- Geofence calculation (Haversine formula) — inside/outside detection
- Real-time breach alerts with history
- ESP32 device status monitoring & heartbeat
- Demo mode for presentations without GPS access
- Responsive dashboard — mobile drawer sidebar, desktop fixed sidebar
- Alert history with filtering and search
- Ocean-themed UI with animated waves, fishing boat imagery, and smooth transitions
- Glass morphism cards, pulsing status indicators, and animated status cards

## Project Structure
```
alert system/
├── backend/
│   ├── server.js          # Express API server (port 3001)
│   └── package.json
├── frontend/
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── src/
│       ├── App.tsx
│       ├── main.tsx
│       ├── index.css
│       ├── types/index.ts
│       ├── api/services.ts
│       ├── utils/geofence.ts
│       ├── utils/storage.ts
│       ├── hooks/
│       ├── components/
│       ├── pages/
│       └── context/AppContext.tsx
└── README.md
```

## Prerequisites
- Node.js v16+
- npm

## Installation

### Prerequisites
- Node.js v16+
- npm
- ESP32 board (for IoT controller)
- Arduino IDE (for ESP32 programming)

### Step-by-Step Setup

1. **Install Node.js** — download from https://nodejs.org/ and install.
2. **Install backend dependencies**
   ```bash
   cd backend
   npm init -y
   npm install express cors
   ```
3. **Install frontend dependencies**
   ```bash
   cd frontend
   npm install
   ```
4. **Start backend**
   ```bash
   cd backend
   node server.js
   ```
   The backend starts on port **3001**.
5. **Start frontend**
   ```bash
   cd frontend
   npm run dev
   ```
   The frontend starts on port **5173** with a dev proxy forwarding `/api` to `http://localhost:3001`.
6. **Open dashboard** — visit `http://localhost:5173` in your browser.
7. **Enable phone GPS** — open the same URL on your smartphone (ensure phone and backend are on the same network).
8. **Allow location permission** — the browser will ask for Location access. Click **Allow**.
9. **Start GPS tracking** — go to **Live Tracking** and click **Start Tracking**.
10. **Configure geofence** — go to **Geofence** and set the center latitude, longitude, and radius (default: 100 m).
11. **Connect ESP32 to Wi-Fi** — upload the Arduino code below and update `ssid` and `password`.
12. **Test OLED** — the ESP32 will display "BORDER SYSTEM / STATUS: SAFE" when inside.
13. **Test buzzer** — go to **Device** page and click **Test Buzzer**.
14. **Test geofence** — move your phone outside the geofence radius to trigger an alert.
15. **Run Demo Mode** — if GPS is unavailable, enable Demo Mode in Settings or Live Tracking and use the simulation buttons.

## Backend API

| Method | Endpoint              | Description                              |
|--------|-----------------------|------------------------------------------|
| GET    | `/api/location`       | Returns latest GPS `{latitude, longitude, accuracy, timestamp}` |
| POST   | `/api/location`       | Accepts GPS update `{latitude, longitude, accuracy, timestamp}` |
| GET    | `/api/geofence`       | Returns `{latitude, longitude, radius}` |
| POST   | `/api/geofence`       | Updates geofence config |
| GET    | `/api/status`         | Returns `{inside, distance, alert}` |
| POST   | `/api/device/status`  | ESP32 posts `{deviceId, status}` |
| POST   | `/api/device/heartbeat`| ESP32 heartbeat ping |
| GET    | `/api/device/status`  | Returns current device status |
| POST   | `/api/device/register`| ESP32 registers its IP `{deviceId, ip, port}` |
| GET    | `/api/devices`        | Returns list of registered ESP32 devices |
| POST   | `/api/alert`          | Stores an alert entry in history |
| GET    | `/api/alerts`         | Returns alert history array |
| DELETE | `/api/alerts`         | Clears alert history |

CORS is enabled for all origins.

### ESP32 Registration

When ESP32 connects to WiFi, it should call:

```cpp
POST /api/device/register
{
  "deviceId": "ESP32-001",
  "ip": "192.168.1.50",
  "port": 80
}
```

After registration, the backend will automatically forward all GPS updates to the ESP32.

### Example: GET /api/status
```json
{
  "inside": true,
  "distance": 45,
  "alert": false
}
```

## ESP32 Connection

The ESP32 runs a small web server and receives GPS updates directly from the backend.

### 1. Hardware Wiring

| ESP32 Pin | Component | Description |
|-----------|-----------|-------------|
| GPIO 25 | Buzzer | Active buzzer (+ to GPIO, - to GND) |
| GPIO 21 | OLED SDA | I2C data |
| GPIO 22 | OLED SCL | I2C clock |
| 3V3 | OLED VCC | Power |
| GND | OLED GND | Ground |

### 2. Arduino IDE Setup

1. Install **ESP32 Board Package**
2. Install libraries:
   - `Adafruit GFX Library`
   - `Adafruit SSD1306`

### 3. Configure and Upload

Open `backend/esp32_firmware/esp32_border_alert.ino` and update:

```cpp
const char* ssid = "ESP32TEST";
const char* password = "12345678";
const char* backendUrl = "http://192.168.1.100:3001";  // Your PC's IP
```

**Find your PC's IP:**
- Windows: `ipconfig` → IPv4 Address
- Mac/Linux: `ifconfig` → inet address

### 4. How It Works

```
Phone GPS → Web App → Backend (port 3001) → ESP32 (port 80)
                                            ↓
                                    OLED + Buzzer
```

1. ESP32 connects to WiFi `ESP32TEST`
2. ESP32 registers its IP with backend (`POST /api/device/register`)
3. Backend stores ESP32 IP
4. When frontend sends GPS to backend, backend forwards to ESP32:
   ```
   GET http://<esp32-ip>/location?lat=...&lon=...&accuracy=...&distance=...&alert=...
   ```
5. ESP32 updates OLED and controls buzzer

### 5. Testing

1. Open dashboard at http://localhost:5173
2. Go to **Live Tracking** → Start GPS
3. Enable **Demo Mode** → **Simulate Outside**
4. ESP32 OLED should show:
   ```
   !! BORDER ALERT !!
   GEOFENCE BREACHED
   Dist: 145 m
   ```
5. Buzzer should beep
6. **Simulate Inside** → OLED shows:
   ```
   BORDER SYSTEM
   GPS: ONLINE
   STATUS: SAFE
   Dist: 45 m
   ```
7. Buzzer stops

## Example ESP32 Arduino Code

```cpp
#include <WiFi.h>
#include <WebServer.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

const char* ssid = "ESP32TEST";
const char* password = "12345678";
const char* backendUrl = "http://192.168.1.100:3001";
const char* deviceId = "ESP32-001";

#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
#define OLED_RESET -1
#define OLED_ADDRESS 0x3C
Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);
#define BUZZER_PIN 25

WebServer server(80);

double latitude = 0.0;
double longitude = 0.0;
double gpsAccuracy = 0.0;
double distance = 0.0;
bool alert = false;
bool locationReceived = false;

unsigned long lastLocationReceived = 0;
unsigned long lastBackendRegister = 0;
const unsigned long LOCATION_TIMEOUT = 10000;
const unsigned long BACKEND_REGISTER_INTERVAL = 30000;

bool wifiLost = false;
bool phoneLost = false;

void shortBeep() {
  digitalWrite(BUZZER_PIN, HIGH);
  delay(100);
  digitalWrite(BUZZER_PIN, LOW);
}

void alarmBeep() {
  static unsigned long last = 0;
  if (millis() - last >= 800) {
    last = millis();
    digitalWrite(BUZZER_PIN, HIGH);
    delay(150);
    digitalWrite(BUZZER_PIN, LOW);
  }
}

void showBorderStatus() {
  display.clearDisplay();
  display.setTextSize(1);
  if (alert) {
    display.setCursor(0, 0); display.println("!! BORDER ALERT !!");
    display.setCursor(0, 18); display.println("GEOFENCE BREACHED");
    display.setCursor(0, 32); display.print("Dist: "); display.print(distance, 0); display.println(" m");
    display.setCursor(0, 45); display.print("LAT: "); display.println(latitude, 4);
  } else {
    display.setCursor(0, 0); display.println("BORDER SYSTEM");
    display.setCursor(0, 18); display.println("GPS: ONLINE");
    display.setCursor(0, 30); display.println("STATUS: SAFE");
    display.setCursor(0, 45); display.print("Dist: "); display.print(distance, 0); display.println(" m");
  }
  display.display();
}

void handleLocation() {
  if (server.hasArg("lat")) latitude = server.arg("lat").toDouble();
  if (server.hasArg("lon")) longitude = server.arg("lon").toDouble();
  if (server.hasArg("accuracy")) gpsAccuracy = server.arg("accuracy").toDouble();
  if (server.hasArg("distance")) distance = server.arg("distance").toDouble();
  if (server.hasArg("alert")) alert = server.arg("alert").toDouble() > 0.5;

  lastLocationReceived = millis();
  locationReceived = true;

  if (phoneLost) {
    phoneLost = false;
    Serial.println("Phone GPS reconnected");
    shortBeep();
  }

  Serial.printf("LAT: %.6f LON: %.6f ACC: %.1f DIST: %.0f ALERT: %s\n",
    latitude, longitude, gpsAccuracy, distance, alert ? "YES" : "NO");

  if (alert) alarmBeep();
  else digitalWrite(BUZZER_PIN, LOW);

  showBorderStatus();
  server.send(200, "text/plain", "OK");
}

void registerWithBackend() {
  if (WiFi.status() != WL_CONNECTED) return;
  HTTPClient http;
  http.begin(String(backendUrl) + "/api/device/register");
  http.addHeader("Content-Type", "application/json");
  StaticJsonDocument<200> doc;
  doc["deviceId"] = deviceId;
  doc["ip"] = WiFi.localIP().toString();
  doc["port"] = 80;
  String body; serializeJson(doc, body);
  int code = http.POST(body);
  Serial.printf("Registered with backend: %d\n", code);
  http.end();
}

void setup() {
  Serial.begin(115200);
  pinMode(BUZZER_PIN, OUTPUT);
  digitalWrite(BUZZER_PIN, LOW);
  Wire.begin(21, 22);
  display.begin(SSD1306_SWITCHCAPVCC, OLED_ADDRESS);
  display.clearDisplay();
  display.setTextSize(1);
  display.setCursor(0, 0); display.println("BORDER ALERT SYSTEM");
  display.setCursor(0, 20); display.println("Starting...");
  display.display();

  WiFi.begin(ssid, password);
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500); Serial.print("."); attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.printf("WiFi connected. IP: %s\n", WiFi.localIP().toString().c_str());
    registerWithBackend();
    lastBackendRegister = millis();
  } else {
    Serial.println("WiFi failed");
  }

  server.on("/", HTTP_GET, []() {
    server.send(200, "text/plain", "ESP32 Border Alert Ready");
  });
  server.on("/location", HTTP_GET, handleLocation);
  server.on("/status", HTTP_GET, []() {
    String json = "{\"alert\":" + String(alert ? "true" : "false") + ",\"distance\":" + String(distance, 0) + "}";
    server.send(200, "application/json", json);
  });
  server.begin();
  Serial.println("HTTP server started");
}

void loop() {
  server.handleClient();

  if (millis() - lastBackendRegister >= BACKEND_REGISTER_INTERVAL) {
    lastBackendRegister = millis();
    registerWithBackend();
  }

  if (locationReceived && millis() - lastLocationReceived > LOCATION_TIMEOUT) {
    if (!phoneLost) {
      phoneLost = true;
      Serial.println("Phone GPS lost!");
    }
  }

  static unsigned long lastScreen = 0;
  if (millis() - lastScreen >= 500) {
    lastScreen = millis();
    if (wifiLost) {
      display.clearDisplay();
      display.setCursor(0, 0); display.println("WIFI LOST");
      display.display();
    } else if (phoneLost) {
      display.clearDisplay();
      display.setCursor(0, 0); display.println("GPS LOST");
      display.display();
    } else if (!locationReceived) {
      display.clearDisplay();
      display.setCursor(0, 0); display.println("Waiting for GPS...");
      display.display();
    } else {
      showBorderStatus();
    }
  }
}
```

### Required Libraries for ESP32 (Arduino IDE)
- `WiFi` (built-in for ESP32 core)
- `HTTPClient` (built-in for ESP32 core)
- `ArduinoJson` by Benoit Blanchon
- `Adafruit GFX Library`
- `Adafruit SSD1306`
- `Wire` (built-in)

### Wiring
| ESP32 Pin | Component | Description |
|-----------|-----------|-------------|
| GPIO 18   | Buzzer    | Active buzzer (+ to GPIO, - to GND) |
| SDA (GPIO 21) | OLED SDA | I2C data |
| SCL (GPIO 22) | OLED SCL | I2C clock |
| 3V3       | OLED VCC  | Power |
| GND       | OLED GND  | Ground |

## How It Works

### Phone GPS Connection
1. User opens the web dashboard on a phone browser.
2. Clicks **Start GPS Tracking**.
3. Browser requests location permission.
4. `navigator.geolocation.watchPosition` sends coordinates to the backend.
5. Dashboard displays live location, distance, and geofence status.

### ESP32 Backend Connection
1. ESP32 connects to the same Wi-Fi network as the backend.
2. ESP32 sends device status to the backend.
3. ESP32 polls the backend for GPS, geofence, and alert status.
4. When `alert` is `true`, the ESP32 activates the buzzer and updates the OLED.

### Geofence Calculation
Uses the **Haversine formula** to calculate great-circle distance between the phone GPS and the geofence center:
- `distance <= radius` → **INSIDE**
- `distance > radius` → **OUTSIDE** (BREACH / ALERT)

## Demo Mode
When GPS is unavailable (e.g. indoors or on desktop), enable **Demo Mode** in Settings or the Live Tracking page to simulate inside/outside positions for presentations.

- **Simulate Inside** — places the phone at the geofence center.
- **Simulate Outside** — places the phone beyond the radius in a random direction.
- **Simulate Movement** — animates the phone along a path from inside → outside → inside.

## NEO-7M GPS Module Integration

Instead of using phone GPS, you can connect a **NEO-7M GPS module** directly to the ESP32.

### Wiring NEO-7M to ESP32

| NEO-7M Pin | ESP32 Pin | Description |
|------------|-----------|-------------|
| VCC | 5V | Power |
| GND | GND | Ground |
| TX | GPIO 16 | GPS TX → ESP32 RX |
| RX | GPIO 17 | GPS RX → ESP32 TX |

### Upload GPS Firmware

Use the GPS-specific firmware:
```
backend/esp32_firmware/esp32_border_alert_gps.ino
```

This firmware:
1. Reads GPS data from NEO-7M via Serial2 (pins 16/17)
2. Extracts latitude, longitude, accuracy, satellites, HDOP
3. Sends GPS to backend every 2 seconds via `POST /api/location`
4. Receives geofence status from backend via `GET /location`
5. Controls OLED and buzzer based on geofence breach

### How It Works (GPS Mode)

```
NEO-7M GPS Module → ESP32 → Backend → Frontend
                            ↓
                        OLED + Buzzer
```

1. NEO-7M gets satellite GPS fix
2. ESP32 reads NMEA data via Serial2
3. ESP32 parses lat/lon using TinyGPS++
4. ESP32 sends GPS to backend
5. Backend calculates geofence status
6. Backend forwards alert status to ESP32
7. ESP32 updates OLED and buzzer
8. Frontend shows live location on map

### Switching Between Phone GPS and NEO-7M

| Mode | GPS Source | Firmware |
|------|-----------|----------|
| Phone GPS | Smartphone browser | `esp32_border_alert.ino` |
| NEO-7M GPS | GPS module on ESP32 | `esp32_border_alert_gps.ino` |

### Required Libraries for GPS Mode
- `Adafruit GFX Library`
- `Adafruit SSD1306`
- `TinyGPSPlus` by Mikal Hart

### GPS Data Format Sent to Backend

```json
{
  "latitude": 13.082680,
  "longitude": 80.270718,
  "accuracy": 5.0,
  "timestamp": "2024-01-01 12:00:00"
}
```

### Backward Compatibility

The backend API remains **exactly the same**. Both phone GPS and NEO-7M GPS use the same endpoints:
- `POST /api/location` — send GPS data
- `GET /api/location` — receive latest GPS
- `GET /api/status` — get geofence status

The frontend dashboard works with **both modes** without any changes.

To make the system work over the internet (phone and ESP32 can connect from anywhere):

### Option 1: Quick Test with Ngrok (Recommended for Demo)

1. **Install ngrok** from https://ngrok.com/
2. **Start your backend**
   ```bash
   cd backend
   node server.js
   ```
3. **Expose port 3001**
   ```bash
   ngrok http 3001
   ```
4. **Copy the public URL** (e.g. `https://abc123.ngrok.io`)
5. **Update ESP32 firmware**
   ```cpp
   const char* backendUrl = "https://abc123.ngrok.io";
   ```
6. **Update frontend** — create `frontend/.env`:
   ```
   VITE_API_URL=https://abc123.ngrok.io
   ```
7. **Restart frontend**
   ```bash
   cd frontend
   npm run dev
   ```

### Option 2: Deploy Backend to Cloud (Permanent)

Deploy the backend to any Node.js hosting service:

- **Railway**: https://railway.app/
- **Render**: https://render.com/
- **Fly.io**: https://fly.io/
- **Heroku**: https://heroku.com/

After deployment, you will get a public URL like `https://your-app.railway.app`.

Then:
1. Update ESP32 `backendUrl` to the public URL
2. Update frontend `VITE_API_URL` to the public URL
3. Deploy frontend to **Vercel**, **Netlify**, or **GitHub Pages**

### Deployment Flow

```
Phone (anywhere) --> Public Backend --> ESP32 (via WiFi)
       |                  |
       v                  v
   Web Dashboard      OLED + Buzzer
```

### Important Notes for Online Deployment

1. **CORS** — Backend already allows all origins (`*`). For production, restrict to your domain:
   ```bash
   CORS_ORIGIN=https://your-dashboard.vercel.app
   ```

2. **ESP32 must have internet** — The ESP32 needs to reach the public backend URL. Make sure:
   - ESP32 is connected to WiFi with internet access
   - The backend URL is publicly accessible
   - No firewall blocks port 80/443

3. **Frontend deployment** — Build and deploy the frontend:
   ```bash
   cd frontend
   npm run build
   ```
   Deploy the `dist/` folder to Vercel, Netlify, or any static host.

4. **Environment variables** — Never hardcode IPs in production. Use environment variables:
   - Backend: `PORT`, `CORS_ORIGIN`
   - Frontend: `VITE_API_URL`
   - ESP32: Update `backendUrl` before uploading

## License
MIT
