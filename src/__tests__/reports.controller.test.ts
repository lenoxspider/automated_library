import 'reflect-metadata';
import request from 'supertest';
import express from 'express';

jest.mock('../middlewares/auth', () => ({
  authenticate: (req: any, _res: any, next: any) => {
    req.user = { id: 1, role: 'admin' };
    next();
  },
  authorize: () => (_req: any, _res: any, next: any) => next()
}));

jest.mock('../config/prisma', () => {
  const mockP = {
    borrowings: { findMany: jest.fn() },
    fines: { findMany: jest.fn() },
    users: { findMany: jest.fn() },
    student_roster: { findMany: jest.fn() }
  };
  return { __esModule: true, default: mockP, prisma: mockP };
});

import prisma from '../config/prisma';
import reportRoutes from '../routes/reports';

const mockPrisma = prisma as any;

const app = express();
app.use(express.json());
app.use('/api/reports', reportRoutes);

function isoDaysAgo(n: number, hour = '12:00:00') {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return `${d.toISOString().slice(0, 10)}T${hour}.000Z`;
}

describe('GET /api/reports/weekly-activity', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns exactly 7 days, oldest first, ending today', async () => {
    mockPrisma.borrowings.findMany.mockResolvedValue([]);
    mockPrisma.fines.findMany.mockResolvedValue([]);

    const res = await request(app).get('/api/reports/weekly-activity');

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(7);
    const today = new Date().toISOString().slice(0, 10);
    expect(res.body.data[6].date).toBe(today);
  });

  it('buckets checkouts, returns, and paid fines into the correct day', async () => {
    mockPrisma.borrowings.findMany
      .mockResolvedValueOnce([{ borrow_date: isoDaysAgo(1) }, { borrow_date: isoDaysAgo(1) }])
      .mockResolvedValueOnce([{ return_date: isoDaysAgo(2) }]);
    mockPrisma.fines.findMany.mockResolvedValue([
      { payment_date: isoDaysAgo(1), amount: 5 },
      { payment_date: isoDaysAgo(1), amount: 2.5 }
    ]);

    const res = await request(app).get('/api/reports/weekly-activity');

    const yesterday = res.body.data.find((d: any) => d.date === isoDaysAgo(1).slice(0, 10));
    const twoDaysAgo = res.body.data.find((d: any) => d.date === isoDaysAgo(2).slice(0, 10));

    expect(yesterday.checkouts).toBe(2);
    expect(yesterday.fines_collected).toBe(7.5);
    expect(twoDaysAgo.returns).toBe(1);
  });

  it('queries only the last 7 days (gte the start of day 7 ago), not the full table', async () => {
    mockPrisma.borrowings.findMany.mockResolvedValue([]);
    mockPrisma.fines.findMany.mockResolvedValue([]);

    await request(app).get('/api/reports/weekly-activity');

    const sevenDaysAgo = isoDaysAgo(6, '00:00:00').slice(0, 10);
    expect(mockPrisma.borrowings.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { borrow_date: { gte: `${sevenDaysAgo}T00:00:00.000Z` } }
      })
    );
  });
});
