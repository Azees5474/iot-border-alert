#include <Arduino.h>

#define BUZZER_PIN 25

void setup() {
  Serial.begin(115200);
  pinMode(BUZZER_PIN, OUTPUT);
  Serial.println("=========================================");
  Serial.println("     ESP32 BUZZER HARDWARE TEST BENCH    ");
  Serial.println("=========================================");
  Serial.println("Testing BUZZER on GPIO 25...");
  Serial.println("Wiring:");
  Serial.println("  - Buzzer (+) / I/O -> ESP32 GPIO 25");
  Serial.println("  - Buzzer (-) / GND -> ESP32 GND");
  Serial.println("  - Buzzer VCC (if 3-pin module) -> 3.3V or 5V");
  Serial.println("=========================================");
}

void playBuzzer(unsigned long durationMs) {
  unsigned long start = millis();
  while (millis() - start < durationMs) {
    digitalWrite(BUZZER_PIN, HIGH);
    delayMicroseconds(200); // 2500Hz for passive buzzer
    digitalWrite(BUZZER_PIN, LOW);
    delayMicroseconds(200);
  }
  digitalWrite(BUZZER_PIN, LOW);
}

void loop() {
  Serial.println("Beeping 3 times...");
  for (int i = 0; i < 3; i++) {
    playBuzzer(150);
    delay(100);
  }
  delay(1500);

  Serial.println("Testing continuous tone (1 second)...");
  playBuzzer(1000);
  delay(2000);
}
