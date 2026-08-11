import 'reflect-metadata';
import request from 'supertest';
import express from 'express';

let mockUser: { id: number; role: string } = { id: 1, role: 'admin' };

jest.mock('../middlewares/auth', () => ({
  authenticate: (req: any, _res: any, next: any) => {
    req.user = mockUser;
    next();
  },
  authorize: () => (_req: any, _res: any, next: any) => next()
}));

jest.mock('../config/prisma', () => {
  const mockP = {
    borrowings: { findMany: jest.fn() },
    fines: { findMany: jest.fn() }
  };
  return { __esModule: true, default: mockP, prisma: mockP };
});

import prisma from '../config/prisma';
import borrowingRoutes from '../routes/borrowings';
import fineRoutes from '../routes/fines';

const mockPrisma = prisma as any;

const app = express();
app.use(express.json());
app.use('/api/borrowings', borrowingRoutes);
app.use('/api/fines', fineRoutes);

describe('GET /api/borrowings (role scoping)', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns every borrowing for a librarian', async () => {
    mockUser = { id: 99, role: 'librarian' };
    mockPrisma.borrowings.findMany.mockResolvedValue([
      { id: 1, member_id: 1 },
      { id: 2, member_id: 2 }
    ]);

    const res = await request(app).get('/api/borrowings');

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
    expect(mockPrisma.borrowings.findMany).toHaveBeenCalledWith();
  });

  it('scopes to only the caller for a member', async () => {
    mockUser = { id: 7, role: 'member' };
    mockPrisma.borrowings.findMany.mockResolvedValue([{ id: 3, member_id: 7 }]);

    const res = await request(app).get('/api/borrowings');

    expect(res.status).toBe(200);
    expect(mockPrisma.borrowings.findMany).toHaveBeenCalledWith({ where: { member_id: 7 } });
  });
});

describe('GET /api/fines (role scoping)', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns every fine for an admin', async () => {
    mockUser = { id: 99, role: 'admin' };
    mockPrisma.fines.findMany.mockResolvedValue([{ id: 1 }, { id: 2 }]);

    const res = await request(app).get('/api/fines');

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(mockPrisma.fines.findMany).toHaveBeenCalledWith();
  });

  it('scopes to only the caller member via a borrowings join', async () => {
    mockUser = { id: 7, role: 'member' };
    mockPrisma.fines.findMany.mockResolvedValue([{ id: 5 }]);

    const res = await request(app).get('/api/fines');

    expect(res.status).toBe(200);
    expect(mockPrisma.fines.findMany).toHaveBeenCalledWith({
      where: { borrowings: { member_id: 7 } }
    });
  });
});
