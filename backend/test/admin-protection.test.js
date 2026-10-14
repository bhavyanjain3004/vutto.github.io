const request = require('supertest');
const app = require('../src/app');
const prisma = require('../src/prisma');

describe('Admin Protection & Role Guards E2E', () => {
  let buyerToken;
  let adminToken;

  beforeAll(async () => {
    // 1. Log in admin demo
    const adminLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@vutto.test', password: 'vutto123' })
      .expect(200);
    adminToken = adminLogin.body.accessToken;

    // 2. Register normal buyer
    const ts = Date.now();
    const buyerReg = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Normal Buyer',
        email: `buyer-role-test-${ts}@vutto.test`,
        password: 'password123',
      })
      .expect(201);
    buyerToken = buyerReg.body.accessToken;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('1. GET /api/v1/admin/stats rejects unauthorized request without token', async () => {
    await request(app).get('/api/v1/admin/stats').expect(401);
  });

  it('2. GET /api/v1/admin/stats rejects non-admin buyer token with 403 Forbidden', async () => {
    await request(app)
      .get('/api/v1/admin/stats')
      .set('Authorization', `Bearer ${buyerToken}`)
      .expect(403);
  });

  it('3. GET /api/v1/admin/stats succeeds with admin token', async () => {
    const res = await request(app)
      .get('/api/v1/admin/stats')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(res.body.registeredUsers).toBeDefined();
    expect(res.body.liveCount).toBeDefined();
  });

  it('4. POST /api/v1/bikes rejects non-admin buyer token with 403 Forbidden', async () => {
    await request(app)
      .post('/api/v1/bikes')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({
        brand: 'Yamaha',
        model: 'MT-15',
        variant: 'Standard',
        year: 2023,
        kilometers: 5000,
        city: 'Delhi NCR',
        image: '/images/hero.jpg',
      })
      .expect(403);
  });

  it('5. POST /api/v1/bikes succeeds with admin token', async () => {
    const res = await request(app)
      .post('/api/v1/bikes')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        brand: 'Yamaha',
        model: 'MT-15 V2',
        variant: 'Metallic Black',
        year: 2023,
        kilometers: 4200,
        fuel: 'Petrol',
        engineCc: 155,
        city: 'Delhi NCR',
        image: '/images/hero.jpg',
        certified: true,
        inspectionScore: 9.2,
        checkpointsPassed: 202,
        owner: '1st owner',
      })
      .expect(201);

    expect(res.body.id).toBeDefined();
  });
});
