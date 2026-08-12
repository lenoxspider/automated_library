import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import prisma from '../config/prisma';

export const logSearchQuery = asyncHandler(async (req: Request, res: Response) => {
  // @ts-expect-error - req.user is provided by authentication middleware
  const userId = req.user.id;
  const { query } = req.body;

  if (!query || typeof query !== 'string') {
    res.status(400).json({ message: 'Invalid query string' });
    return;
  }

  await prisma.search_history.create({
    data: {
      user_id: userId,
      query: query.trim(),
      timestamp: new Date().toISOString()
    }
  });

  res.status(201).json({ message: 'Query logged' });
});

export const getSearchHistory = asyncHandler(async (req: Request, res: Response) => {
  // @ts-expect-error - req.user is provided by authentication middleware
  const userId = req.user.id;

  const history = await prisma.search_history.findMany({
    where: { user_id: userId },
    orderBy: { id: 'desc' },
    take: 20
  });

  res.json(history);
});
