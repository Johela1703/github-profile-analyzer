/**
 * server.js
 *
 * Application entry point.
 * Verifies the DB connection, then starts the HTTP server.
 */

require('dotenv').config();

const app              = require('./src/app');
const { testConnection } = require('./src/config/db');

const PORT = parseInt(process.env.PORT || '3000', 10);

async function bootstrap() {
  try {
    // Verify database connectivity before accepting requests
    await testConnection();

    app.listen(PORT, () => {
      console.log('');
      console.log('╔══════════════════════════════════════════════╗');
      console.log('║      GitHub Profile Analyzer API             ║');
      console.log('╠══════════════════════════════════════════════╣');
      console.log(`║  🚀  Server running on http://localhost:${PORT}  ║`);
      console.log(`║  🌍  Environment : ${(process.env.NODE_ENV || 'development').padEnd(25)}║`);
      console.log('╠══════════════════════════════════════════════╣');
      console.log('║  Endpoints:                                  ║');
      console.log('║  POST  /api/profiles/analyze/:username       ║');
      console.log('║  GET   /api/profiles                         ║');
      console.log('║  GET   /api/profiles/:username               ║');
      console.log('║  DELETE /api/profiles/:username              ║');
      console.log('║  GET   /api/health                           ║');
      console.log('╚══════════════════════════════════════════════╝');
      console.log('');
    });
  } catch (err) {
    console.error('❌  Failed to start server:', err.message);
    console.error('');
    console.error('   Make sure MySQL is running and the credentials in .env are correct.');
    console.error('   If this is your first run: node src/config/initDb.js');
    process.exit(1);
  }
}

bootstrap();
