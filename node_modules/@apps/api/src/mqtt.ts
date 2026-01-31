import mqtt from "mqtt";
import type { ButtonEvent, LedCommand } from "./types/iot";
import { emitButtonEvent } from "./socket";
import { updateBeltStatus } from "./services/andon.services";

const MQTT_BROKER = process.env.MQTT_BROKER || "mqtt://test.mosquitto.org:1883";

export const TOPIC_BUTTON_EVENT = "iot/device/event";
export const TOPIC_LED_CONTROL = "iot/device/led";

let client: mqtt.MqttClient | null = null;

export function initMQTT() {
  client = mqtt.connect(MQTT_BROKER);

  client.on("connect", () => {
    console.log("MQTT connected:", MQTT_BROKER);
    // client?.subscribe(TOPIC_BUTTON_EVENT);
    client?.subscribe(TOPIC_BUTTON_EVENT, (err) => {
      if (err) console.log("Subscribe error:", err);
      else console.log("Subscribed:", TOPIC_BUTTON_EVENT);
    });
  });

  client.on("message", async (topic, message) => {
    if (topic !== TOPIC_BUTTON_EVENT) return;

    try {
      const t0 = Date.now();
      const data: ButtonEvent = JSON.parse(message.toString());
      console.log("Button event:", data);
      console.log("nhận MQTT sau:", Date.now() - t0, "ms");
      // Realtime push sang web dashboard
      emitButtonEvent(data);
      // nhấn nút
      const t1 = Date.now();
      await updateBeltStatus(data);
      console.log("update DB/API mất:", Date.now() - t1, "ms");
    } catch (err) {
      console.log("MQTT parse error:", err);
    }
  });
}

export function publishLed(cmd: LedCommand) {
  if (!client) return;
  client.publish(TOPIC_LED_CONTROL, JSON.stringify(cmd));
}
