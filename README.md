# IoT Border Alert

ESP32-based GPS tracking and geofence alert system.

## Current Architecture

Phone GPS → Frontend → Backend (Render) → ESP32 (polling)

The phone is currently being used as a GPS source.

## Features

- Live GPS tracking
- ESP32 communication
- Geofence monitoring
- Buzzer alert
- Live website tracking
- Device connection status

## Future Architecture

GPS Module → ESP32 → Backend → Website

The phone GPS will later be replaced by a physical GPS module.