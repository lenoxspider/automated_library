import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { container } from 'tsyringe';
import { UserRepository } from '../repositories/user.repo';
import redisClient from '../config/redis';
import asyncHandler from 'express-async-handler';
import { z } from 'zod';
import {
  ACCESS_SECRET,
  REFRESH_SECRET,
  ACCESS_TOKEN_COOKIE_OPTIONS,
  REFRESH_TOKEN_COOKIE_OPTIONS
} from '../config/env';

const userRepo = container.resolve(UserRepository);

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1)
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { username, password } = loginSchema.parse(req.body);

  // NOTE: For full implementation, we'd add `findByUsername` to UserRepository.
  // We'll simulate checking the DB.
  const users = await userRepo.findAll();
  const user = users.find((u) => u.username === username);

  if (!user || !(await bcrypt.compare(password, user.password))) {
    res.status(401).json({ error: 'Invalid username or password' });
    return;
  }

  // Issue Access Token
  const accessToken = jwt.sign({ sub: user.id, role: user.role }, ACCESS_SECRET, {
    expiresIn: '15m'
  });

  // Issue Refresh Token
  const refreshToken = jwt.sign({ sub: user.id }, REFRESH_SECRET, { expiresIn: '30d' });

  // Store refresh token in Redis (or an ID related to it)
  await redisClient.set(`rt_${user.id}`, refreshToken, 'EX', 30 * 24 * 60 * 60);

  res.cookie('accessToken', accessToken, ACCESS_TOKEN_COOKIE_OPTIONS);
  res.cookie('refreshToken', refreshToken, REFRESH_TOKEN_COOKIE_OPTIONS);

  res.json({
    user: {
      id: user.id,
      username: user.username,
      name: user.name,
      email: user.email,
      role: user.role
    }
  });
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  const token = req.cookies?.accessToken || req.headers.authorization?.split(' ')[1];
  if (token) {
    // Blacklist access token for 15 mins
    await redisClient.set(`bl_${token}`, 'true', 'EX', 15 * 60);
  }

  const userId = (req as any).user?.id;
  if (userId) {
    // Invalidate refresh token
    await redisClient.del(`rt_${userId}`);
  }

  res.clearCookie('accessToken', ACCESS_TOKEN_COOKIE_OPTIONS);
  res.clearCookie('refreshToken', REFRESH_TOKEN_COOKIE_OPTIONS);

  res.json({ message: 'Logged out successfully' });
});

export const refreshToken = asyncHandler(async (req: Request, res: Response) => {
  const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
  if (!refreshToken) {
    res.status(401).json({ error: 'No refresh token provided' });
    return;
  }

  try {
    const decoded = jwt.verify(refreshToken, REFRESH_SECRET) as jwt.JwtPayload;

    // Check if refresh token is valid in Redis
    const storedToken = await redisClient.get(`rt_${decoded.sub}`);
    if (storedToken !== refreshToken) {
      res.status(401).json({ error: 'Invalid or revoked refresh token' });
      return;
    }

    // We need the user's role. Let's fetch it from DB to ensure it's up to date.
    const user = await prisma.users.findUnique({ where: { id: Number(decoded.sub) } });
    if (!user) {
      res.status(401).json({ error: 'User no longer exists' });
      return;
    }

    // Issue a new access token
    const newAccessToken = jwt.sign({ sub: user.id, role: user.role }, ACCESS_SECRET, {
      expiresIn: '15m'
    });

    res.cookie('accessToken', newAccessToken, ACCESS_TOKEN_COOKIE_OPTIONS);
    res.json({ message: 'Access token refreshed' });
  } catch (error) {
    res.status(401).json({ error: 'Refresh token expired or invalid' });
  }
});

// Import additional services
import { UserService } from '../services/user.service';
import { EmailService } from '../services/email.service';
import crypto from 'crypto';
import prisma from '../config/prisma';

const userService = container.resolve(UserService);
const emailService = container.resolve(EmailService);

const registerSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(6),
  name: z.string().min(1),
  email: z.string().email(),
  studentId: z.string().min(1),
  indexNumber: z.string().min(1)
});

export const register = asyncHandler(async (req: Request, res: Response) => {
  const data = registerSchema.parse(req.body);

  const isValidStudent = await userService.verifyRoster(data.studentId, data.indexNumber);
  if (!isValidStudent) {
    res
      .status(400)
      .json({ error: 'Roster verification failed. Invalid Student ID or Index Number.' });
    return;
  }

  const hashedPassword = await bcrypt.hash(data.password, 10);
  const verifyToken = crypto.randomBytes(32).toString('hex');

  const newUser = await prisma.users.create({
    data: {
      username: data.username,
      password: hashedPassword,
      role: 'member',
      name: data.name,
      email: data.email,
      student_id: data.studentId,
      index_number: data.indexNumber,
      is_verified: 0,
      verification_token: verifyToken
    }
  });

  await emailService.queueVerificationEmail(newUser.email, newUser.name, verifyToken);

  res
    .status(201)
    .json({ message: 'Registration successful. Please check your email to verify your account.' });
});

export const verifyEmail = asyncHandler(async (req: Request, res: Response) => {
  const token = req.params.token as string;

  const user = await prisma.users.findFirst({
    where: { verification_token: token }
  });

  if (!user) {
    res.status(400).json({ error: 'Invalid verification token' });
    return;
  }

  await prisma.users.update({
    where: { id: user.id },
    data: { is_verified: 1, verification_token: null }
  });

  res.json({ message: 'Email verified successfully. You may now log in.' });
});

export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  const { email } = z.object({ email: z.string().email() }).parse(req.body);

  const user = await prisma.users.findFirst({ where: { email } });
  if (!user) {
    // Return same message to prevent email enumeration
    res.json({ message: 'If that email exists, a reset link has been sent.' });
    return;
  }

  const resetToken = crypto.randomBytes(32).toString('hex');
  const expiry = new Date(Date.now() + 3600000); // 1 hour

  await prisma.users.update({
    where: { id: user.id },
    data: { reset_token: resetToken, reset_token_expiry: expiry }
  });

  // NOTE: Enqueue reset email via EmailService here
  res.json({ message: 'If that email exists, a reset link has been sent.' });
});

export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  const token = req.params.token as string;
  const { password } = z.object({ password: z.string().min(6) }).parse(req.body);

  const user = await prisma.users.findFirst({
    where: {
      reset_token: token,
      reset_token_expiry: { gte: new Date() }
    }
  });

  if (!user) {
    res.status(400).json({ error: 'Invalid or expired reset token' });
    return;
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  await prisma.users.update({
    where: { id: user.id },
    data: { password: hashedPassword, reset_token: null, reset_token_expiry: null }
  });

  res.json({ message: 'Password reset successfully' });
});
