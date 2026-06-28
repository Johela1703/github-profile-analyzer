/**
 * initDb.js
 *
 * Reads database/schema.sql and executes it against the configured MySQL server.
 * Run once before starting the app:  node src/config/initDb.js
 */

require('dotenv').config();
const fs   = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

const schemaPath = path.join(__dirname, '..', '..', 'database', 'schema.sql');

async function init() {
  // Connect WITHOUT specifying a database so we can CREATE DATABASE
  const conn = await mysql.createConnection({
    host:     process.env.DB_HOST     || 'localhost',
    port:     parseInt(process.env.DB_PORT || '3306', 10),
    user:     process.env.DB_USER     || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true,          // needed to run the whole schema file at once
    charset: 'utf8mb4',
  });

  console.log('📦  Running database schema initialization…');

  const sql = fs.readFileSync(schemaPath, 'utf8');
  const results = await conn.query(sql);

  // The last query in schema.sql is a SELECT that returns a status message
  const rows = Array.isArray(results[0]) ? results[0] : results;
  const last  = Array.isArray(rows) ? rows[rows.length - 1] : rows;
  if (Array.isArray(last) && last[0] && last[0].status) {
    console.log('✅ ', last[0].status);
  } else {
    console.log('✅  Schema applied successfully.');
  }

  await conn.end();
}

init().catch((err) => {
  console.error('❌  Database initialization failed:', err.message);
  process.exit(1);
});
