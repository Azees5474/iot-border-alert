#include <Arduino.h>
#include <TinyGPS++.h>

// =============================================================================
// STANDALONE GPS TEST BENCH (NEO-6M / NEO-7M / NEO-M8N)
// =============================================================================
// Wiring:
//   GPS VCC -> ESP32 5V (or 3.3V)
//   GPS GND -> ESP32 GND
//   GPS TX  -> ESP32 GPIO 16 (RX2)
//   GPS RX  -> ESP32 GPIO 17 (TX2)
// =============================================================================

#define GPS_RX_PIN 16
#define GPS_TX_PIN 17
#define GPS_BAUD 9600

TinyGPSPlus gps;
unsigned long lastDiagPrint = 0;
unsigned long bytesReceived = 0;

void setup() {
  Serial.begin(115200);
  delay(1000);

  Serial.println();
  Serial.println("==================================================");
  Serial.println("         ESP32 GPS HARDWARE DIAGNOSTIC TEST       ");
  Serial.println("==================================================");
  Serial.println("Wiring check:");
  Serial.println("  - GPS VCC -> ESP32 5V");
  Serial.println("  - GPS GND -> ESP32 GND");
  Serial.println("  - GPS TX  -> ESP32 GPIO 16 (RX2)");
  Serial.println("  - GPS RX  -> ESP32 GPIO 17 (TX2)");
  Serial.println("==================================================");
  Serial.println("Listening for NMEA sentences from GPS at 9600 baud...\n");

  Serial2.begin(GPS_BAUD, SERIAL_8N1, GPS_RX_PIN, GPS_TX_PIN);
}

void loop() {
  while (Serial2.available() > 0) {
    char c = Serial2.read();
    bytesReceived++;
    gps.encode(c);

    // Also echo raw NMEA stream to serial so you can see live sentences
    Serial.write(c);
  }

  // Periodic summary every 3 seconds
  if (millis() - lastDiagPrint >= 3000) {
    lastDiagPrint = millis();

    Serial.println();
    Serial.println("----------------- [GPS DIAGNOSTIC REPORT] -----------------");
    Serial.printf("Total Bytes Received : %lu\n", bytesReceived);
    Serial.printf("Sentences with Fix   : %lu\n", gps.sentencesWithFix());
    Serial.printf("Failed Checksums     : %lu\n", gps.failedChecksum());

    if (bytesReceived == 0) {
      Serial.println("\n[!] CAUTION: No data received from GPS yet!");
      Serial.println("    1. Verify GPS VCC is connected to 5V and GND to GND.");
      Serial.println("    2. Verify GPS TX is wired to GPIO 16 (ESP32 RX2).");
      Serial.println("    3. If reversed, swap GPIO 16 and GPIO 17.");
      Serial.println("    4. Check if the Power LED on the GPS board is lit.");
    } else {
      Serial.println("\n[OK] Serial communication is working!");
      if (gps.location.isValid()) {
        Serial.printf(">>> FIX STATUS: LOCKED! <<<\n");
        Serial.printf("    Latitude   : %.6f\n", gps.location.lat());
        Serial.printf("    Longitude  : %.6f\n", gps.location.lng());
        Serial.printf("    Satellites : %d\n", gps.satellites.value());
        Serial.printf("    HDOP       : %.2f\n", gps.hdop.hdop());
        Serial.printf("    Altitude   : %.1f m\n", gps.altitude.meters());
      } else {
        Serial.printf(">>> FIX STATUS: SEARCHING FOR SATELLITES... <<<\n");
        Serial.printf("    Satellites in view: %d\n", gps.satellites.isValid() ? gps.satellites.value() : 0);
        Serial.println("    NOTE: Near a window or outdoors is required for satellite fix.");
        Serial.println("    When locked, the onboard 'PPS / FIX' LED will blink once per second.");
      }
    }
    Serial.println("-----------------------------------------------------------\n");
  }
}
