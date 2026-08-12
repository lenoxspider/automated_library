import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import prisma from '../config/prisma';

export const getTickets = asyncHandler(async (req: Request, res: Response) => {
  const tickets = await prisma.support_tickets.findMany({
    include: { users: { select: { name: true, email: true } } },
    orderBy: { id: 'desc' }
  });
  res.json(tickets);
});

export const createTicket = asyncHandler(async (req: Request, res: Response) => {
  // @ts-expect-error - req.user is provided by authentication middleware
  const userId = req.user.id;
  const { subject, message } = req.body;

  const ticket = await prisma.support_tickets.create({
    data: {
      member_id: userId,
      subject,
      message,
      created_at: new Date().toISOString()
    }
  });

  res.status(201).json({ message: 'Support ticket submitted', ticket });
});

export const resolveTicket = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id as string);

  const ticket = await prisma.support_tickets.update({
    where: { id },
    data: { status: 'resolved' }
  });

  res.json({ message: 'Ticket resolved successfully', ticket });
});
