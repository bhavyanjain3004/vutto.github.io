const express = require('express');
const router = express.Router();
const prisma = require('../prisma');
const { authenticate, requireAdmin } = require('../middleware/auth');

router.use(authenticate, requireAdmin);

// GET /api/v1/admin/stats
router.get('/stats', async (req, res, next) => {
  try {
    const auctions = await prisma.auction.findMany();
    const bids = await prisma.bid.findMany({
      include: { user: { select: { email: true } } },
    });
    const totalUsers = await prisma.user.count();

    const liveCount = auctions.filter((a) => a.status === 'LIVE').length;
    const upcomingCount = auctions.filter((a) => a.status === 'UPCOMING').length;
    const endedCount = auctions.filter((a) => a.status === 'ENDED').length;
    const cancelledCount = auctions.filter((a) => a.status === 'CANCELLED').length;

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const bidsToday = bids.filter((b) => b.createdAt.getTime() >= startOfToday).length;

    // Bids per hour for last 12 hours
    const bidsPerHour = [];
    const nowMs = now.getTime();
    for (let i = 11; i >= 0; i--) {
      const slotEnd = new Date(nowMs - i * 3600 * 1000);
      const slotStart = new Date(nowMs - (i + 1) * 3600 * 1000);
      const hourLabel = new Intl.DateTimeFormat('en-IN', {
        hour: 'numeric',
        hour12: true,
      }).format(slotEnd);
      const count = bids.filter((b) => {
        const t = b.createdAt.getTime();
        return t >= slotStart.getTime() && t < slotEnd.getTime();
      }).length;
      bidsPerHour.push({ hour: hourLabel, bids: count });
    }

    return res.json({
      liveCount,
      upcomingCount,
      endedCount,
      cancelledCount,
      bidsToday,
      registeredUsers: totalUsers,
      bidsPerHour,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/admin/bids
router.get('/bids', async (req, res, next) => {
  try {
    const bids = await prisma.bid.findMany({
      include: {
        user: { select: { id: true, name: true, email: true } },
        auction: {
          select: {
            id: true,
            title: true,
            status: true,
            bike: { select: { brand: true, model: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });

    const formatted = bids.map((b) => ({
      id: b.id,
      auctionId: b.auctionId,
      auctionTitle: b.auction?.title || 'Unknown Bike',
      bidderName: b.user?.name || 'Anonymous',
      bidderEmail: b.user?.email || '',
      amount: b.amount,
      createdAt: b.createdAt.toISOString(),
    }));

    return res.json(formatted);
  } catch (err) {
    next(err);
  }
});

// Admin bike management aliases (/admin/bikes)
router.post('/bikes', async (req, res, next) => {
  try {
    const { brand, model, variant, year, kilometers, fuel = 'Petrol', engineCc, city, image, certified = true, inspectionScore = 9.0, checkpointsPassed = 200, owner = '1st Owner', specs = {} } = req.body;
    const bike = await prisma.bike.create({
      data: {
        brand: brand.trim(),
        model: model.trim(),
        variant: variant.trim(),
        year: Number(year),
        kilometers: Number(kilometers),
        fuel: fuel.trim(),
        engineCc: Number(engineCc || 150),
        city: city.trim(),
        image: image.trim(),
        certified: Boolean(certified),
        inspectionScore: Number(inspectionScore),
        checkpointsPassed: Number(checkpointsPassed),
        owner: owner.trim(),
        specs: specs || {},
      },
    });
    return res.status(201).json(bike);
  } catch (err) {
    next(err);
  }
});

router.put('/bikes/:id', async (req, res, next) => {
  try {
    const updated = await prisma.bike.update({
      where: { id: req.params.id },
      data: {
        ...(req.body.brand && { brand: req.body.brand.trim() }),
        ...(req.body.model && { model: req.body.model.trim() }),
        ...(req.body.variant && { variant: req.body.variant.trim() }),
        ...(req.body.year !== undefined && { year: Number(req.body.year) }),
        ...(req.body.kilometers !== undefined && { kilometers: Number(req.body.kilometers) }),
        ...(req.body.fuel && { fuel: req.body.fuel.trim() }),
        ...(req.body.engineCc !== undefined && { engineCc: Number(req.body.engineCc) }),
        ...(req.body.city && { city: req.body.city.trim() }),
        ...(req.body.image && { image: req.body.image.trim() }),
        ...(req.body.certified !== undefined && { certified: Boolean(req.body.certified) }),
        ...(req.body.inspectionScore !== undefined && { inspectionScore: Number(req.body.inspectionScore) }),
        ...(req.body.checkpointsPassed !== undefined && { checkpointsPassed: Number(req.body.checkpointsPassed) }),
        ...(req.body.owner && { owner: req.body.owner.trim() }),
        ...(req.body.specs && { specs: req.body.specs }),
      },
    });
    return res.json(updated);
  } catch (err) {
    next(err);
  }
});

router.delete('/bikes/:id', async (req, res, next) => {
  try {
    await prisma.bike.delete({ where: { id: req.params.id } });
    return res.json({ message: 'Bike deleted successfully', id: req.params.id });
  } catch (err) {
    next(err);
  }
});

// Admin auction management aliases (/admin/auctions)
router.post('/auctions', async (req, res, next) => {
  try {
    const { bikeId, title, startingPrice, minIncrement = 500, startsAt, endsAt, status = 'UPCOMING' } = req.body;
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
      include: { bike: true, _count: { select: { bids: true } } },
    });
    return res.status(201).json(auction);
  } catch (err) {
    next(err);
  }
});

router.put('/auctions/:id', async (req, res, next) => {
  try {
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
      include: { bike: true, _count: { select: { bids: true } } },
    });
    return res.json(updated);
  } catch (err) {
    next(err);
  }
});

router.delete('/auctions/:id', async (req, res, next) => {
  try {
    await prisma.auction.delete({ where: { id: req.params.id } });
    return res.json({ message: 'Auction deleted successfully', id: req.params.id });
  } catch (err) {
    next(err);
  }
});

router.post('/auctions/:id/close-early', async (req, res, next) => {
  try {
    const updated = await prisma.auction.update({
      where: { id: req.params.id },
      data: { status: 'ENDED', endsAt: new Date() },
      include: { bike: true, _count: { select: { bids: true } } },
    });
    return res.json(updated);
  } catch (err) {
    next(err);
  }
});

router.post('/auctions/:id/cancel', async (req, res, next) => {
  try {
    const updated = await prisma.auction.update({
      where: { id: req.params.id },
      data: { status: 'CANCELLED' },
      include: { bike: true, _count: { select: { bids: true } } },
    });
    return res.json(updated);
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/admin/audit-logs
router.get('/audit-logs', async (req, res, next) => {
  try {
    const logs = await prisma.auditLog.findMany({
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return res.json(logs);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
