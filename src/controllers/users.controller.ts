import { Request, Response } from 'express';
import { container } from 'tsyringe';
import { UserRepository } from '../repositories/user.repo';
import asyncHandler from 'express-async-handler';
import { z } from 'zod';

const userRepo = container.resolve(UserRepository);

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
