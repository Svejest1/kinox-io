const { Pool } = require('pg');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_DATABASE || 'kinoX',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '2442',
};

const pool = new Pool(dbConfig);

pool.on('connect', () => {
  console.log('PostgreSQL pool connected!');
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// Добавляем метод getClient для работы с транзакциями
pool.getClient = async () => {
  return await pool.connect();
};

module.exports = pool;