import 'reflect-metadata';
import request from 'supertest';
import express from 'express';

jest.mock('../middlewares/auth', () => ({
  authenticate: (req: any, _res: any, next: any) => {
    req.user = { id: 1, role: 'member' };
    next();
  },
  authorize: () => (_req: any, _res: any, next: any) => next()
}));

jest.mock('../config/prisma', () => {
  const mockP = {
    books: { findUnique: jest.fn() },
    reservations: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      delete: jest.fn()
    }
  };
  return { __esModule: true, default: mockP, prisma: mockP };
});

import prisma from '../config/prisma';
import reservationRoutes from '../routes/reservations';

const mockPrisma = prisma as any;

const app = express();
app.use(express.json());
app.use('/api/reservations', reservationRoutes);

describe('POST /api/reservations', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 404 if the book does not exist', async () => {
    mockPrisma.books.findUnique.mockResolvedValue(null);

    const res = await request(app).post('/api/reservations').send({ book_id: 999, member_id: 1 });

    expect(res.status).toBe(404);
    expect(mockPrisma.reservations.create).not.toHaveBeenCalled();
  });

  it('creates a pending reservation for a valid book', async () => {
    mockPrisma.books.findUnique.mockResolvedValue({ id: 10, title: 'Clean Code' });
    mockPrisma.reservations.create.mockResolvedValue({
      id: 1,
      book_id: 10,
      member_id: 1,
      status: 'pending'
    });

    const res = await request(app).post('/api/reservations').send({ book_id: 10, member_id: 1 });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe('pending');
    expect(mockPrisma.reservations.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ book_id: 10, member_id: 1, status: 'pending' })
    });
  });

  it('rejects a payload missing required fields (zod validation)', async () => {
    const res = await request(app).post('/api/reservations').send({ book_id: 10 });
    expect(res.status).toBeGreaterThanOrEqual(400);
  });

  it('rejects a duplicate reservation for the same member and book while one is already pending', async () => {
    mockPrisma.books.findUnique.mockResolvedValue({ id: 10, title: 'Clean Code' });
    mockPrisma.reservations.findFirst.mockResolvedValue({
      id: 1,
      book_id: 10,
      member_id: 1,
      status: 'pending'
    });

    const res = await request(app).post('/api/reservations').send({ book_id: 10, member_id: 1 });

    expect(res.status).toBe(409);
    expect(mockPrisma.reservations.create).not.toHaveBeenCalled();
  });

  it('allows a member to reserve the same book again once the earlier reservation is no longer pending', async () => {
    mockPrisma.books.findUnique.mockResolvedValue({ id: 10, title: 'Clean Code' });
    mockPrisma.reservations.findFirst.mockResolvedValue(null); // no pending reservation found
    mockPrisma.reservations.create.mockResolvedValue({
      id: 2,
      book_id: 10,
      member_id: 1,
      status: 'pending'
    });

    const res = await request(app).post('/api/reservations').send({ book_id: 10, member_id: 1 });

    expect(res.status).toBe(201);
    expect(mockPrisma.reservations.create).toHaveBeenCalled();
  });
});

describe('DELETE /api/reservations/:id', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 404 if the reservation does not exist', async () => {
    mockPrisma.reservations.findUnique.mockResolvedValue(null);

    const res = await request(app).delete('/api/reservations/999');

    expect(res.status).toBe(404);
    expect(mockPrisma.reservations.delete).not.toHaveBeenCalled();
  });

  it('cancels an existing reservation', async () => {
    mockPrisma.reservations.findUnique.mockResolvedValue({ id: 1, status: 'pending' });
    mockPrisma.reservations.delete.mockResolvedValue({ id: 1 });

    const res = await request(app).delete('/api/reservations/1');

    expect(res.status).toBe(200);
    expect(mockPrisma.reservations.delete).toHaveBeenCalledWith({ where: { id: 1 } });
  });
});
