const express = require('express');
const fs = require('fs');
const path = require('path');

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const app = express();
const PORT = process.env.PORT || 8080;

/* ===== CORS ===== */
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

app.use(express.json());

/* ===== DATA ===== */
const DATA_FILE = path.join(__dirname, 'statuses.json');
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify({}, null, 2));
}

/* ===== WEBHOOK FROM BITRIX ===== */
app.post('/webhook', (req, res) => {
  const projectId = req.body.PROJECT_ID;
  const stage = req.body.STAGE_ID;
  const objectId = req.body.PROPERTY_VALUES?.OBJECT_ID;

  if (!projectId || !stage || !objectId) {
    return res.status(400).json({ success: false, error: 'Нет PROJECT_ID, STAGE_ID или OBJECT_ID' });
  }

  const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));

  if (!data[projectId]) data[projectId] = {};
  data[projectId][objectId] = stage === 'WON' ? 'sold' : 'available';

  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  res.json({ success: true });
});

/* ===== STATUSES FOR TILDA ===== */
app.get('/statuses.json', (req, res) => {
  const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  res.json(data);
});

/* ===== SCRIPT FOR TILDA ===== */
app.get('/script.js', (req, res) => {
  res.type('application/javascript');
  res.send(`
(function () {
  const PROJECT_ID = window.PROJECT_ID;
  const URL = 'http://localhost:8080/statuses.json';

  async function update() {
    try {
      const res = await fetch(URL);
      const all = await res.json();
      const statuses = all[PROJECT_ID] || {};

      document.querySelectorAll('[data-object-id]').forEach(el => {
        const id = el.dataset.objectId;
        el.style.transition = 'background-color 0.3s';
        el.style.backgroundColor =
          statuses[id] === 'sold' ? '#ff4d4d' : '#4CAF50';
      });
    } catch (e) {
      console.error('Ошибка обновления домов', e);
    }
  }

  update();
  setInterval(update, 10000);
})();
  `);
});

/* ===== START SERVER ===== */
app.listen(PORT, () => console.log('Server started on port ' + PORT));
