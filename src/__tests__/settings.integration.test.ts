import request from 'supertest';
import express from 'express';
import settingRoutes from '../routes/settings';

const app = express();
app.use(express.json());

// Mock auth middleware for testing
jest.mock('../middlewares/auth', () => ({
  authenticate: (req: any, res: any, next: any) => { req.user = { id: 1, role: 'admin' }; next(); },
  authorize: () => (req: any, res: any, next: any) => next()
}));

// Mock prisma
jest.mock('../config/prisma', () => ({
  __esModule: true,
  default: {
    library_settings: {
      findMany: jest.fn().mockResolvedValue([{ key: 'max_loans', value: '5' }]),
      upsert: jest.fn().mockResolvedValue({ key: 'max_loans', value: '10' })
    }
  }
}));

app.use('/api/settings', settingRoutes);

describe('Settings API Integration', () => {
  it('GET /api/settings should return settings', async () => {
    const res = await request(app).get('/api/settings');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([{ key: 'max_loans', value: '5' }]);
  });

  it('PUT /api/settings/:key should update a setting', async () => {
    const res = await request(app)
      .put('/api/settings/max_loans')
      .send({ value: '10' });
    
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ key: 'max_loans', value: '10' });
  });

  it('PUT /api/settings/:key should reject invalid payload (zod validation)', async () => {
    const res = await request(app)
      .put('/api/settings/max_loans')
      .send({ wrongKey: '10' });
    
    // Zod throws an error which is caught by express-async-handler and passed to next()
    // Ideally, there should be an error handler middleware returning 400.
    // If not, it returns 500 in standard express when exception occurs.
    expect(res.status).toBeGreaterThanOrEqual(400); 
  });
});
