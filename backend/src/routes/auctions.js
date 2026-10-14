const express = require('express');
const router = express.Router();
const prisma = require('../prisma');
const { authenticate, requireAdmin, optionalAuth } = require('../middleware/auth');
const { broadcastBidPlaced, broadcastPriceUpdated } = require('../realtime/socket');

function formatAuction(auction) {
  const totalBids =
    auction._count && typeof auction._count.bids === 'number'
      ? auction._count.bids
      : auction.totalBids;

  const bike = auction.bike || {};
  const specs = bike.specs || {};
  const images = Array.isArray(specs.images) && specs.images.length > 0
    ? specs.images.filter(Boolean)
    : [bike.image || '/images/hunter.jpg'];

  return {
    id: auction.id,
    bikeId: auction.bikeId,
    title: auction.title,
    brand: bike.brand,
    model: bike.model,
    variant: bike.variant,
    year: bike.year,
    kilometers: bike.kilometers,
    owner: bike.owner,
    city: bike.city ? `${bike.city} Hub` : 'Delhi NCR Hub',
    startingPrice: auction.startingPrice,
    currentBid: auction.currentPrice,
    minIncrement: auction.minIncrement,
    totalBids,
    status: auction.status,
    endsAt: auction.endsAt ? auction.endsAt.toISOString() : new Date().toISOString(),
    startAt: auction.startsAt ? auction.startsAt.toISOString() : new Date().toISOString(),
    images,
    specs,
    inspectionScore: bike.inspectionScore ?? 9.0,
    checkpointsPassed: bike.checkpointsPassed ?? 200,
    fuel: bike.fuel || 'Petrol',
    engineCc: bike.engineCc || 150,
    winnerId: auction.winnerId,
    currentBidderId: auction.currentBidderId,
    version: auction.version || 0,
  };
}

// GET /api/v1/auctions
router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const { status, brand, city, search, sort, minPrice, maxPrice, minYear, maxKm } = req.query;

    const where = {};
    if (status) {
      where.status = status.toUpperCase();
    }

    const bikeWhere = {};
    if (brand) {
      bikeWhere.brand = { equals: brand, mode: 'insensitive' };
    }
    if (city) {
      bikeWhere.city = { contains: city, mode: 'insensitive' };
    }
    if (minYear !== undefined) {
      bikeWhere.year = { gte: Number(minYear) };
    }
    if (maxKm !== undefined) {
      bikeWhere.kilometers = { lte: Number(maxKm) };
    }
    if (Object.keys(bikeWhere).length > 0) {
      where.bike = bikeWhere;
    }

    const priceFilter = {};
    if (maxPrice !== undefined) {
      priceFilter.lte = Number(maxPrice);
    }
    if (minPrice !== undefined) {
      priceFilter.gte = Number(minPrice);
    }
    if (Object.keys(priceFilter).length > 0) {
      where.currentPrice = priceFilter;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { bike: { model: { contains: search, mode: 'insensitive' } } },
        { bike: { brand: { contains: search, mode: 'insensitive' } } },
        { bike: { variant: { contains: search, mode: 'insensitive' } } },
      ];
    }

    let orderBy = { endsAt: 'asc' };
    if (sort === 'price-low') {
      orderBy = { currentPrice: 'asc' };
    } else if (sort === 'price-high') {
      orderBy = { currentPrice: 'desc' };
    } else if (sort === 'year') {
      orderBy = { bike: { year: 'desc' } };
    } else if (sort === 'km') {
      orderBy = { bike: { kilometers: 'asc' } };
    }

    const auctions = await prisma.auction.findMany({
      where,
      orderBy,
      include: {
        bike: true,
        _count: { select: { bids: true } },
      },
    });

    return res.json(auctions.map(formatAuction));
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/auctions/:id
router.get('/:id', optionalAuth, async (req, res, next) => {
  try {
    const auction = await prisma.auction.findUnique({
      where: { id: req.params.id },
      include: {
        bike: true,
        _count: { select: { bids: true } },
      },
    });

    if (!auction) {
      return res.status(404).json({ statusCode: 404, message: 'Auction not found' });
    }

    return res.json(formatAuction(auction));
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/auctions/:id/bids
router.get('/:id/bids', async (req, res, next) => {
  try {
    const bids = await prisma.bid.findMany({
      where: { auctionId: req.params.id },
      include: {
        user: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    const formatted = bids.map((b) => ({
      id: b.id,
      auctionId: b.auctionId,
      bidderName: b.user ? b.user.name : 'Bidder',
      bidderEmail: b.user ? b.user.email : '',
      amount: b.amount,
      createdAt: b.createdAt.toISOString(),
    }));

    return res.json(formatted);
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/auctions/:id/my-bids
router.get('/:id/my-bids', authenticate, async (req, res, next) => {
  try {
    const bids = await prisma.bid.findMany({
      where: {
        auctionId: req.params.id,
        userId: req.user.id,
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json(
      bids.map((b) => ({
        id: b.id,
        auctionId: b.auctionId,
        amount: b.amount,
        createdAt: b.createdAt.toISOString(),
      }))
    );
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/auctions/:id/bids
router.post('/:id/bids', authenticate, async (req, res, next) => {
  try {
    const auctionId = req.params.id;
    const { amount, idempotencyKey } = req.body;
    const bidAmount = Number(amount);

    if (!bidAmount || isNaN(bidAmount) || bidAmount <= 0) {
      return res.status(400).json({ statusCode: 400, message: 'Valid bid amount is required' });
    }

    // 1. Idempotency check
    if (idempotencyKey) {
      const existing = await prisma.bid.findUnique({
        where: {
          userId_idempotencyKey: {
            userId: req.user.id,
            idempotencyKey,
          },
        },
      });

      if (existing) {
        return res.json({
          id: existing.id,
          auctionId: existing.auctionId,
          bidderName: req.user.name,
          bidderEmail: req.user.email,
          amount: existing.amount,
          createdAt: existing.createdAt.toISOString(),
          idempotent: true,
        });
      }
    }

    // 2. High-concurrency transaction
    const result = await prisma.$transaction(async (tx) => {
      const auction = await tx.auction.findUnique({
        where: { id: auctionId },
        include: { _count: { select: { bids: true } } },
      });

      if (!auction) {
        throw { status: 404, message: 'Auction listing not found' };
      }

      if (auction.status !== 'LIVE') {
        throw { status: 400, message: `Bids can only be placed on active LIVE auctions (current: ${auction.status})` };
      }

      const now = new Date();
      if (now > auction.endsAt) {
        throw { status: 400, message: 'This auction has already ended' };
      }

      const minAllowed = auction.currentPrice + auction.minIncrement;
      if (bidAmount < minAllowed) {
        throw {
          status: 400,
          message: `Bid must be at least ₹${minAllowed.toLocaleString('en-IN')} (Current: ₹${auction.currentPrice.toLocaleString('en-IN')} + Min Increment: ₹${auction.minIncrement.toLocaleString('en-IN')})`,
        };
      }

      // Check anti-snipe extension
      let newEndsAt = auction.endsAt;
      const msLeft = auction.endsAt.getTime() - now.getTime();
      const windowMs = (auction.antiSnipeWindowSeconds || 120) * 1000;
      if (msLeft <= windowMs) {
        newEndsAt = new Date(auction.endsAt.getTime() + (auction.antiSnipeExtensionSeconds || 120) * 1000);
      }

      // Create bid
      const bid = await tx.bid.create({
        data: {
          auctionId,
          userId: req.user.id,
          amount: bidAmount,
          idempotencyKey: idempotencyKey || null,
        },
      });

      // Update auction
      const updatedAuction = await tx.auction.update({
        where: { id: auctionId },
        data: {
          currentPrice: bidAmount,
          totalBids: { increment: 1 },
          currentBidderId: req.user.id,
          endsAt: newEndsAt,
          version: { increment: 1 },
        },
      });

      return {
        bid,
        updatedAuction,
        totalBids: (auction._count?.bids || 0) + 1,
      };
    });

    const responsePayload = {
      id: result.bid.id,
      auctionId: result.bid.auctionId,
      bidderName: req.user.name,
      bidderEmail: req.user.email,
      amount: result.bid.amount,
      createdAt: result.bid.createdAt.toISOString(),
    };

    // Real-time broadcast
    broadcastBidPlaced(auctionId, responsePayload);
    broadcastPriceUpdated(auctionId, {
      auctionId,
      currentPrice: result.updatedAuction.currentPrice,
      currentBid: result.updatedAuction.currentPrice,
      totalBids: result.totalBids,
      currentBidderId: req.user.id,
      endsAt: result.updatedAuction.endsAt.toISOString(),
      version: result.updatedAuction.version,
    });

    return res.status(201).json(responsePayload);
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ statusCode: err.status, message: err.message });
    }
    next(err);
  }
});

// POST /api/v1/auctions (Admin only)
router.post('/', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const {
      bikeId,
      title,
      startingPrice,
      minIncrement = 500,
      startsAt,
      endsAt,
      status = 'UPCOMING',
    } = req.body;

    if (!bikeId || !title || startingPrice === undefined || !startsAt || !endsAt) {
      return res.status(400).json({ statusCode: 400, message: 'Missing required auction fields' });
    }

    const auction = await prisma.auction.create({
      data: {
        bikeId,
        title: title.trim(),
        startingPrice: Number(startingPrice),
        currentPrice: Number(startingPrice),
        minIncrement: Number(minIncrement),
        startsAt: new Date(startsAt),
        endsAt: new Date(endsAt),
        status: status.toUpperCase(),
      },
      include: {
        bike: true,
        _count: { select: { bids: true } },
      },
    });

    return res.status(201).json(formatAuction(auction));
  } catch (err) {
    next(err);
  }
});

// PUT /api/v1/auctions/:id (Admin only)
router.put('/:id', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const auction = await prisma.auction.findUnique({ where: { id: req.params.id } });
    if (!auction) {
      return res.status(404).json({ statusCode: 404, message: 'Auction not found' });
    }

    const updated = await prisma.auction.update({
      where: { id: req.params.id },
      data: {
        ...(req.body.title && { title: req.body.title.trim() }),
        ...(req.body.startingPrice !== undefined && { startingPrice: Number(req.body.startingPrice) }),
        ...(req.body.minIncrement !== undefined && { minIncrement: Number(req.body.minIncrement) }),
        ...(req.body.status && { status: req.body.status.toUpperCase() }),
        ...(req.body.startsAt && { startsAt: new Date(req.body.startsAt) }),
        ...(req.body.endsAt && { endsAt: new Date(req.body.endsAt) }),
      },
      include: {
        bike: true,
        _count: { select: { bids: true } },
      },
    });

    return res.json(formatAuction(updated));
  } catch (err) {
    next(err);
  }
});

// DELETE /api/v1/auctions/:id (Admin only)
router.delete('/:id', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const auction = await prisma.auction.findUnique({ where: { id: req.params.id } });
    if (!auction) {
      return res.status(404).json({ statusCode: 404, message: 'Auction not found' });
    }

    await prisma.auction.delete({ where: { id: req.params.id } });
    return res.json({ message: 'Auction deleted successfully', id: req.params.id });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/auctions/:id/close or close-early (Admin only)
const closeHandler = async (req, res, next) => {
  try {
    const auction = await prisma.auction.findUnique({ where: { id: req.params.id } });
    if (!auction) {
      return res.status(404).json({ statusCode: 404, message: 'Auction not found' });
    }

    const updated = await prisma.auction.update({
      where: { id: req.params.id },
      data: {
        status: 'ENDED',
        endsAt: new Date(),
      },
      include: {
        bike: true,
        _count: { select: { bids: true } },
      },
    });

    return res.json(formatAuction(updated));
  } catch (err) {
    next(err);
  }
};
router.post('/:id/close', authenticate, requireAdmin, closeHandler);
router.post('/:id/close-early', authenticate, requireAdmin, closeHandler);

// POST /api/v1/auctions/:id/cancel (Admin only)
router.post('/:id/cancel', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const auction = await prisma.auction.findUnique({ where: { id: req.params.id } });
    if (!auction) {
      return res.status(404).json({ statusCode: 404, message: 'Auction not found' });
    }

    const updated = await prisma.auction.update({
      where: { id: req.params.id },
      data: { status: 'CANCELLED' },
      include: {
        bike: true,
        _count: { select: { bids: true } },
      },
    });

    return res.json(formatAuction(updated));
  } catch (err) {
    next(err);
  }
});

module.exports = router;
