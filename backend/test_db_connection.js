require('dotenv').config(); // Убедимся, что .env загружен
const { Pool } = require('pg');

console.log('Попытка подключения с параметрами:');
console.log('User:', process.env.DB_USER_TEST);
// НЕ выводим пароль в консоль по соображениям безопасности
// console.log('Password:', process.env.DB_PASSWORD_TEST); 
console.log('Host:', process.env.DB_HOST_TEST);
console.log('Port:', process.env.DB_PORT_TEST);
console.log('Database:', process.env.DB_DATABASE_TEST);

const pool = new Pool({
  user: process.env.DB_USER_TEST,
  host: process.env.DB_HOST_TEST,
  database: process.env.DB_DATABASE_TEST,
  password: process.env.DB_PASSWORD_TEST,
  port: parseInt(process.env.DB_PORT_TEST, 10),
});

pool.connect((err, client, release) => {
  if (err) {
    console.error('Ошибка подключения к базе данных:', err.stack);
    // Попробуем вывести дополнительную информацию из ошибки, если есть
    if (err.message) console.error('Сообщение ошибки:', err.message);
    if (err.code) console.error('Код ошибки:', err.code);
    if (err.routine) console.error('Процедура ошибки:', err.routine);
    return;
  }
  console.log('Тестовое подключение к PostgreSQL УСПЕШНО!');
  client.query('SELECT NOW()', (err, result) => {
    release(); // освобождаем клиента обратно в пул
    if (err) {
      return console.error('Ошибка выполнения тестового запроса', err.stack);
    }
    console.log('Результат тестового запроса (текущее время с сервера БД):', result.rows);
    pool.end(() => {
        console.log('Пул соединений закрыт.');
    });
  });
});

// Обработчик ошибок на пуле для дополнительной диагностики
pool.on('error', (err, client) => {
  console.error('Неожиданная ошибка на клиенте из пула', err);
  process.exit(-1);
}); 