const express = require('express');
const router = express.Router();
const prisma = require('../prisma');
const { authenticate, requireAdmin } = require('../middleware/auth');

// GET /api/v1/bikes
router.get('/', async (req, res, next) => {
  try {
    const bikes = await prisma.bike.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        auctions: {
          select: { id: true, status: true, currentPrice: true, endsAt: true },
        },
      },
    });

    const formatted = bikes.map((b) => ({
      id: b.id,
      brand: b.brand,
      model: b.model,
      variant: b.variant,
      year: b.year,
      kilometers: b.kilometers,
      fuel: b.fuel,
      engineCc: b.engineCc,
      city: b.city,
      image: b.image,
      certified: b.certified,
      inspectionScore: b.inspectionScore,
      checkpointsPassed: b.checkpointsPassed,
      owner: b.owner,
      specs: b.specs || {},
      activeAuction: b.auctions.find((a) => a.status === 'LIVE' || a.status === 'UPCOMING') || null,
      createdAt: b.createdAt.toISOString(),
    }));

    return res.json(formatted);
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/bikes/:id
router.get('/:id', async (req, res, next) => {
  try {
    const bike = await prisma.bike.findUnique({
      where: { id: req.params.id },
      include: { auctions: true },
    });
    if (!bike) {
      return res.status(404).json({ statusCode: 404, message: 'Bike not found' });
    }
    return res.json({
      ...bike,
      createdAt: bike.createdAt.toISOString(),
      updatedAt: bike.updatedAt.toISOString(),
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/bikes (Admin only)
router.post('/', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const {
      brand,
      model,
      variant,
      year,
      kilometers,
      fuel = 'Petrol',
      engineCc,
      city,
      image,
      certified = true,
      inspectionScore = 9.0,
      checkpointsPassed = 200,
      owner = '1st Owner',
      specs = {},
    } = req.body;

    if (!brand || !model || !variant || !year || kilometers === undefined || !city || !image) {
      return res.status(400).json({ statusCode: 400, message: 'Missing required bike fields' });
    }

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

// PUT /api/v1/bikes/:id (Admin only)
router.put('/:id', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const bike = await prisma.bike.findUnique({ where: { id: req.params.id } });
    if (!bike) {
      return res.status(404).json({ statusCode: 404, message: 'Bike not found' });
    }

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

// DELETE /api/v1/bikes/:id (Admin only)
router.delete('/:id', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const bike = await prisma.bike.findUnique({ where: { id: req.params.id } });
    if (!bike) {
      return res.status(404).json({ statusCode: 404, message: 'Bike not found' });
    }

    await prisma.bike.delete({ where: { id: req.params.id } });
    return res.json({ message: 'Bike deleted successfully', id: req.params.id });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
