import 'reflect-metadata';
import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

process.env.ACCESS_SECRET = 'test_access_secret';
process.env.REFRESH_SECRET = 'test_refresh_secret';

jest.mock('../config/redis', () => {
  const mockRedis = {
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue('OK'),
    del: jest.fn().mockResolvedValue(1)
  };
  return { __esModule: true, default: mockRedis };
});

const mockFindAll = jest.fn();
jest.mock('../repositories/user.repo', () => {
  return {
    UserRepository: jest.fn().mockImplementation(() => ({
      findAll: mockFindAll
    }))
  };
});

jest.mock('../config/prisma', () => {
  const mockP = { users: { create: jest.fn(), findFirst: jest.fn(), update: jest.fn() } };
  return { __esModule: true, default: mockP, prisma: mockP };
});

// auth.controller.ts wires up UserService/EmailService at module load; EmailService's
// constructor creates a real BullMQ Queue/Worker against redisClient, which hangs
// against the plain mock above. Neither service is exercised by login/logout/verify
// coverage here, so stub them out entirely.
jest.mock('../services/user.service', () => ({
  UserService: jest.fn().mockImplementation(() => ({ verifyRoster: jest.fn() }))
}));
jest.mock('../services/email.service', () => ({
  EmailService: jest.fn().mockImplementation(() => ({ queueVerificationEmail: jest.fn() }))
}));

import redisClient from '../config/redis';
import authRoutes from '../routes/auth';
import { authenticate, authorize } from '../middlewares/auth';

const mockRedis = redisClient as unknown as {
  get: jest.Mock;
  set: jest.Mock;
  del: jest.Mock;
};

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

describe('POST /api/auth/login', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRedis.get.mockResolvedValue(null);
  });

  it('returns 401 for a username that does not exist', async () => {
    mockFindAll.mockResolvedValue([]);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'nobody', password: 'whatever' });

    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/invalid/i);
  });

  it('returns 401 for a wrong password', async () => {
    const hash = await bcrypt.hash('correct-password', 10);
    mockFindAll.mockResolvedValue([{ id: 1, username: 'member1', password: hash, role: 'member' }]);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'member1', password: 'wrong-password' });

    expect(res.status).toBe(401);
  });

  it('sets httpOnly access + refresh cookies and stores the refresh token in redis on success', async () => {
    const hash = await bcrypt.hash('correct-password', 10);
    mockFindAll.mockResolvedValue([
      {
        id: 42,
        username: 'member1',
        password: hash,
        role: 'member',
        name: 'Member One',
        email: 'm1@example.com'
      }
    ]);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'member1', password: 'correct-password' });

    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeUndefined();
    expect(res.body.refreshToken).toBeUndefined();
    expect(res.body.user).toEqual({
      id: 42,
      username: 'member1',
      name: 'Member One',
      email: 'm1@example.com',
      role: 'member'
    });

    const setCookieHeader = res.headers['set-cookie'] as unknown as string[];
    const accessCookie = setCookieHeader.find((c) => c.startsWith('accessToken='));
    const refreshCookie = setCookieHeader.find((c) => c.startsWith('refreshToken='));
    expect(accessCookie).toMatch(/HttpOnly/);
    expect(refreshCookie).toMatch(/HttpOnly/);

    const accessToken = accessCookie!.split(';')[0].split('=')[1];
    const refreshToken = refreshCookie!.split(';')[0].split('=')[1];

    const decoded = jwt.verify(accessToken, process.env.ACCESS_SECRET as string) as jwt.JwtPayload;
    expect(decoded.sub).toBe(42);
    expect(decoded.role).toBe('member');

    expect(mockRedis.set).toHaveBeenCalledWith('rt_42', refreshToken, 'EX', 30 * 24 * 60 * 60);
  });

  it('rejects a payload missing required fields (zod validation)', async () => {
    const res = await request(app).post('/api/auth/login').send({ username: 'onlyusername' });
    expect(res.status).toBeGreaterThanOrEqual(400);
  });
});

describe('POST /api/auth/logout', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRedis.get.mockResolvedValue(null);
  });

  it('blacklists the access token and clears the refresh token', async () => {
    const token = jwt.sign({ sub: 7, role: 'member' }, process.env.ACCESS_SECRET as string, {
      expiresIn: '15m'
    });

    const res = await request(app).post('/api/auth/logout').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(mockRedis.set).toHaveBeenCalledWith(`bl_${token}`, 'true', 'EX', 15 * 60);
    expect(mockRedis.del).toHaveBeenCalledWith('rt_7');
  });
});

describe('authenticate middleware', () => {
  const next = jest.fn();
  const mockRes = () => {
    const res: any = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockRedis.get.mockResolvedValue(null);
  });

  it('rejects a request with no Authorization header', async () => {
    const req: any = { headers: {} };
    const res = mockRes();
    await authenticate(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('rejects an expired token', async () => {
    const expiredToken = jwt.sign({ sub: 1, role: 'member' }, process.env.ACCESS_SECRET as string, {
      expiresIn: -10 // already expired
    });
    const req: any = { headers: { authorization: `Bearer ${expiredToken}` } };
    const res = mockRes();

    await authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid or expired token.' });
    expect(next).not.toHaveBeenCalled();
  });

  it('rejects a token signed with the wrong secret', async () => {
    const badToken = jwt.sign({ sub: 1, role: 'member' }, 'someone_elses_secret', {
      expiresIn: '15m'
    });
    const req: any = { headers: { authorization: `Bearer ${badToken}` } };
    const res = mockRes();

    await authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('rejects a blacklisted (logged-out) token', async () => {
    const token = jwt.sign({ sub: 1, role: 'member' }, process.env.ACCESS_SECRET as string, {
      expiresIn: '15m'
    });
    mockRedis.get.mockResolvedValue('true');
    const req: any = { headers: { authorization: `Bearer ${token}` } };
    const res = mockRes();

    await authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('accepts a valid token and attaches the user to the request', async () => {
    const token = jwt.sign({ sub: 5, role: 'librarian' }, process.env.ACCESS_SECRET as string, {
      expiresIn: '15m'
    });
    const req: any = { headers: { authorization: `Bearer ${token}` } };
    const res = mockRes();

    await authenticate(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user).toEqual({ id: 5, role: 'librarian' });
  });
});

describe('authorize middleware', () => {
  const next = jest.fn();
  const mockRes = () => {
    const res: any = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
  };

  beforeEach(() => jest.clearAllMocks());

  it('allows a user with an authorized role through', () => {
    const req: any = { user: { id: 1, role: 'admin' } };
    const res = mockRes();
    authorize(['admin', 'librarian'])(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('rejects a user whose role is not in the allowed list', () => {
    const req: any = { user: { id: 1, role: 'member' } };
    const res = mockRes();
    authorize(['admin', 'librarian'])(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });
});
