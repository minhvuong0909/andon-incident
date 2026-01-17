import mqtt from "mqtt";
import type { ButtonEvent, LedCommand } from "./types/iot";
import { emitButtonEvent } from "./socket";

const MQTT_BROKER = process.env.MQTT_BROKER || "mqtt://broker.hivemq.com:1883";

export const TOPIC_BUTTON_EVENT = "iot/esp8266/event";
export const TOPIC_LED_CONTROL = "iot/esp8266/led";

let client: mqtt.MqttClient | null = null;

export function initMQTT() {
  client = mqtt.connect(MQTT_BROKER);

  client.on("connect", () => {
    console.log("MQTT connected:", MQTT_BROKER);
    client?.subscribe(TOPIC_BUTTON_EVENT);
  });

  client.on("message", (topic, message) => {
    if (topic !== TOPIC_BUTTON_EVENT) return;

    try {
      const data: ButtonEvent = JSON.parse(message.toString());
      console.log("Button event:", data);

      // Realtime push sang web dashboard
      emitButtonEvent(data);
    } catch (err) {
      console.log("MQTT parse error:", err);
    }
  });
}

export function publishLed(cmd: LedCommand) {
  if (!client) return;
  client.publish(TOPIC_LED_CONTROL, JSON.stringify(cmd));
}
