require('dotenv').config();
const http = require('http');
const app = require('./app');
const { initSocket } = require('./realtime/socket');
const prisma = require('./prisma');

const PORT = Number(process.env.PORT) || 3000;

const server = http.createServer(app);

// Initialize Socket.IO on the same server
initSocket(server);

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[Vutto Backend] Server running on http://0.0.0.0:${PORT}`);
  console.log(`[Vutto Backend] API available at http://localhost:${PORT}/api/v1`);
});

// Graceful shutdown
const shutdown = async (signal) => {
  console.log(`\n[Vutto Backend] Received ${signal}. Gracefully shutting down...`);
  server.close(async () => {
    await prisma.$disconnect();
    console.log('[Vutto Backend] Database disconnected. Exiting process.');
    process.exit(0);
  });
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
