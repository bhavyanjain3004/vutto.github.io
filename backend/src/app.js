const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const auctionsRoutes = require('./routes/auctions');
const bikesRoutes = require('./routes/bikes');
const adminRoutes = require('./routes/admin');
const healthRoutes = require('./routes/health');
const bidsRoutes = require('./routes/bids');

const app = express();

const allowedOrigin = process.env.FRONTEND_ORIGIN || 'http://localhost:5173';

app.use(
  cors({
    origin: [allowedOrigin, 'http://localhost:5173'],
    credentials: true,
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware in development
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      console.log(`[${req.method}] ${req.originalUrl} ${res.statusCode} - ${duration}ms`);
    });
    next();
  });
}

// Routes under /api/v1
app.use('/api/v1/health', healthRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/auctions', auctionsRoutes);
app.use('/api/v1/bikes', bikesRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/bids', bidsRoutes);

// Fallback 404 handler
app.use((req, res) => {
  res.status(404).json({ statusCode: 404, message: `Route ${req.method} ${req.path} not found` });
});

// Centralized error handler
app.use((err, req, res, _next) => {
  console.error('Unhandled error:', err);
  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal server error';
  res.status(status).json({ statusCode: status, message });
});

module.exports = app;
