import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import prisma from '../config/prisma';
import { z } from 'zod';

const createReservationSchema = z.object({
  book_id: z.number().int(),
  member_id: z.number().int()
});

export const createReservation = asyncHandler(async (req: Request, res: Response) => {
  const { book_id, member_id } = createReservationSchema.parse(req.body);
  
  // Verify book exists
  const book = await prisma.books.findUnique({ where: { id: book_id } });
  if (!book) {
    res.status(404).json({ error: 'Book not found' });
    return;
  }
  
  const reservationDate = new Date().toISOString();

  const newReservation = await prisma.reservations.create({
    data: {
      book_id,
      member_id,
      reservation_date: reservationDate,
      status: 'pending'
    }
  });

  res.status(201).json(newReservation);
});

export const cancelReservation = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id as string);
  
  const reservation = await prisma.reservations.findUnique({ where: { id } });
  if (!reservation) {
    res.status(404).json({ error: 'Reservation not found' });
    return;
  }

  await prisma.reservations.delete({ where: { id } });
  res.json({ message: 'Reservation cancelled successfully' });
});
