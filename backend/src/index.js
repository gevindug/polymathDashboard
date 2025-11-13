require('dotenv').config();

const express = require('express');
const http = require('http');
const path = require('path');
const { startMqtt, mqttBus } = require('./mqttClient');
const { initWebsocket } = require('./websocket');

const app = express();
const port = process.env.PORT || 3000;

// Serve static frontend
const publicDir = path.join(__dirname, '..', '..', 'public');
app.use(express.static(publicDir));

// Healthcheck endpoint (for monitoring / Kubernetes / etc.)
app.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

const server = http.createServer(app);

// Setup WebSocket + MQTT
const wss = initWebsocket(server, mqttBus);
const mqttClient = startMqtt();

// Start HTTP server
server.listen(port, () => {
  console.log(`[HTTP] Server listening on http://localhost:${port}`);
});

// Graceful shutdown
function shutdown(signal) {
  console.log(`\n[SYS] Received ${signal}, shutting down…`);

  wss.close(() => {
    console.log('[WS] WebSocket server closed');
  });

  mqttClient.end(true, () => {
    console.log('[MQTT] Client disconnected');
  });

  server.close(() => {
    console.log('[HTTP] Server closed');
    process.exit(0);
  });

  // Force exit if something hangs
  setTimeout(() => process.exit(1), 10000).unref();
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
