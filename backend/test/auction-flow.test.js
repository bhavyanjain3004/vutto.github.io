const request = require('supertest');
const app = require('../src/app');
const prisma = require('../src/prisma');

describe('Vutto Auctions E2E Flow', () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  const timestamp = Date.now();
  const testBuyer1 = {
    name: 'E2E Buyer One',
    email: `buyer1-${timestamp}@vutto.test`,
    password: 'password123',
  };

  const testBuyer2 = {
    name: 'E2E Buyer Two',
    email: `buyer2-${timestamp}@vutto.test`,
    password: 'password123',
  };

  let token1;
  let token2;
  let auctionId;

  it('1. Register test buyer 1 and buyer 2', async () => {
    const res1 = await request(app)
      .post('/api/v1/auth/register')
      .send(testBuyer1)
      .expect(201);

    expect(res1.body.accessToken).toBeDefined();
    token1 = res1.body.accessToken;

    const res2 = await request(app)
      .post('/api/v1/auth/register')
      .send(testBuyer2)
      .expect(201);

    expect(res2.body.accessToken).toBeDefined();
    token2 = res2.body.accessToken;
  });

  it('2. Fetch all auctions and locate a LIVE auction', async () => {
    const res = await request(app)
      .get('/api/v1/auctions')
      .query({ status: 'LIVE' })
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);

    const liveAuction = res.body.find((a) => a.id === 'auc-1') || res.body[0];
    expect(liveAuction).toBeDefined();
    expect(liveAuction.status).toBe('LIVE');
    auctionId = liveAuction.id;
  });

  it('3. Reject unauthorized bid (no token)', async () => {
    await request(app)
      .post(`/api/v1/auctions/${auctionId}/bids`)
      .send({ amount: 200000 })
      .expect(401);
  });

  it('4. Place valid bid with buyer 1', async () => {
    const detail = await request(app)
      .get(`/api/v1/auctions/${auctionId}`)
      .expect(200);

    const minIncrement = detail.body.minIncrement || 500;
    const nextValidBid = detail.body.currentBid + minIncrement;

    const res = await request(app)
      .post(`/api/v1/auctions/${auctionId}/bids`)
      .set('Authorization', `Bearer ${token1}`)
      .send({ amount: nextValidBid })
      .expect(201);

    expect(res.body.amount).toBe(nextValidBid);
    expect(res.body.auctionId).toBe(auctionId);
  });

  it('5. Reject under-bid with buyer 2', async () => {
    const detail = await request(app)
      .get(`/api/v1/auctions/${auctionId}`)
      .expect(200);

    await request(app)
      .post(`/api/v1/auctions/${auctionId}/bids`)
      .set('Authorization', `Bearer ${token2}`)
      .send({ amount: detail.body.currentBid }) // Not exceeding by min increment
      .expect(400);
  });

  it('6. Verify bid history reflects placed bids', async () => {
    const bidsRes = await request(app)
      .get(`/api/v1/auctions/${auctionId}/bids`)
      .expect(200);

    expect(Array.isArray(bidsRes.body)).toBe(true);
    expect(bidsRes.body.length).toBeGreaterThan(0);
  });
});
