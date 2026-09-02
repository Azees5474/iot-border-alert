#include <WiFi.h>
#include <WebServer.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <HTTPClient.h>
#include <TinyGPS++.h>

// =====================================================
// OLED
// =====================================================

#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
#define OLED_RESET -1
#define OLED_ADDRESS 0x3C

// =====================================================
// PINS
// =====================================================

#define SDA_PIN 21
#define SCL_PIN 22
#define BUZZER_PIN 25
#define GPS_RX 16
#define GPS_TX 17

// =====================================================
// WIFI
// =====================================================

const char* ssid = "ESP32TEST";
const char* password = "12345678";

// =====================================================
// BACKEND CONFIG
// =====================================================

const char* backendUrl = "http://192.168.1.100:3001";
const char* deviceId = "ESP32-001";

// =====================================================
// OBJECTS
// =====================================================

Adafruit_SSD1306 display(
  SCREEN_WIDTH,
  SCREEN_HEIGHT,
  &Wire,
  OLED_RESET
);

WebServer server(80);
TinyGPSPlus gps;

// =====================================================
// GPS DATA
// =====================================================

double latitude = 0.0;
double longitude = 0.0;
double gpsAccuracy = 0.0;
double distance = 0.0;
bool alert = false;

bool locationReceived = false;

// =====================================================
// TIMERS
// =====================================================

unsigned long lastLocationReceived = 0;
unsigned long lastWiFiCheck = 0;
unsigned long lastReconnectAttempt = 0;
unsigned long lastAlarmBeep = 0;
unsigned long lastScreenUpdate = 0;
unsigned long lastBackendRegister = 0;
unsigned long lastGpsSend = 0;

// =====================================================
// SETTINGS
// =====================================================

const unsigned long LOCATION_TIMEOUT = 10000;
const unsigned long WIFI_CHECK_INTERVAL = 1000;
const unsigned long WIFI_RECONNECT_INTERVAL = 5000;
const unsigned long ALARM_BEEP_INTERVAL = 800;
const unsigned long SCREEN_UPDATE_INTERVAL = 500;
const unsigned long BACKEND_REGISTER_INTERVAL = 30000;
const unsigned long GPS_SEND_INTERVAL = 2000;

// =====================================================
// STATUS
// =====================================================

bool wifiLost = false;
bool phoneLost = false;

// =====================================================
// SHORT BEEP
// =====================================================

void shortBeep()
{
  digitalWrite(BUZZER_PIN, HIGH);
  delay(100);
  digitalWrite(BUZZER_PIN, LOW);
}

// =====================================================
// ALARM BEEP
// =====================================================

void alarmBeep()
{
  if (millis() - lastAlarmBeep >= ALARM_BEEP_INTERVAL)
  {
    lastAlarmBeep = millis();

    digitalWrite(BUZZER_PIN, HIGH);
    delay(150);
    digitalWrite(BUZZER_PIN, LOW);
  }
}

// =====================================================
// OLED BASIC
// =====================================================

void clearOLED()
{
  display.clearDisplay();
  display.setTextColor(SSD1306_WHITE);
}

// =====================================================
// STARTING SCREEN - BIG TEXT FOR 0.9"
// =====================================================

void showStarting()
{
  clearOLED();

  display.setTextSize(2);
  display.setCursor(0, 10);
  display.println("BORDER");

  display.setCursor(0, 30);
  display.println("ALERT");

  display.setTextSize(1);
  display.setCursor(0, 50);
  display.println("Starting...");

  display.display();
}

// =====================================================
// WIFI CONNECTING - BIG TEXT FOR 0.9"
// =====================================================

void showWiFiConnecting()
{
  clearOLED();

  display.setTextSize(2);
  display.setCursor(0, 10);
  display.println("WiFi");

  display.setCursor(0, 30);
  display.println("CONNECT");

  display.setTextSize(1);
  display.setCursor(0, 50);
  display.println(ssid);

  display.display();
}

// =====================================================
// WIFI CONNECTED - BIG TEXT FOR 0.9"
// =====================================================

void showWiFiConnected()
{
  clearOLED();

  display.setTextSize(2);
  display.setCursor(0, 5);
  display.println("WiFi OK");

  display.setTextSize(1);
  display.setCursor(0, 25);
  display.print("IP:");
  display.println(WiFi.localIP());

  display.setCursor(0, 40);
  display.print("RSSI:");
  display.print(WiFi.RSSI());
  display.println(" dBm");

  display.display();
}

// =====================================================
// WIFI LOST - BIG TEXT FOR 0.9"
// =====================================================

void showWiFiLost()
{
  clearOLED();

  display.setTextSize(2);
  display.setCursor(0, 10);
  display.println("WiFi");

  display.setCursor(0, 30);
  display.println("LOST");

  display.setTextSize(1);
  display.setCursor(0, 50);
  display.println("Reconnecting...");

  display.display();
}

// =====================================================
// PHONE LOST - BIG TEXT FOR 0.9"
// =====================================================

void showPhoneLost()
{
  clearOLED();

  display.setTextSize(2);
  display.setCursor(0, 10);
  display.println("GPS");

  display.setCursor(0, 30);
  display.println("LOST");

  display.setTextSize(1);
  display.setCursor(0, 50);
  display.println("No GPS data");

  display.display();
}

// =====================================================
// GPS WAITING - BIG TEXT FOR 0.9"
// =====================================================

void showGPSWaiting()
{
  clearOLED();

  display.setTextSize(2);
  display.setCursor(0, 10);
  display.println("GPS");

  display.setCursor(0, 30);
  display.println("SEARCH");

  display.setTextSize(1);
  display.setCursor(0, 50);
  display.println("Waiting for satellites...");

  display.display();
}

// =====================================================
// LOCATION - BIG TEXT FOR 0.9"
// =====================================================

void showLocation()
{
  clearOLED();

  display.setTextSize(1);
  display.setCursor(0, 0);
  display.println("GPS FIX:");

  display.setCursor(0, 12);
  display.print("LAT ");
  display.println(latitude, 4);

  display.setCursor(0, 24);
  display.print("LON ");
  display.println(longitude, 4);

  display.setCursor(0, 38);
  display.print("ACC ");
  display.print(gpsAccuracy, 1);
  display.println("m");

  display.setCursor(0, 52);
  display.print("SAT ");
  display.print(gps.satellites.value());
  display.print("  HDOP ");
  display.print(gps.hdop.value());

  display.display();
}

// =====================================================
// BORDER STATUS - BIG TEXT FOR 0.9"
// =====================================================

void showBorderStatus()
{
  clearOLED();

  if (alert) {
    display.setTextSize(2);
    display.setCursor(0, 0);
    display.println("!ALERT!");

    display.setTextSize(1);
    display.setCursor(0, 20);
    display.println("BREACHED");

    display.setTextSize(2);
    display.setCursor(0, 35);
    display.print(distance, 0);
    display.print("m");

    display.setTextSize(1);
    display.setCursor(0, 55);
    display.print("LAT:");
    display.print(latitude, 4);
  } else {
    display.setTextSize(2);
    display.setCursor(0, 0);
    display.println("SAFE");

    display.setTextSize(1);
    display.setCursor(0, 20);
    display.println("GPS ONLINE");

    display.setTextSize(2);
    display.setCursor(0, 35);
    display.print(distance, 0);
    display.print("m");

    display.setTextSize(1);
    display.setCursor(0, 55);
    display.print("LAT:");
    display.print(latitude, 4);
  }

  display.display();
}

// =====================================================
// ROOT PAGE
// =====================================================

void handleRoot()
{
  String message;

  message += "ESP32 Border Alert\n";
  message += "------------------------\n";

  message += "WiFi: ";

  if (WiFi.status() == WL_CONNECTED)
  {
    message += "CONNECTED\n";
  }
  else
  {
    message += "DISCONNECTED\n";
  }

  message += "IP: ";
  message += WiFi.localIP().toString();
  message += "\n";

  message += "Latitude: ";
  message += String(latitude, 6);
  message += "\n";

  message += "Longitude: ";
  message += String(longitude, 6);
  message += "\n";

  message += "Accuracy: ";
  message += String(gpsAccuracy, 1);
  message += " m\n";

  message += "Satellites: ";
  message += String(gps.satellites.value());
  message += "\n";

  message += "Alert: ";
  message += alert ? "YES" : "NO";
  message += "\n";

  server.send(
    200,
    "text/plain",
    message
  );
}

// =====================================================
// LOCATION ENDPOINT (receives from backend)
// =====================================================

void handleLocation()
{
  if (server.hasArg("lat")) {
    latitude = server.arg("lat").toDouble();
  }
  if (server.hasArg("lon")) {
    longitude = server.arg("lon").toDouble();
  }
  if (server.hasArg("accuracy")) {
    gpsAccuracy = server.arg("accuracy").toDouble();
  }
  if (server.hasArg("distance")) {
    distance = server.arg("distance").toDouble();
  }
  if (server.hasArg("alert")) {
    alert = server.arg("alert").toDouble() > 0.5;
  }

  lastLocationReceived = millis();
  locationReceived = true;

  if (phoneLost) {
    phoneLost = false;
    Serial.println("GPS reconnected");
    shortBeep();
  }

  Serial.println("Location update:");
  Serial.print("  LAT: "); Serial.println(latitude, 6);
  Serial.print("  LON: "); Serial.println(longitude, 6);
  Serial.print("  ACC: "); Serial.print(gpsAccuracy, 1); Serial.println(" m");
  Serial.print("  DIST: "); Serial.print(distance, 0); Serial.println(" m");
  Serial.print("  ALERT: "); Serial.println(alert ? "YES" : "NO");

  if (alert) {
    alarmBeep();
  } else {
    digitalWrite(BUZZER_PIN, LOW);
  }

  showBorderStatus();

  server.send(200, "text/plain", "Location received");
}

// =====================================================
// REGISTER WITH BACKEND
// =====================================================

void registerWithBackend() {
  if (WiFi.status() != WL_CONNECTED) return;

  HTTPClient http;
  String url = String(backendUrl) + "/api/device/register";

  http.begin(url);
  http.addHeader("Content-Type", "application/json");

  String body = "{\"deviceId\":\"";
  body += deviceId;
  body += "\",\"ip\":\"";
  body += WiFi.localIP().toString();
  body += "\",\"port\":80}";

  int code = http.POST(body);
  Serial.printf("Registered with backend: %d\n", code);
  http.end();
}

// =====================================================
// SEND GPS TO BACKEND
// =====================================================

void sendGpsToBackend() {
  if (WiFi.status() != WL_CONNECTED) return;
  if (!locationReceived) return;

  HTTPClient http;
  String url = String(backendUrl) + "/api/location";

  http.begin(url);
  http.addHeader("Content-Type", "application/json");

  String body = "{\"latitude\":";
  body += String(latitude, 6);
  body += ",\"longitude\":";
  body += String(longitude, 6);
  body += ",\"accuracy\":";
  body += String(gpsAccuracy, 1);
  body += ",\"timestamp\":\"";
  body += __DATE__;
  body += " ";
  body += __TIME__;
  body += "\"}";

  int code = http.POST(body);
  Serial.printf("GPS sent to backend: %d\n", code);
  http.end();
}

// =====================================================
// CHECK WIFI
// =====================================================

void checkWiFi()
{
  if (millis() - lastWiFiCheck < WIFI_CHECK_INTERVAL)
  {
    return;
  }

  lastWiFiCheck = millis();

  if (WiFi.status() == WL_CONNECTED)
  {
    if (wifiLost)
    {
      wifiLost = false;
      Serial.println("WiFi reconnected");
      showWiFiConnected();
      shortBeep();
    }

    if (millis() - lastBackendRegister >= BACKEND_REGISTER_INTERVAL) {
      lastBackendRegister = millis();
      registerWithBackend();
    }

    return;
  }

  if (!wifiLost)
  {
    wifiLost = true;
    Serial.println("WiFi disconnected!");
    showWiFiLost();
  }

  alarmBeep();

  if (millis() - lastReconnectAttempt >= WIFI_RECONNECT_INTERVAL)
  {
    lastReconnectAttempt = millis();
    Serial.println("Reconnecting WiFi...");
    WiFi.disconnect(false);
    delay(100);
    WiFi.begin(ssid, password);
  }
}

// =====================================================
// CHECK GPS SIGNAL
// =====================================================

void checkGpsSignal()
{
  if (!locationReceived) return;
  if (wifiLost) return;

  if (millis() - lastLocationReceived > LOCATION_TIMEOUT)
  {
    if (!phoneLost)
    {
      phoneLost = true;
      Serial.println("GPS signal lost!");
      showPhoneLost();
      alarmBeep();
    }
  }
  else
  {
    phoneLost = false;
  }
}

// =====================================================
// UPDATE OLED
// =====================================================

void updateOLED()
{
  if (millis() - lastScreenUpdate < SCREEN_UPDATE_INTERVAL)
  {
    return;
  }

  lastScreenUpdate = millis();

  if (wifiLost)
  {
    showWiFiLost();
    return;
  }

  if (phoneLost)
  {
    showPhoneLost();
    return;
  }

  if (!locationReceived)
  {
    showGPSWaiting();
    return;
  }

  showBorderStatus();
}

// =====================================================
// READ GPS FROM NEO-7M
// =====================================================

void readGps()
{
  while (Serial2.available() > 0)
  {
    gps.encode(Serial2.read());
  }

  if (gps.location.isValid())
  {
    latitude = gps.location.lat();
    longitude = gps.location.lng();
    gpsAccuracy = gps.hdop.value() * 5.0; // Approximate accuracy in meters

    if (gpsAccuracy < 1.0) gpsAccuracy = 1.0;
    if (gpsAccuracy > 100.0) gpsAccuracy = 100.0;

    lastLocationReceived = millis();

    if (!locationReceived)
    {
      locationReceived = true;
      Serial.println("GPS FIX ACQUIRED!");
      shortBeep();
    }
  }
}

// =====================================================
// SETUP
// =====================================================

void setup()
{
  Serial.begin(115200);
  delay(500);

  Serial.println();
  Serial.println("==============================");
  Serial.println("ESP32 BORDER ALERT SYSTEM");
  Serial.println("NEO-7M GPS MODULE");
  Serial.println("==============================");

  pinMode(BUZZER_PIN, OUTPUT);
  digitalWrite(BUZZER_PIN, LOW);

  Wire.begin(SDA_PIN, SCL_PIN);

  if (!display.begin(SSD1306_SWITCHCAPVCC, OLED_ADDRESS))
  {
    Serial.println("OLED initialization failed!");

    while (true)
    {
      digitalWrite(BUZZER_PIN, HIGH);
      delay(200);
      digitalWrite(BUZZER_PIN, LOW);
      delay(1000);
    }
  }

  showStarting();
  delay(1000);

  showWiFiConnecting();

  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);

  Serial.print("Connecting to WiFi: ");
  Serial.println(ssid);

  unsigned long wifiStartTime = millis();

  while (
    WiFi.status() != WL_CONNECTED &&
    millis() - wifiStartTime < 15000
  )
  {
    delay(500);
    Serial.print(".");
  }

  Serial.println();

  if (WiFi.status() == WL_CONNECTED)
  {
    Serial.println("==============================");
    Serial.println("WIFI CONNECTED!");
    Serial.print("IP Address: ");
    Serial.println(WiFi.localIP());
    Serial.print("Signal: ");
    Serial.print(WiFi.RSSI());
    Serial.println(" dBm");
    Serial.println("==============================");

    wifiLost = false;
    showWiFiConnected();
    delay(2000);

    registerWithBackend();
    lastBackendRegister = millis();
  }
  else
  {
    Serial.println("WIFI CONNECTION FAILED");
    Serial.println("Will keep trying...");
    wifiLost = true;
    showWiFiLost();
  }

  Serial.println("Starting GPS...");
  Serial2.begin(9600, SERIAL_8N1, GPS_RX, GPS_TX);

  // HTTP routes
  server.on("/", HTTP_GET, handleRoot);
  server.on("/location", HTTP_GET, handleLocation);
  server.on("/status", HTTP_GET, []() {
    String json = "{\"alert\":";
    json += alert ? "true" : "false";
    json += ",\"distance\":";
    json += String((int)distance);
    json += "}";
    server.send(200, "application/json", json);
  });

  server.begin();
  Serial.println("HTTP server started on port 80");
  Serial.print("Open: http://");
  Serial.print(WiFi.localIP());
  Serial.println("/");

  shortBeep();
}

// =====================================================
// LOOP
// =====================================================

void loop()
{
  server.handleClient();
  readGps();
  checkWiFi();
  checkGpsSignal();

  // Send GPS to backend periodically
  if (millis() - lastGpsSend >= GPS_SEND_INTERVAL)
  {
    lastGpsSend = millis();
    sendGpsToBackend();
  }

  updateOLED();
}
