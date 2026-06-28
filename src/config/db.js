require('dotenv').config();
const mysql = require('mysql2/promise');

const dbConfig = {
  host:               process.env.DB_HOST     || 'localhost',
  port:               parseInt(process.env.DB_PORT || '3306', 10),
  user:               process.env.DB_USER     || 'root',
  password:           process.env.DB_PASSWORD || '',
  database:           process.env.DB_NAME     || 'github_analyzer',
  waitForConnections: true,
  connectionLimit:    10,
  queueLimit:         0,
  timezone:           '+00:00',
  charset:            'utf8mb4',
};

/**
 * Singleton connection pool — shared across the entire application.
 */
const pool = mysql.createPool(dbConfig);

/**
 * Verify the database connection on startup.
 * Throws if the DB is unreachable.
 */
async function testConnection() {
  const conn = await pool.getConnection();
  await conn.ping();
  conn.release();
  console.log('✅  MySQL connected successfully');
}

module.exports = { pool, testConnection };
