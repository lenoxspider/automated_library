import { Request, Response } from 'express';
import { container } from 'tsyringe';
import asyncHandler from 'express-async-handler';
import { z } from 'zod';
import { AuthService, AuthError } from '../services/auth.service';
import { ACCESS_TOKEN_COOKIE_OPTIONS, REFRESH_TOKEN_COOKIE_OPTIONS } from '../config/env';

const authService = container.resolve(AuthService);

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1)
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { username, password } = loginSchema.parse(req.body);

  try {
    const { accessToken, refreshToken, user } = await authService.login(username, password);

    res.cookie('accessToken', accessToken, ACCESS_TOKEN_COOKIE_OPTIONS);
    res.cookie('refreshToken', refreshToken, REFRESH_TOKEN_COOKIE_OPTIONS);
    res.json({ user });
  } catch (err) {
    if (err instanceof AuthError) {
      res.status(err.status).json({ error: err.message });
      return;
    }
    throw err;
  }
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  const token = req.cookies?.accessToken || req.headers.authorization?.split(' ')[1];
  const userId = (req as any).user?.id;

  await authService.logout(token, userId);

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
    const { accessToken } = await authService.refresh(refreshToken);
    res.cookie('accessToken', accessToken, ACCESS_TOKEN_COOKIE_OPTIONS);
    res.json({ message: 'Access token refreshed' });
  } catch (err) {
    if (err instanceof AuthError) {
      res.status(err.status).json({ error: err.message });
      return;
    }
    throw err;
  }
});

const registerSchema = z.object({
  password: z.string().min(6),
  name: z.string().min(1),
  email: z.string().email(),
  studentId: z.string().optional(),
  indexNumber: z.string().optional(),
  librarianCode: z.string().optional()
});

export const register = asyncHandler(async (req: Request, res: Response) => {
  const data = registerSchema.parse(req.body);

  try {
    const newUser = await authService.register(data);
    res.status(201).json({
      message: 'Registration successful. Please check your email to verify your account.',
      username: newUser.username
    });
  } catch (err) {
    if (err instanceof AuthError) {
      res.status(err.status).json({ error: err.message });
      return;
    }
    throw err;
  }
});

export const verifyEmail = asyncHandler(async (req: Request, res: Response) => {
  const token = req.params.token as string;

  try {
    await authService.verifyEmail(token);
    res.json({ message: 'Email verified successfully. You may now log in.' });
  } catch (err) {
    if (err instanceof AuthError) {
      res.status(err.status).json({ error: err.message });
      return;
    }
    throw err;
  }
});

export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  const { email } = z.object({ email: z.string().email() }).parse(req.body);

  await authService.forgotPassword(email);

  // Same message regardless of whether the email exists, to prevent enumeration.
  res.json({ message: 'If that email exists, a reset link has been sent.' });
});

export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  const token = req.params.token as string;
  const { password } = z.object({ password: z.string().min(6) }).parse(req.body);

  try {
    await authService.resetPassword(token, password);
    res.json({ message: 'Password reset successfully' });
  } catch (err) {
    if (err instanceof AuthError) {
      res.status(err.status).json({ error: err.message });
      return;
    }
    throw err;
  }
});
