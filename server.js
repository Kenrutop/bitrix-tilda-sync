const express = require('express');
const fs = require('fs');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Файл для хранения статусов домов
const STATUS_FILE = path.join(__dirname, 'statuses.json');

// Мидлвар для JSON
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Чтение статусов
function readStatuses() {
    if (fs.existsSync(STATUS_FILE)) {
        return JSON.parse(fs.readFileSync(STATUS_FILE, 'utf-8'));
    }
    return {};
}

// Сохранение статусов
function saveStatuses(statuses) {
    fs.writeFileSync(STATUS_FILE, JSON.stringify(statuses, null, 2));
}

// Вебхук Битрикс24
app.post('/webhook', (req, res) => {
    const deal = req.body;
    const objectId = deal?.PROPERTY_VALUES?.OBJECT_ID;
    const stage = deal?.STAGE_ID;

    if (!objectId || !stage) return res.status(400).send('Нет objectId или stage');

    let status = 'available';
    if (stage === 'WON') status = 'sold';

    const statuses = readStatuses();
    statuses[objectId] = status;
    saveStatuses(statuses);

    res.send({ success: true });
});

// Отдача JSON для Тильды
app.get('/statuses.json', (req, res) => {
    res.json(readStatuses());
});

app.listen(PORT, () => console.log(`Сервер запущен на http://localhost:${PORT}`));
