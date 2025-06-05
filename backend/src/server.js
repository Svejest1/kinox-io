require('dotenv').config();
const app = require('./app'); // <--- Используем настроенное приложение из app.js
const db = require('./config/db');
const PORT = process.env.PORT || 3001;

// Пример использования пула для тестового запроса при старте (можно оставить или убрать)
db.query('SELECT NOW()')
    .then(res => console.log('server.js: Тестовый запрос к БД выполнен успешно. Текущее время в БД:', res.rows[0]))
    .catch(err => console.error('server.js: Ошибка тестового запроса к БД при старте:', err.stack));

app.listen(PORT, () => {
    console.log(`server.js: Сервер (используя app.js) запущен на порту ${PORT}`);
});