(function () {
  const statusEl = document.getElementById('connectionStatus');
  const latestTopicEl = document.getElementById('latestTopic');
  const latestPayloadEl = document.getElementById('latestPayload');
  const latestTimeEl = document.getElementById('latestTime');
  const messagesTableBody = document.getElementById('messagesTableBody');

  const MAX_ROWS = 50;
  let socket;

  function setStatus(text, ok) {
    statusEl.textContent = text;
    statusEl.classList.toggle('ok', !!ok);
    statusEl.classList.toggle('error', !ok);
  }

  function formatTime(ts) {
    const d = new Date(ts);
    return d.toLocaleString();
  }

  function addMessageRow(msg) {
    const tr = document.createElement('tr');

    const tdTime = document.createElement('td');
    const tdTopic = document.createElement('td');
    const tdPayload = document.createElement('td');

    tdTime.textContent = formatTime(msg.timestamp);
    tdTopic.textContent = msg.topic;
    tdPayload.textContent = msg.payload;

    tr.appendChild(tdTime);
    tr.appendChild(tdTopic);
    tr.appendChild(tdPayload);

    // Insert at top
    if (messagesTableBody.firstChild) {
      messagesTableBody.insertBefore(tr, messagesTableBody.firstChild);
    } else {
      messagesTableBody.appendChild(tr);
    }

    // Limit rows
    while (messagesTableBody.children.length > MAX_ROWS) {
      messagesTableBody.removeChild(messagesTableBody.lastChild);
    }
  }

  function handleMessage(data) {
    if (data.type === 'info') {
      setStatus(data.message, true);
      return;
    }

    if (data.type === 'mqtt_message') {
      // Update latest card
      latestTopicEl.textContent = data.topic;
      latestPayloadEl.textContent = data.payload;
      latestTimeEl.textContent = formatTime(data.timestamp);

      // Add to table
      addMessageRow(data);
    }
  }

  function connect() {
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const url = `${protocol}://${window.location.host}/ws`;

    socket = new WebSocket(url);

    socket.addEventListener('open', () => {
      setStatus('Connected to server', true);
    });

    socket.addEventListener('message', (event) => {
      try {
        const data = JSON.parse(event.data);
        handleMessage(data);
      } catch (err) {
        console.error('Failed to parse message', err);
      }
    });

    socket.addEventListener('close', () => {
      setStatus('Disconnected – retrying in 3s…', false);
      setTimeout(connect, 3000);
    });

    socket.addEventListener('error', (err) => {
      console.error('WebSocket error', err);
      setStatus('Error – check console', false);
    });
  }

  connect();
})();
