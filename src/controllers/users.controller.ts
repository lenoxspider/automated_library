import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { Request, Response } from 'express';
import { container } from 'tsyringe';
import { UserRepository } from '../repositories/user.repo';
import { EmailService } from '../services/email.service';
import asyncHandler from 'express-async-handler';
import { z } from 'zod';
import prisma from '../config/prisma';

const userRepo = container.resolve(UserRepository);
const emailService = container.resolve(EmailService);

export const getProfile = asyncHandler(async (req: Request, res: Response) => {
  // @ts-expect-error - req.user is provided by authentication middleware
  const userId = req.user.id as number;
  const user = await userRepo.findById(userId);
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  const [activeLoans, totalBooksBorrowed, currentFines, activeReservations] = await Promise.all([
    prisma.borrowings.count({ where: { member_id: userId, status: 'borrowed' } }),
    prisma.borrowings.count({ where: { member_id: userId } }),
    prisma.fines.aggregate({
      where: { status: 'unpaid', borrowings: { member_id: userId } },
      _sum: { amount: true }
    }),
    prisma.reservations.count({
      where: {
        member_id: userId,
        status: { in: ['pending', 'approved', 'ready_for_pickup'] }
      }
    })
  ]);

  res.json({
    user: {
      id: user.id,
      username: user.username,
      name: user.name,
      email: user.email,
      memberSince: user.created_at,
      role: user.role,
      student_id: user.student_id,
      index_number: user.index_number,
      account_status: user.account_status,
      language: user.language,
      email_notifications: user.email_notifications,
      library_points: user.library_points
    },
    stats: {
      activeLoans,
      totalBooksBorrowed,
      currentFines: currentFines._sum.amount ?? 0,
      activeReservations
    }
  });
});
export const getUsers = asyncHandler(async (req: Request, res: Response) => {
  const users = await userRepo.findAll();
  res.json({ data: users, totalCount: users.length });
});

export const deleteUser = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id as string);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const currentUser = (req as any).user;

  const targetUser = await userRepo.findById(id);
  if (!targetUser) {
    res.status(404).json({ error: 'User not found.' });
    return;
  }

  if (targetUser.role === 'admin' && currentUser.role !== 'admin') {
    res.status(403).json({ error: 'Forbidden. Librarians cannot delete admin accounts.' });
    return;
  }

  await userRepo.delete(id);
  res.json({ message: 'User deleted successfully.' });
});

export const getUserHistory = asyncHandler(async (req: Request, res: Response) => {
  // To be implemented using BorrowingRepository or User relation
  res.status(501).json({ message: 'User history not implemented yet' });
});

const createUserSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(6),
  name: z.string().min(1),
  email: z.string().email(),
  role: z.enum(['admin', 'librarian', 'member']),
  studentId: z.string().optional(),
  indexNumber: z.string().optional()
});

export const createUser = asyncHandler(async (req: Request, res: Response) => {
  const data = createUserSchema.parse(req.body);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const currentUser = (req as any).user;

  if (data.role === 'admin' && currentUser.role !== 'admin') {
    res.status(403).json({ error: 'Forbidden. Librarians cannot create admin accounts.' });
    return;
  }

  const hashedPassword = await bcrypt.hash(data.password, 10);
  const verifyToken = crypto.randomBytes(32).toString('hex');

  const newUser = await userRepo.create({
    username: data.username,
    password: hashedPassword,
    role: data.role,
    name: data.name,
    email: data.email,
    student_id: data.studentId || null,
    index_number: data.indexNumber || null,
    is_verified: 0,
    verification_token: verifyToken
  });

  await emailService.queueVerificationEmail(newUser.email, newUser.name, verifyToken);

  res
    .status(201)
    .json({ message: 'User created successfully. Verification email sent.', user: newUser });
});

export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  // @ts-expect-error - req.user is provided by authentication middleware - Assuming req.user is set by auth middleware
  const userId = req.user.id;
  const { language, emailNotifications, password, name, username } = req.body;

  const updateData: any = {};
  if (language) updateData.language = language;
  if (emailNotifications !== undefined) updateData.email_notifications = emailNotifications;
  if (name) updateData.name = name;
  if (username) updateData.username = username.trim();
  if (password) {
    updateData.password = await bcrypt.hash(password, 10);
  }

  const updatedUser = await userRepo.update(userId, updateData);
  res.json({
    message: 'Profile updated successfully',
    user: {
      name: updatedUser.name,
      username: updatedUser.username,
      language: updatedUser.language,
      emailNotifications: updatedUser.email_notifications
    }
  });
});
