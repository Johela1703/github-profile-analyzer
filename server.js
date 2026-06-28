require('dotenv').config();

const app = require('./src/app');
const { testConnection } = require('./src/config/db');

const PORT = parseInt(process.env.PORT || '3000', 10);

async function bootstrap() {
  try {

    await testConnection();

    app.listen(PORT, () => {
      console.log('');
      console.log('╔══════════════════════════════════════════════╗');
      console.log('║      GitHub Profile Analyzer API            ║');
      console.log('╠══════════════════════════════════════════════╣');
      console.log(`║  🚀 Server running on port ${PORT}               ║`);
      console.log(`║  🌍 Environment: ${process.env.NODE_ENV || 'development'}                ║`);
      console.log('╠══════════════════════════════════════════════╣');
      console.log('║ POST   /api/profiles/analyze/:username      ║');
      console.log('║ GET    /api/profiles                        ║');
      console.log('║ GET    /api/profiles/:username              ║');
      console.log('║ DELETE /api/profiles/:username              ║');
      console.log('║ GET    /api/health                          ║');
      console.log('╚══════════════════════════════════════════════╝');
      console.log('');
    });

  } catch (err) {
    console.error('❌ Failed to start server');
    console.error(err);
    process.exit(1);
  }
}

bootstrap();