const express = require('express');
const path = require('path'); // Модуль для работы с путями
const cors = require('cors');

// Загрузка переменных окружения (если еще не загружены, например, в db.js)
// require('dotenv').config({ path: '../.env' }); // Если .env в корне backend

const app = express();

console.log('app.js: Express приложение инициализировано.');

// Подключаем CORS
app.use(cors());
console.log('app.js: CORS middleware подключено.');

// Middleware для парсинга JSON-тела запросов
// Важно: это должно быть ДО определения любых маршрутов, которые принимают JSON
app.use(express.json());
console.log('app.js: Middleware express.json() подключено.');

// Middleware для парсинга URL-encoded тел запросов (опционально, но часто полезно)
app.use(express.urlencoded({ extended: true }));
console.log('app.js: Middleware express.urlencoded() подключено.');

// Настройка статической раздачи файлов
app.use('/assets/images/posters', express.static(path.join(__dirname, '../../assets/images/posters')));
console.log('app.js: Статическая раздача постеров настроена.');

// Простое логирование всех запросов для отладки
app.use((req, res, next) => {
    console.log(`Запрос: ${req.method} ${req.originalUrl}`);
    next();
});

// Тестовый GET-маршрут
app.get('/api/test', (req, res) => {
    res.status(200).json({ message: 'Бэкенд GET /api/test работает!' });
});

// Подключаем маршруты аутентификации
const authRoutes = require('./routes/authRoutes');
console.log('app.js: Модуль authRoutes загружен. Тип:', typeof authRoutes);
app.use('/api/auth', authRoutes);
console.log('app.js: Маршруты /api/auth подключены.');

// Подключаем маршруты пользователей
const userRoutes = require('./routes/userRoutes');
console.log('app.js: Модуль userRoutes загружен.');
app.use('/api', userRoutes);
console.log('app.js: Маршруты /api/profile подключены.');

// Подключаем маршруты бронирования
const bookingRoutes = require('./routes/bookingRoutes');
console.log('app.js: Модуль bookingRoutes загружен.');
app.use('/api/bookings', bookingRoutes);
console.log('app.js: Маршруты бронирования подключены.');

// Подключаем маршруты фильмов
const movieRoutes = require('./routes/movieRoutes');
console.log('app.js: Модуль movieRoutes загружен.');
app.use('/api/movies', movieRoutes);
console.log('app.js: Маршруты фильмов подключены.');

// Обработчик для всех остальных ненайденных маршрутов (404)
app.use((req, res, next) => {
    res.status(404).send(`Express: Cannot ${req.method} ${req.originalUrl}`);
});

// Базовый обработчик ошибок Express
app.use((err, req, res, next) => {
    console.error('Ошибка сервера:', err.stack);
    res.status(500).send('Express: Что-то пошло не так на сервере!');
});

module.exports = app; 