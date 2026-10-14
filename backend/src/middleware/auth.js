const jwt = require('jsonwebtoken');
const prisma = require('../prisma');

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-jwt-key-vutto-auctions-dev-2026';

async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ statusCode: 401, message: 'Missing or invalid authorization token' });
    }

    const token = authHeader.split(' ')[1];
    let payload;
    try {
      payload = jwt.verify(token, JWT_SECRET);
    } catch {
      return res.status(401).json({ statusCode: 401, message: 'Invalid or expired token' });
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.sub || payload.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        city: true,
        phone: true,
      },
    });

    if (!user) {
      return res.status(401).json({ statusCode: 401, message: 'User no longer exists' });
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
}

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(403).json({ statusCode: 403, message: 'Forbidden resource: Administrator privileges required' });
  }
  next();
}

async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        const payload = jwt.verify(token, JWT_SECRET);
        const user = await prisma.user.findUnique({
          where: { id: payload.sub || payload.id },
          select: { id: true, email: true, name: true, role: true, city: true, phone: true },
        });
        if (user) {
          req.user = user;
        }
      } catch {
        // Soft fail
      }
    }
    next();
  } catch (error) {
    next(error);
  }
}

module.exports = {
  authenticate,
  requireAdmin,
  optionalAuth,
};
