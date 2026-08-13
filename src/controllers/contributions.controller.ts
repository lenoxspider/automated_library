import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import prisma from '../config/prisma';

export const getMyContributions = asyncHandler(async (req: Request, res: Response) => {
  // @ts-expect-error - req.user is provided by authentication middleware
  const userId = req.user.id;
  const contributions = await prisma.contributions.findMany({
    where: { member_id: userId },
    include: { books: { select: { title: true } } },
    orderBy: { id: 'desc' }
  });

  const user = await prisma.users.findUnique({ where: { id: userId } });

  res.json({
    library_points: user?.library_points || 0,
    contributions
  });
});

export const submitContribution = asyncHandler(async (req: Request, res: Response) => {
  // @ts-expect-error - req.user is provided by authentication middleware
  const userId = req.user.id;
  const { book_identifier, contribution_type, content } = req.body;

  const book = await prisma.books.findFirst({
    where: {
      OR: [
        { isbn: book_identifier },
        { title: { contains: book_identifier } }
      ]
    }
  });

  if (!book) {
    res.status(404).json({ error: 'Could not find a book matching that ISBN or title.' });
    return;
  }

  const contribution = await prisma.contributions.create({
    data: {
      member_id: userId,
      book_id: book.id,
      contribution_type,
      content,
      created_at: new Date().toISOString()
    }
  });

  res.status(201).json(contribution);
});

export const getQueue = asyncHandler(async (req: Request, res: Response) => {
  const queue = await prisma.contributions.findMany({
    where: { status: 'pending' },
    include: {
      books: { select: { title: true } },
      users: { select: { id: true, name: true, library_points: true } }
    },
    orderBy: { id: 'asc' }
  });
  res.json(queue);
});

export const approveContribution = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id as string);

  await prisma.$transaction(async (tx) => {
    const contribution = await tx.contributions.update({
      where: { id },
      data: { status: 'approved' }
    });

    await tx.users.update({
      where: { id: contribution.member_id },
      data: { library_points: { increment: 10 } }
    });
  });

  res.json({ message: 'Contribution approved and points awarded' });
});

export const rejectContribution = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id as string);

  await prisma.contributions.update({
    where: { id },
    data: { status: 'rejected' }
  });

  res.json({ message: 'Contribution rejected' });
});
