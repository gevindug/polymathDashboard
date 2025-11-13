const mqtt = require('mqtt');
const EventEmitter = require('events');

const mqttBus = new EventEmitter();

/**
 * Start MQTT client and wire events into mqttBus
 */
function startMqtt() {
  const url = process.env.MQTT_URL || 'mqtt://localhost:1883';
  const topic = process.env.MQTT_TOPIC || '#';

  const options = {};

  if (process.env.MQTT_USERNAME) {
    options.username = process.env.MQTT_USERNAME;
  }
  if (process.env.MQTT_PASSWORD) {
    options.password = process.env.MQTT_PASSWORD;
  }

  console.log(`[MQTT] Connecting to ${url}…`);

  const client = mqtt.connect(url, options);

  client.on('connect', () => {
    console.log('[MQTT] Connected');
    client.subscribe(topic, (err) => {
      if (err) {
        console.error('[MQTT] Subscribe error:', err.message);
      } else {
        console.log(`[MQTT] Subscribed to topic: ${topic}`);
      }
    });
  });

  client.on('reconnect', () => {
    console.log('[MQTT] Reconnecting…');
  });

  client.on('error', (err) => {
    console.error('[MQTT] Error:', err.message);
  });

  client.on('message', (topic, message) => {
    const payload = message.toString();
    const data = {
      topic,
      payload,
      timestamp: Date.now()
    };
    // Broadcast internally
    mqttBus.emit('message', data);
  });

  return client;
}

module.exports = {
  startMqtt,
  mqttBus
};
