import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { Request, Response } from 'express';
import { container } from 'tsyringe';
import { UserRepository } from '../repositories/user.repo';
import { EmailService } from '../services/email.service';
import asyncHandler from 'express-async-handler';
import { z } from 'zod';

const userRepo = container.resolve(UserRepository);
const emailService = container.resolve(EmailService);

export const getUsers = asyncHandler(async (req: Request, res: Response) => {
  const users = await userRepo.findAll();
  res.json({ data: users, totalCount: users.length });
});

export const deleteUser = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id as string);
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
  const { language, emailNotifications, password, name } = req.body;

  const updateData: any = {};
  if (language) updateData.language = language;
  if (emailNotifications !== undefined) updateData.email_notifications = emailNotifications;
  if (name) updateData.name = name;
  if (password) {
    updateData.password = await bcrypt.hash(password, 10);
  }

  const updatedUser = await userRepo.update(userId, updateData);
  res.json({
    message: 'Profile updated successfully',
    user: {
      name: updatedUser.name,
      language: updatedUser.language,
      emailNotifications: updatedUser.email_notifications
    }
  });
});
