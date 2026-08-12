import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import prisma from '../config/prisma';
import { z } from 'zod';

const createReservationSchema = z.object({
  book_id: z.number().int(),
  member_id: z.number().int()
});

export const getReservations = asyncHandler(async (req: Request, res: Response) => {
  const { status, search, page = '1', limit = '50' } = req.query;
  const pageNumber = parseInt(page as string, 10);
  const limitNumber = parseInt(limit as string, 10);
  const skip = (pageNumber - 1) * limitNumber;

  const where: any = {};

  if (status) {
    const statuses = (status as string).split(',').map(s => s.trim());
    where.status = { in: statuses };
  }

  if (search) {
    const searchStr = search as string;
    where.OR = [
      { books: { title: { contains: searchStr } } },
      { books: { author: { contains: searchStr } } },
      { books: { isbn: { contains: searchStr } } },
      { users: { name: { contains: searchStr } } },
      { users: { email: { contains: searchStr } } },
      { users: { student_id: { contains: searchStr } } }
    ];
  }

  const [rawReservations, totalCount] = await Promise.all([
    prisma.reservations.findMany({
      where,
      skip,
      take: limitNumber,
      include: {
        books: { select: { id: true, title: true, author: true, isbn: true, cover_path: true } },
        users: { select: { id: true, name: true, email: true, student_id: true } }
      },
      orderBy: { reservation_date: 'desc' }
    }),
    prisma.reservations.count({ where })
  ]);

  // Compute queue_position and expiration date for each reservation
  const reservations = await Promise.all(rawReservations.map(async (resItem) => {
    let queue_position = null;
    let expiration_date = null;

    if (resItem.status === 'pending') {
      const count = await prisma.reservations.count({
        where: {
          book_id: resItem.book_id,
          status: 'pending',
          reservation_date: { lt: resItem.reservation_date }
        }
      });
      queue_position = count + 1;
    }

    // Expiration date simulated as 7 days after request, or 3 days after ready for pickup
    const baseDate = new Date(resItem.reservation_date);
    if (resItem.status === 'pending') {
      baseDate.setDate(baseDate.getDate() + 14); // e.g. expires in 14 days if not picked up
      expiration_date = baseDate.toISOString();
    } else if (resItem.status === 'ready_for_pickup' || resItem.status === 'approved') {
      baseDate.setDate(baseDate.getDate() + 3);
      expiration_date = baseDate.toISOString();
    }

    return {
      ...resItem,
      queue_position,
      expiration_date
    };
  }));

  res.json({ data: reservations, count: totalCount });
});

export const createReservation = asyncHandler(async (req: Request, res: Response) => {
  const { book_id, member_id } = createReservationSchema.parse(req.body);

  // Verify book exists
  const book = await prisma.books.findUnique({ where: { id: book_id } });
  if (!book) {
    res.status(404).json({ error: 'Book not found' });
    return;
  }

  // Prevent the same member from reserving the same book twice while a
  // reservation is still pending
  const existingReservation = await prisma.reservations.findFirst({
    where: { book_id, member_id, status: 'pending' }
  });
  if (existingReservation) {
    res.status(409).json({ error: 'You already have a pending reservation for this book' });
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

export const approveReservation = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id as string);

  const reservation = await prisma.reservations.findUnique({ where: { id } });
  if (!reservation) {
    res.status(404).json({ error: 'Reservation not found' });
    return;
  }
  if (reservation.status !== 'pending') {
    res.status(400).json({ error: `Reservation is already ${reservation.status}` });
    return;
  }

  const updated = await prisma.reservations.update({
    where: { id },
    data: { status: 'approved' }
  });

  res.json(updated);
});

export const bulkUpdateReservations = asyncHandler(async (req: Request, res: Response) => {
  const { ids, action } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) {
    res.status(400).json({ error: 'No IDs provided' });
    return;
  }

  let newStatus = '';
  if (action === 'approve') newStatus = 'approved';
  else if (action === 'cancel') newStatus = 'cancelled';
  else if (action === 'ready') newStatus = 'ready_for_pickup';
  else if (action === 'expire') newStatus = 'expired';
  else {
    res.status(400).json({ error: 'Invalid action' });
    return;
  }

  const result = await prisma.reservations.updateMany({
    where: { id: { in: ids } },
    data: { status: newStatus }
  });

  res.json({ success: true, count: result.count });
});
