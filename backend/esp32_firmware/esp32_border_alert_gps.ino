#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <HTTPClient.h>

// =====================================================
// OLED DISPLAY SETTINGS (0.96" I2C SSD1306 128x64)
// =====================================================

#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
#define OLED_RESET -1
#define OLED_ADDRESS 0x3C

// =====================================================
// HARDWARE PINS
// =====================================================

#define SDA_PIN 21
#define SCL_PIN 22
#define BUZZER_PIN 25

// =====================================================
// WIFI CONFIGURATION
// =====================================================

const char* ssid = "ESP32TEST";
const char* password = "12345678";

// =====================================================
// BACKEND CONFIGURATION
// =====================================================
// Local PC Backend on the "ESP32TEST" hotspot network:
const char* backendUrl = "http://10.99.77.172:3001";

// Alternative (Render Cloud Backend):
// const char* backendUrl = "https://iot-border-alert-we.onrender.com";

const char* deviceId = "ESP32-001";

// =====================================================
// OBJECTS & STATE
// =====================================================

Adafruit_SSD1306 display(
  SCREEN_WIDTH,
  SCREEN_HEIGHT,
  &Wire,
  OLED_RESET
);

// Location & Status (Received from Phone via Backend)
double latitude = 0.0;
double longitude = 0.0;
double gpsAccuracy = 0.0;
double distance = 0.0;
bool alert = false;
bool locationReceived = false;

// Status Flags
bool wifiLost = false;
bool phoneLost = false;
bool manualBuzzerTest = false;
unsigned long manualBuzzerStart = 0;
const unsigned long MANUAL_BUZZER_DURATION = 4000; // 4 seconds test beep

// Timers
unsigned long lastLocationReceived = 0;
unsigned long lastWiFiCheck = 0;
unsigned long lastReconnectAttempt = 0;
unsigned long lastAlarmBeep = 0;
unsigned long lastScreenUpdate = 0;
unsigned long lastBackendRegister = 0;
unsigned long lastPollTime = 0;

// Settings
const unsigned long LOCATION_TIMEOUT = 12000;      // 12s without phone update = Phone Lost
const unsigned long WIFI_CHECK_INTERVAL = 1500;
const unsigned long WIFI_RECONNECT_INTERVAL = 5000;
const unsigned long ALARM_BEEP_INTERVAL = 500;
const unsigned long SCREEN_UPDATE_INTERVAL = 250;
const unsigned long BACKEND_REGISTER_INTERVAL = 30000;
const unsigned long POLL_INTERVAL = 1000;          // Poll every 1s for fast buzzer response

// =====================================================
// BUZZER TEST & CONTROL FUNCTIONS (Active + Passive Buzzers)
// =====================================================

void playBuzzer(unsigned long durationMs)
{
  if (durationMs < 40) durationMs = 40;

  // 1. Steady HIGH burst: Drives Active Buzzers at full loudness
  digitalWrite(BUZZER_PIN, HIGH);
  delay(durationMs / 2);
  digitalWrite(BUZZER_PIN, LOW);
  delay(15);

  // 2. 2000Hz Square Wave: Drives Passive Buzzers at full resonant volume
  unsigned long start = millis();
  unsigned long toneDuration = durationMs / 2;
  while (millis() - start < toneDuration)
  {
    digitalWrite(BUZZER_PIN, HIGH);
    delayMicroseconds(250);
    digitalWrite(BUZZER_PIN, LOW);
    delayMicroseconds(250);
  }
  digitalWrite(BUZZER_PIN, LOW);
}

void shortBeep()
{
  playBuzzer(120);
}

void alarmBeep()
{
  if (millis() - lastAlarmBeep >= ALARM_BEEP_INTERVAL)
  {
    lastAlarmBeep = millis();
    playBuzzer(180);
  }
}

// =====================================================
// OLED HELPER
// =====================================================

void clearOLED()
{
  display.clearDisplay();
  display.setTextColor(SSD1306_WHITE);
}

// =====================================================
// OLED SCREENS
// =====================================================

void showStarting()
{
  clearOLED();
  display.setTextSize(2);
  display.setCursor(0, 8);
  display.println("BORDER");
  display.setCursor(0, 28);
  display.println("ALERT");
  display.setTextSize(1);
  display.setCursor(0, 50);
  display.println("Phone GPS Mode");
  display.display();
}

void showWiFiConnecting()
{
  clearOLED();
  display.setTextSize(2);
  display.setCursor(0, 8);
  display.println("WiFi");
  display.setCursor(0, 28);
  display.println("CONNECT");
  display.setTextSize(1);
  display.setCursor(0, 50);
  display.println(ssid);
  display.display();
}

void showWiFiConnected()
{
  clearOLED();
  display.setTextSize(2);
  display.setCursor(0, 5);
  display.println("WiFi OK");

  display.setTextSize(1);
  display.setCursor(0, 26);
  display.print("IP: ");
  display.println(WiFi.localIP());

  display.setCursor(0, 38);
  display.print("RSSI: ");
  display.print(WiFi.RSSI());
  display.println(" dBm");

  display.setCursor(0, 50);
  display.println("Connecting backend...");
  display.display();
}

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

void showPhoneLost()
{
  clearOLED();
  display.setTextSize(2);
  display.setCursor(0, 8);
  display.println("PHONE GPS");
  display.setCursor(0, 28);
  display.println("NO SIGNAL");
  display.setTextSize(1);
  display.setCursor(0, 50);
  display.println("Open app on phone");
  display.display();
}

void showWaitingPhone()
{
  clearOLED();
  display.setTextSize(2);
  display.setCursor(0, 6);
  display.println("PHONE GPS");

  display.setTextSize(1);
  display.setCursor(0, 28);
  display.println("Waiting for phone...");
  display.setCursor(0, 40);
  display.println("Open website GPS");
  display.setCursor(0, 52);
  display.print("WiFi: OK (");
  display.print(WiFi.RSSI());
  display.println("dBm)");
  display.display();
}

void showBuzzerTestScreen()
{
  clearOLED();
  display.fillRect(0, 0, 128, 16, SSD1306_WHITE);
  display.setTextColor(SSD1306_BLACK, SSD1306_WHITE);
  display.setTextSize(1);
  display.setCursor(18, 4);
  display.println("TEST BUZZER");

  display.setTextColor(SSD1306_WHITE);
  display.setTextSize(2);
  display.setCursor(8, 24);
  display.println("BUZZER ON");

  display.setTextSize(1);
  display.setCursor(12, 48);
  display.println("Website Command");
  display.display();
}

void showBorderStatus()
{
  clearOLED();

  if (alert)
  {
    // BORDER BREACH ALERT
    display.fillRect(0, 0, 128, 14, SSD1306_WHITE);
    display.setTextColor(SSD1306_BLACK, SSD1306_WHITE);
    display.setTextSize(1);
    display.setCursor(16, 3);
    display.println("! BORDER ALERT !");

    display.setTextColor(SSD1306_WHITE);
    display.setTextSize(2);
    display.setCursor(0, 18);
    display.println("BREACHED");

    display.setTextSize(1);
    display.setCursor(0, 38);
    display.print("DIST: ");
    display.print(distance, 0);
    display.println(" m");

    display.setCursor(0, 50);
    display.print("LAT: ");
    display.print(latitude, 4);
    display.print(" LON: ");
    display.print(longitude, 4);
  }
  else
  {
    // SAFE ZONE
    display.setTextSize(1);
    display.setCursor(0, 0);
    display.println("PHONE GPS TRACKING");
    display.drawLine(0, 10, 127, 10, SSD1306_WHITE);

    display.setTextSize(2);
    display.setCursor(0, 15);
    display.println("SAFE");

    display.setTextSize(1);
    display.setCursor(0, 36);
    display.print("BORDER DIST: ");
    display.print(distance, 0);
    display.println(" m");

    display.setCursor(0, 48);
    display.print("LAT: ");
    display.print(latitude, 4);
    display.print(" ACC: ");
    display.print(gpsAccuracy, 0);
    display.println("m");
  }

  display.display();
}

// =====================================================
// PARSE TEXT RESPONSE FROM BACKEND
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
// HTTP / HTTPS HELPER (Auto SSL bypass for Render HTTPS)
// =====================================================

bool httpConnect(HTTPClient& http, WiFiClientSecure& secureClient, WiFiClient& standardClient, const String& url)
{
  if (url.startsWith("https://"))
  {
    secureClient.setInsecure(); // Bypass certificate validation for Render / Cloudflare SSL
    return http.begin(secureClient, url);
  }
  else
  {
    return http.begin(standardClient, url);
  }
}

// =====================================================
// REGISTER WITH BACKEND
// =====================================================

void registerWithBackend()
{
  if (WiFi.status() != WL_CONNECTED) return;

  HTTPClient http;
  WiFiClientSecure secureClient;
  WiFiClient standardClient;
  String url = String(backendUrl) + "/api/device/register";

  if (!httpConnect(http, secureClient, standardClient, url)) return;
  http.addHeader("Content-Type", "application/json");

  String body = "{\"deviceId\":\"";
  body += deviceId;
  body += "\",\"ip\":\"";
  body += WiFi.localIP().toString();
  body += "\",\"port\":80}";

  int code = http.POST(body);
  Serial.printf("[BACKEND] Registered device %s: HTTP %d\n", deviceId, code);
  http.end();
}

// =====================================================
// POLL BACKEND FOR PHONE GPS & BUZZER COMMANDS
// =====================================================

void pollBackend()
{
  if (WiFi.status() != WL_CONNECTED) return;
  if (millis() - lastPollTime < POLL_INTERVAL) return;

  HTTPClient http;
  WiFiClientSecure secureClient;
  WiFiClient standardClient;
  String url = String(backendUrl) + "/api/device/poll?deviceId=" + String(deviceId);

  if (!httpConnect(http, secureClient, standardClient, url))
  {
    Serial.println("[HTTP] Connect failed");
    return;
  }

  http.setTimeout(3000);
  int code = http.GET();

  if (code == 200)
  {
    String payload = http.getString();
    double newLat = getValue(payload, "lat").toDouble();
    double newLon = getValue(payload, "lon").toDouble();
    gpsAccuracy = getValue(payload, "acc").toDouble();
    distance = getValue(payload, "dist").toDouble();
    alert = getValue(payload, "alert").toInt() > 0;

    // Check if valid coordinates received
    if (newLat != 0.0 || newLon != 0.0)
    {
      latitude = newLat;
      longitude = newLon;
      lastLocationReceived = millis();
      locationReceived = true;

      if (phoneLost)
      {
        phoneLost = false;
        Serial.println("[PHONE GPS] Reconnected!");
        shortBeep();
      }
    }

    // Check for buzzer command from website
    String buzzerCmd = getValue(payload, "buzzer");
    if (buzzerCmd == "on")
    {
      manualBuzzerTest = true;
      manualBuzzerStart = millis();
      Serial.println();
      Serial.println("**************************************************");
      Serial.println("*  >>> [WEBSITE COMMAND] TEST BUZZER PLAYING! <<< *");
      Serial.println("**************************************************");

      // Distinct 3-beep burst immediately
      for (int i = 0; i < 3; i++)
      {
        playBuzzer(150);
        delay(100);
      }
    }
    else if (buzzerCmd == "off")
    {
      manualBuzzerTest = false;
      digitalWrite(BUZZER_PIN, LOW);
      Serial.println("[WEBSITE COMMAND] Buzzer stopped");
    }

    Serial.printf("[POLL] Dist: %.0fm | Alert: %s | Buzzer: %s | Lat: %.5f, Lon: %.5f\n",
                  distance,
                  alert ? "YES" : "NO",
                  buzzerCmd.length() > 0 ? buzzerCmd.c_str() : "none",
                  latitude,
                  longitude);
  }
  else
  {
    Serial.printf("[POLL WARNING] HTTP GET returned: %d\n", code);
  }

  http.end();
  lastPollTime = millis();
}

// =====================================================
// CHECK WIFI STATUS
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
      Serial.println("[WIFI] Reconnected!");
      showWiFiConnected();
      shortBeep();
    }

    if (millis() - lastBackendRegister >= BACKEND_REGISTER_INTERVAL)
    {
      lastBackendRegister = millis();
      registerWithBackend();
    }

    return;
  }

  if (!wifiLost)
  {
    wifiLost = true;
    Serial.println("[WIFI] Disconnected!");
    showWiFiLost();
  }

  alarmBeep();

  if (millis() - lastReconnectAttempt >= WIFI_RECONNECT_INTERVAL)
  {
    lastReconnectAttempt = millis();
    Serial.println("[WIFI] Attempting reconnect...");
    WiFi.disconnect(false);
    delay(100);
    WiFi.begin(ssid, password);
  }
}

// =====================================================
// CHECK PHONE GPS SIGNAL TIMEOUT
// =====================================================

void checkPhoneSignal()
{
  if (!locationReceived) return;
  if (wifiLost) return;

  if (millis() - lastLocationReceived > LOCATION_TIMEOUT)
  {
    if (!phoneLost)
    {
      phoneLost = true;
      Serial.println("[PHONE GPS] Signal lost! No updates in 12 seconds.");
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
// UPDATE OLED DISPLAY
// =====================================================

void updateOLED()
{
  if (millis() - lastScreenUpdate < SCREEN_UPDATE_INTERVAL)
  {
    return;
  }

  lastScreenUpdate = millis();

  // Test buzzer takes highest priority on OLED
  if (manualBuzzerTest)
  {
    showBuzzerTestScreen();
    return;
  }

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
    showWaitingPhone();
    return;
  }

  showBorderStatus();
}

// =====================================================
// HANDLE BUZZER STATE (ALARM & TEST)
// =====================================================

void handleBuzzer()
{
  // Test buzzer timeout
  if (manualBuzzerTest)
  {
    if (millis() - manualBuzzerStart >= MANUAL_BUZZER_DURATION)
    {
      manualBuzzerTest = false;
      digitalWrite(BUZZER_PIN, LOW);
      Serial.println("[BUZZER] Test period finished.");
    }
    else
    {
      alarmBeep(); // Beep continuously during test period
      return;
    }
  }

  // Border breach alert
  if (alert)
  {
    alarmBeep();
  }
  else
  {
    digitalWrite(BUZZER_PIN, LOW);
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
  Serial.println("===========================================");
  Serial.println("   ESP32 BORDER ALERT SYSTEM - PHONE GPS   ");
  Serial.println("===========================================");

  pinMode(BUZZER_PIN, OUTPUT);
  digitalWrite(BUZZER_PIN, LOW);

  // Self-test buzzer hardware on GPIO 25 on boot
  Serial.println("===========================================");
  Serial.println("Testing BUZZER on GPIO 25 (3 beeps)...");
  for (int i = 0; i < 3; i++)
  {
    playBuzzer(150);
    delay(100);
  }
  Serial.println("Buzzer hardware test OK!");
  Serial.println("===========================================");

  Wire.begin(SDA_PIN, SCL_PIN);

  if (!display.begin(SSD1306_SWITCHCAPVCC, OLED_ADDRESS))
  {
    Serial.println("[ERROR] OLED SSD1306 initialization failed!");
    while (true)
    {
      digitalWrite(BUZZER_PIN, HIGH);
      delay(200);
      digitalWrite(BUZZER_PIN, LOW);
      delay(800);
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
  while (WiFi.status() != WL_CONNECTED && millis() - wifiStartTime < 12000)
  {
    delay(400);
    Serial.print(".");
  }
  Serial.println();

  if (WiFi.status() == WL_CONNECTED)
  {
    Serial.println("===========================================");
    Serial.println("WIFI CONNECTED SUCCESSFULLY!");
    Serial.print("IP Address: ");
    Serial.println(WiFi.localIP());
    Serial.print("Signal RSSI: ");
    Serial.print(WiFi.RSSI());
    Serial.println(" dBm");
    Serial.println("===========================================");

    wifiLost = false;
    showWiFiConnected();
    delay(1500);

    registerWithBackend();
    lastBackendRegister = millis();
    lastPollTime = millis();
  }
  else
  {
    Serial.println("WiFi connection pending (will retry in background)");
    wifiLost = true;
    showWiFiLost();
  }

  // Confirm buzzer hardware with 2 quick chirps on boot
  shortBeep();
  delay(100);
  shortBeep();

  Serial.println("System initialized. Listening for Phone GPS and Buzzer commands...");
}

// =====================================================
// MAIN LOOP
// =====================================================

void loop()
{
  checkWiFi();
  checkPhoneSignal();
  pollBackend();
  handleBuzzer();
  updateOLED();
}
