#include <WiFi.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>

// =====================================================
// OLED
// =====================================================

#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
#define OLED_RESET -1
#define OLED_ADDRESS 0x3C

// Use I2C address 0x3D if your 0.9" OLED shows blank
//#define OLED_ADDRESS 0x3D

// =====================================================
// PINS
// =====================================================

#define SDA_PIN 21
#define SCL_PIN 22
#define BUZZER_PIN 25

// =====================================================
// WIFI
// =====================================================

const char* ssid = "ESP32TEST";
const char* password = "12345678";

// =====================================================
// BACKEND CONFIG
// =====================================================

// For local testing: use your PC's local IP, e.g. http://192.168.1.105:3001
// For online deployment: use your public backend URL, e.g. https://your-app.railway.app
const char* backendUrl = "https://iot-border-alert.onrender.com";
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

// =====================================================
// GPS DATA
// =====================================================

double latitude = 0.0;
double longitude = 0.0;
double gpsAccuracy = 0.0;
double distance = 0.0;
bool alert = false;

bool locationReceived = false;
bool buzzerForced = false; // commanded ON by website; overrides all local logic until 'off'

// =====================================================
// TIMERS
// =====================================================

unsigned long lastLocationReceived = 0;
unsigned long lastWiFiCheck = 0;
unsigned long lastReconnectAttempt = 0;
unsigned long lastAlarmBeep = 0;
unsigned long lastScreenUpdate = 0;
unsigned long lastBackendRegister = 0;
unsigned long lastPollTime = 0;

// =====================================================
// SETTINGS
// =====================================================

const unsigned long LOCATION_TIMEOUT = 10000;
const unsigned long WIFI_CHECK_INTERVAL = 1000;
const unsigned long WIFI_RECONNECT_INTERVAL = 5000;
const unsigned long ALARM_BEEP_INTERVAL = 800;
const unsigned long SCREEN_UPDATE_INTERVAL = 500;
const unsigned long BACKEND_REGISTER_INTERVAL = 30000;
const unsigned long POLL_INTERVAL = 5000;

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
// ALARM BEEP (continuous)
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
// SILENT (turn buzzer off explicitly)
// =====================================================

void silentBuzzer()
{
  digitalWrite(BUZZER_PIN, LOW);
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
  display.println("No phone data");

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
  display.println("WiFi");

  display.setCursor(0, 30);
  display.println("READY");

  display.setTextSize(1);
  display.setCursor(0, 50);
  display.println("Waiting for GPS...");

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
  display.println("LOCATION:");

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

  display.display();
}

// =====================================================
// BORDER STATUS - OPTIMIZED FOR 0.9" OLED
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
// PARSE TEXT RESPONSE
// =====================================================

String getValue(String data, String key)
{
  key = key + "=";
  int start = data.indexOf(key);
  if (start < 0) return "";
  start += key.length();
  int end = data.indexOf("&", start);
  if (end < 0) end = data.length();
  return data.substring(start, end);
}

// =====================================================
// POLL BACKEND FOR LOCATION AND STATUS
// =====================================================

void pollBackend()
{
  if (WiFi.status() != WL_CONNECTED) return;
  if (millis() - lastPollTime < POLL_INTERVAL) return;

  HTTPClient http;
  String url = String(backendUrl) + "/api/device/poll?deviceId=" + String(deviceId);

  if (String(backendUrl).startsWith("https://")) {
    WiFiClientSecure *client = new WiFiClientSecure;
    client->setInsecure();
    http.begin(*client, url);
  } else {
    http.begin(url);
  }
  http.setTimeout(20000);
  int code = http.GET();

  if (code == 200)
  {
    String payload = http.getString();
    latitude = getValue(payload, "lat").toDouble();
    longitude = getValue(payload, "lon").toDouble();
    gpsAccuracy = getValue(payload, "acc").toDouble();
    distance = getValue(payload, "dist").toDouble();
    alert = getValue(payload, "alert").toInt() > 0.5;

    lastLocationReceived = millis();
    locationReceived = true;

    if (phoneLost)
    {
      phoneLost = false;
      Serial.println("Phone GPS reconnected");
      shortBeep();
    }

    Serial.println("Location update:");
    Serial.print("  LAT: "); Serial.println(latitude, 6);
    Serial.print("  LON: "); Serial.println(longitude, 6);
    Serial.print("  ACC: "); Serial.print(gpsAccuracy, 1); Serial.println(" m");
    Serial.print("  DIST: "); Serial.print(distance, 0); Serial.println(" m");
    Serial.print("  ALERT: "); Serial.println(alert ? "YES" : "NO");

    String buzzerCmd = getValue(payload, "buzzer");
    if (buzzerCmd == "on") {
      buzzerForced = true;
    } else if (buzzerCmd == "off") {
      buzzerForced = false;
    }

    if (buzzerForced)
    {
      alarmBeep();
    }
    else if (alert)
    {
      alarmBeep();
    }
    else
    {
      silentBuzzer();
    }
  }

  http.end();
  lastPollTime = millis();
}

// =====================================================
// REGISTER WITH BACKEND
// =====================================================

void registerWithBackend() {
  if (WiFi.status() != WL_CONNECTED) return;

  HTTPClient http;
  String url = String(backendUrl) + "/api/device/register";

  if (String(backendUrl).startsWith("https://")) {
    WiFiClientSecure *client = new WiFiClientSecure;
    client->setInsecure();
    http.begin(*client, url);
  } else {
    http.begin(url);
  }
  http.setTimeout(20000);
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

    // Re-register with backend periodically
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
    shortBeep();
  }

  silentBuzzer();

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
// CHECK PHONE GPS CONNECTION
// =====================================================

void checkPhoneConnection()
{
  if (!locationReceived) return;
  if (wifiLost) return;

  if (millis() - lastLocationReceived > LOCATION_TIMEOUT)
  {
    if (!phoneLost)
    {
      phoneLost = true;
      Serial.println("Phone GPS lost!");
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
// SETUP
// =====================================================

void setup()
{
  Serial.begin(115200);
  delay(500);

  Serial.println();
  Serial.println("==============================");
  Serial.println("ESP32 BORDER ALERT SYSTEM");
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
  lastPollTime = millis();
}
  else
  {
    Serial.println("WIFI CONNECTION FAILED");
    Serial.println("Will keep trying...");
    wifiLost = true;
    showWiFiLost();
  }

  Serial.println("Starting polling...");

  shortBeep();
}

// =====================================================
// LOOP
// =====================================================

void loop()
{
  checkWiFi();
  checkPhoneConnection();
  pollBackend();
  updateOLED();
}