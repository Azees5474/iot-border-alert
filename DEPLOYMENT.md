# IoT Border Alert & Geofence Monitoring System

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Local Deployment (Testing)](#local-deployment-testing)
3. [Online Deployment (Production)](#online-deployment-production)
4. [ESP32 Setup](#esp32-setup)
5. [NEO-7M GPS Module Setup](#neo-7m-gps-module-setup)
6. [Frontend Deployment](#frontend-deployment)
7. [Testing the System](#testing-the-system)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

- **Node.js v16+** — https://nodejs.org/
- **npm** — comes with Node.js
- **ESP32 Dev Module** — for IoT controller
- **Arduino IDE** — for ESP32 programming
- **NEO-7M GPS Module** (optional) — for real GPS tracking
- **Git** — for deploying to Railway/Render

---

## Part 1: Local Deployment (Testing)

### Step 1: Install Dependencies

```bash
# Backend
cd backend
npm init -y
npm install express cors

# Frontend
cd frontend
npm install
```

### Step 2: Start Backend

```bash
cd backend
node server.js
```

You should see:
```
IoT Border Alert backend listening on http://localhost:3001
```

### Step 3: Start Frontend

```bash
cd frontend
npm run dev
```

You should see:
```
VITE v4.5.14  ready in 1722 ms
➜  Local:   http://localhost:5173/
```

### Step 4: Open Dashboard

1. Open browser: **http://localhost:5173**
2. You should see the dashboard with sidebar navigation
3. Go to **Live Tracking** page

### Step 5: Test GPS Tracking

**Option A: Phone GPS**
1. Open **http://localhost:5173** on your smartphone
2. Make sure phone and PC are on the same WiFi
3. Click **Start Tracking**
4. Allow location permission
5. You should see your location on the map

**Option B: Demo Mode**
1. Go to **Settings** → Enable **Demo Mode**
2. Go to **Live Tracking**
3. Click **Simulate Outside** — map shows red alert
4. Click **Simulate Inside** — map shows green safe

---

## Part 2: Online Deployment (Production)

### Step 1: Deploy Backend to Render

1. **Push code to GitHub**
    ```bash
    cd "E:\iot-border-alert"
    git init
    git add .
    git commit -m "Initial commit"
    git remote add origin https://github.com/your-username/iot-border-alert.git
    git push -u origin main
    ```

2. **Create Render account**
    - Go to https://render.com
    - Sign up with GitHub

3. **Create new Web Service**
    - Click **"New +"** → **"Web Service"**
    - Connect your `iot-border-alert` repository
    - **Root Directory**: `backend`
    - **Runtime**: Node
    - **Build Command**: `npm install`
    - **Start Command**: `node server.js`
    - **Instance Type**: Free

4. **Add environment variables**
    - Go to **Environment** tab
    - Add:
      ```
      PORT=3001
      CORS_ORIGIN=*
      ```

5. **Deploy**
    - Render builds and deploys automatically
    - You get a URL like: `https://iot-border-alert-we.onrender.com`

### Step 2: Update ESP32 for Online Mode

Open `backend/esp32_firmware/esp32_border_alert.ino` (or `esp32_border_alert_gps.ino`) and change:

```cpp
const char* ssid = "ESP32TEST";
const char* password = "12345678";
const char* backendUrl = "https://iot-border-alert-we.onrender.com";
const char* deviceId = "ESP32-001";
```

Upload to ESP32 via Arduino IDE.

### Step 3: Update Frontend for Online Mode

Create `frontend/.env`:
```
VITE_API_URL=https://iot-border-alert-we.onrender.com
```

Rebuild frontend:
```bash
cd frontend
npm run build
```

### Step 4: Deploy Frontend to Vercel (Free)

1. **Push frontend to separate repo** (or use same repo with different root)
    ```bash
    cd frontend
    git init
    git add .
    git commit -m "Frontend"
    git remote add origin https://github.com/your-username/iot-border-alert-frontend.git
    git push -u origin main
    ```

2. **Deploy on Vercel**
    - Go to https://vercel.com
    - Sign up with GitHub
    - Click **"New Project"**
    - Import your frontend repo
    - Set **Root Directory** to `frontend`
    - Add environment variable:
      ```
      VITE_API_URL=https://iot-border-alert-we.onrender.com
      ```
    - Click **Deploy**

3. **Your dashboard is now live!**
    - URL: `https://your-project.vercel.app`

---

## Part 3: ESP32 Setup

### Option A: Phone GPS Mode

**Firmware:** `backend/esp32_firmware/esp32_border_alert.ino`

**Wiring:**
| ESP32 Pin | Component | Description |
|-----------|-----------|-------------|
| GPIO 25 | Buzzer | Active buzzer (+ to GPIO, - to GND) |
| GPIO 21 | OLED SDA | I2C data |
| GPIO 22 | OLED SCL | I2C clock |
| 3V3 | OLED VCC | Power |
| GND | OLED GND | Ground |

**Configuration:**
```cpp
const char* ssid = "ESP32TEST";
const char* password = "12345678";
const char* backendUrl = "https://iot-border-alert-we.onrender.com";
const char* deviceId = "ESP32-001";
```

**How it works:**
1. ESP32 connects to WiFi
2. ESP32 registers with backend
3. ESP32 polls `/api/device/poll` every 2 seconds
4. Backend returns latest phone GPS and geofence status
5. ESP32 displays location and controls buzzer/OLED

**Upload:**
1. Open Arduino IDE
2. Select board: **ESP32 Dev Module**
3. Select port
4. Click **Upload**

### Option B: NEO-7M GPS Mode

**Firmware:** `backend/esp32_firmware/esp32_border_alert_gps.ino`

**Wiring:**
| Component | ESP32 Pin | Description |
|-----------|-----------|-------------|
| NEO-7M VCC | 5V | Power |
| NEO-7M GND | GND | Ground |
| NEO-7M TX | GPIO 16 | GPS TX → ESP32 RX |
| NEO-7M RX | GPIO 17 | GPS RX → ESP32 TX |
| OLED SDA | GPIO 21 | I2C data |
| OLED SCL | GPIO 22 | I2C clock |
| Buzzer | GPIO 25 | Active buzzer |

**Configuration:**
```cpp
const char* ssid = "ESP32TEST";
const char* password = "12345678";
const char* backendUrl = "https://iot-border-alert-we.onrender.com";
const char* deviceId = "ESP32-001";
```

**How it works:**
1. NEO-7M acquires satellite GPS fix
2. ESP32 reads NMEA data via Serial2
3. TinyGPS++ parses latitude, longitude, satellites, HDOP
4. ESP32 sends GPS to backend every 2 seconds
5. ESP32 polls `/api/device/poll` for geofence status
6. Backend calculates status based on ESP32's own GPS
7. ESP32 receives status and controls OLED/buzzer

**Required Libraries:**
- `Adafruit GFX Library`
- `Adafruit SSD1306`
- `TinyGPSPlus` by Mikal Hart

---

## Part 4: NEO-7M GPS Module Setup

### Wiring

```
NEO-7M GPS Module          ESP32
─────────────────          ─────────────────
VCC (3.3V/5V)    ────────► 5V
GND              ────────► GND
TX (GPS)        ────────► GPIO 16 (RX2)
RX (GPS)        ────────► GPIO 17 (TX2)
```

### How It Works

1. **NEO-7M** acquires satellite GPS fix
2. **ESP32** reads NMEA data via Serial2
3. **TinyGPS++** parses latitude, longitude, satellites, HDOP
4. **ESP32** sends GPS to backend every 2 seconds
5. **Backend** calculates geofence status
6. **ESP32** receives alert status and controls OLED/buzzer

### GPS Data Format

```json
{
  "latitude": 13.082680,
  "longitude": 80.270718,
  "accuracy": 5.0,
  "timestamp": "2024-01-01 12:00:00"
}
```

---

## Part 5: Frontend Deployment

### Build for Production

```bash
cd frontend
npm run build
```

This creates a `dist/` folder with optimized production files.

### Deploy to Vercel (Recommended)

1. **Push to GitHub**
   ```bash
   cd frontend
   git init
   git add .
   git commit -m "Frontend production build"
   git remote add origin https://github.com/your-username/iot-border-alert-frontend.git
   git push -u origin main
   ```

2. **Deploy on Vercel**
   - Go to https://vercel.com
   - Import your frontend repository
   - Set **Root Directory** to `frontend`
   - Add environment variable:
     ```
     VITE_API_URL=https://your-backend-url.com
     ```
   - Deploy

### Deploy to Netlify (Alternative)

1. Drag and drop the `frontend/dist/` folder to https://app.netlify.com/drop
2. Or connect GitHub repo for auto-deploy

---

## Part 6: Testing the System

### Test 1: Local Phone GPS
1. Start backend: `node server.js`
2. Start frontend: `npm run dev`
3. Open phone browser to `http://localhost:5173`
4. Start GPS tracking
5. Verify location appears on map

### Test 2: ESP32 Registration
1. Upload firmware to ESP32
2. Open Serial Monitor (115200 baud)
3. Look for: `Registered with backend: 200`
4. If you see this, ESP32 is connected

### Test 3: GPS Polling
1. Start GPS tracking on phone
2. Check ESP32 Serial Monitor
3. You should see:
    ```
    Location update:
      LAT: 13.082680
      LON: 80.270718
      ACC: 5.0 m
      DIST: 45 m
      ALERT: NO
    ```

### Test 4: Geofence Alert
1. Set geofence radius to **20m**
2. Move phone outside the radius (or use Demo Mode)
3. Check ESP32 OLED — should show `!ALERT! BREACHED`
4. Check buzzer — should beep
5. Move back inside — should show `SAFE` and buzzer stops

### Test 5: Online Deployment
1. Deploy backend to Render
2. Update ESP32 `backendUrl` to `https://iot-border-alert-we.onrender.com`
3. Update frontend `VITE_API_URL` to `https://iot-border-alert-we.onrender.com`
4. Deploy frontend to Vercel
5. Open frontend URL on phone (mobile data or any WiFi)
6. Start GPS tracking
7. ESP32 should receive updates from anywhere

---

## Part 7: Troubleshooting

### Backend Issues

| Problem | Solution |
|---------|----------|
| `EADDRINUSE` | Port 3001 is busy. Change `PORT` in `.env` or kill the process |
| `ECONNREFUSED` | Backend not running. Start with `node server.js` |
| CORS errors | Check `CORS_ORIGIN` environment variable |

### ESP32 Issues

| Problem | Solution |
|---------|----------|
| WiFi connection fails | Check SSID/password. ESP32 only supports 2.4GHz WiFi |
| `Registered with backend: -1` | Backend URL wrong or backend not accessible |
| OLED blank | Try changing `OLED_ADDRESS` to `0x3D` |
| GPS no fix | Go outdoors. NEO-7M needs clear sky view |
| GPS timeout | Check wiring: TX→GPIO16, RX→GPIO17 |
| Polling returns 404 | Make sure backend is deployed and URL is correct in firmware |
| Polling returns -1 | Backend URL must be HTTPS for Render |

### Frontend Issues

| Problem | Solution |
|---------|----------|
| Blank page | Check browser console for errors |
| API errors | Verify `VITE_API_URL` is correct |
| Map not loading | Check internet connection. OpenStreetMap tiles need internet |
| GPS permission denied | Enable location in browser settings |

### Online Deployment Issues

| Problem | Solution |
|---------|----------|
| ESP32 can't reach backend | Backend URL must be HTTPS for ESP32 |
| Frontend can't reach backend | Check CORS settings on backend |
| Railway deploy fails | Check logs. Make sure root directory is `backend` |
| Vercel build fails | Make sure `VITE_API_URL` is set in environment variables |

---

## Architecture Summary

```
┌─────────────────────────────────────────────────────────────┐
│                    ONLINE DEPLOYMENT                         │
│                                                              │
│  Phone (GPS) ──► Frontend (Vercel) ──► Backend (Render)    │
│                                               │              │
│                                               │              │
│  ESP32 + GPS ◄────────────────────────────────┘              │
│       │                                                     │
│       │  Polls /api/device/poll every 2s                     │
│       ▼                                                     │
│  OLED + Buzzer                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Environment Variables

### Backend (.env)
```
PORT=3001
CORS_ORIGIN=*
```

### Frontend (.env)
```
VITE_API_URL=https://iot-border-alert-we.onrender.com
```

---

## Security Notes

- **Development**: `CORS_ORIGIN=*` allows all origins
- **Production**: Restrict CORS to your frontend domain:
  ```
  CORS_ORIGIN=https://your-project.vercel.app
  ```
- **Never expose** API keys or secrets in frontend code
- **Always use HTTPS** in production

---

## Cost Estimate

| Service | Free Tier | Paid Tier |
|---------|-----------|-----------|
| Render (Backend) | 100 hours/month | $7/month |
| Vercel (Frontend) | 100GB bandwidth | $20/month |
| Ngrok (Testing) | 1 tunnel | $10/month |
| **Total** | **$0/month** | **$37/month** |

For a college project, the **free tier is more than enough**.

---

## Next Steps

1. Test locally with phone GPS
2. Test locally with NEO-7M GPS
3. Deploy backend to Render
4. Deploy frontend to Vercel
5. Update ESP32 with public URL `https://iot-border-alert-we.onrender.com`
6. Test from anywhere using mobile data

Good luck with your project!
