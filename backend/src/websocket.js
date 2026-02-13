const WebSocket = require('ws');

function initWebsocket(server, mqttBus) {
  const wss = new WebSocket.Server({ server, path: '/ws' });

  console.log('[WS] WebSocket server initialized at /ws');

  wss.on('connection', (ws) => {
    console.log('[WS] Client connected');

    ws.send(
      JSON.stringify({
        type: 'info',
        message: 'Connected to MQTT live stream'
      })
    );

    ws.on('close', () => {
      console.log('[WS] Client disconnected');
    });
  });

  // When MQTT receives a message → broadcast to all WS clients
  mqttBus.on('message', (data) => {
    const msg = JSON.stringify({ type: 'mqtt_message', ...data });
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(msg);
      }
    });
  });

  return wss;
}

module.exports = {
  initWebsocket
};
