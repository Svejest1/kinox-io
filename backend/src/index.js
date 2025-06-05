const express = require('express');
const app = require('./app');
const db = require('./config/db');
const PORT = process.env.PORT || 3000;

// Инициализация соединения с базой данных
db.connect()
  .then(() => {
    console.log('index.js: Соединение с базой данных установлено');
    
    // Запуск сервера
    app.listen(PORT, () => {
      console.log(`index.js: Сервер запущен на порту ${PORT}`);
      console.log('index.js: http://localhost:' + PORT);
    });
  })
  .catch((error) => {
    console.error('index.js: Ошибка при подключении к базе данных:', error);
    process.exit(1);
  }); 