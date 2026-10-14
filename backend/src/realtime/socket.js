const { Server } = require('socket.io');

let ioInstance = null;

function initSocket(httpServer) {
  const allowedOrigin = process.env.FRONTEND_ORIGIN || 'http://localhost:5173';

  ioInstance = new Server(httpServer, {
    cors: {
      origin: [allowedOrigin, 'http://localhost:5173'],
      credentials: true,
      methods: ['GET', 'POST'],
    },
  });

  ioInstance.on('connection', (socket) => {
    socket.on('join:auction', ({ auctionId }) => {
      if (auctionId) socket.join(`auction:${auctionId}`);
    });

    socket.on('leave:auction', ({ auctionId }) => {
      if (auctionId) socket.leave(`auction:${auctionId}`);
    });
  });

  return ioInstance;
}

function getIo() {
  return ioInstance;
}

function broadcastBidPlaced(auctionId, bidData) {
  if (!ioInstance) return;
  ioInstance.to(`auction:${auctionId}`).emit('bid:placed', bidData);
  ioInstance.emit('bid:placed', bidData);
}

function broadcastPriceUpdated(auctionId, priceData) {
  if (!ioInstance) return;
  ioInstance.to(`auction:${auctionId}`).emit('price:updated', priceData);
  ioInstance.emit('price:updated', priceData);
}

module.exports = { initSocket, getIo, broadcastBidPlaced, broadcastPriceUpdated };
