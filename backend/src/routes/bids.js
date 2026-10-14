const express = require('express');
const router = express.Router();
const prisma = require('../prisma');

// GET /api/v1/bids - returns all recent bids across auctions
router.get('/', async (req, res, next) => {
  try {
    const bids = await prisma.bid.findMany({
      include: {
        user: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });

    const formatted = bids.map((b) => ({
      id: b.id,
      auctionId: b.auctionId,
      bidderName: b.user ? b.user.name : 'Anonymous',
      bidderEmail: b.user ? b.user.email : '',
      amount: b.amount,
      createdAt: b.createdAt.toISOString(),
    }));

    return res.json(formatted);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
