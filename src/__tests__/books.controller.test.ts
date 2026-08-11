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

jest.mock('../services/bookCover.service', () => ({
  getOrFetchCoverPath: jest.fn().mockResolvedValue(null)
}));

jest.mock('../config/prisma', () => {
  const mockP = {
    books: { create: jest.fn(), findMany: jest.fn(), findUnique: jest.fn(), update: jest.fn() },
    book_copies: { create: jest.fn() }
  };
  return { __esModule: true, default: mockP, prisma: mockP };
});

import prisma from '../config/prisma';
import bookRoutes from '../routes/books';

const mockPrisma = prisma as any;

const app = express();
app.use(express.json());
app.use('/api/books', bookRoutes);

describe('POST /api/books', () => {
  beforeEach(() => jest.clearAllMocks());

  it('creates the book and a matching book_copies row for each requested copy', async () => {
    mockPrisma.books.create.mockResolvedValue({
      id: 1,
      title: 'Clean Code',
      author: 'Robert Martin',
      genre: 'Technology',
      isbn: '9780132350884',
      total_copies: 3,
      available_copies: 3,
      cover_path: null
    });
    mockPrisma.book_copies.create.mockResolvedValue({});

    const res = await request(app).post('/api/books').send({
      title: 'Clean Code',
      author: 'Robert Martin',
      genre: 'Technology',
      isbn: '9780132350884',
      total_copies: 3
    });

    expect(res.status).toBe(201);
    // total_copies is meaningless for checkout unless matching book_copies
    // rows actually exist - this is the bug found by testing checkout live
    // (every book had total_copies set but zero real copy rows).
    expect(mockPrisma.book_copies.create).toHaveBeenCalledTimes(3);
  });

  it('creates exactly one copy for a single-copy book', async () => {
    mockPrisma.books.create.mockResolvedValue({
      id: 2,
      title: 'Solo',
      author: 'A',
      genre: 'Fiction',
      isbn: '111',
      total_copies: 1,
      available_copies: 1,
      cover_path: null
    });
    mockPrisma.book_copies.create.mockResolvedValue({});

    await request(app)
      .post('/api/books')
      .send({ title: 'Solo', author: 'A', genre: 'Fiction', isbn: '111', total_copies: 1 });

    expect(mockPrisma.book_copies.create).toHaveBeenCalledTimes(1);
  });
});
