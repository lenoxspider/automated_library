import { Request, Response } from 'express';
import { container } from 'tsyringe';
import { BorrowingRepository } from '../repositories/borrowing.repo';
import { CirculationService } from '../services/circulation.service';
import asyncHandler from 'express-async-handler';
import { z } from 'zod';

const borrowingRepo = container.resolve(BorrowingRepository);
const circulationService = container.resolve(CirculationService);

import prisma from '../config/prisma';

const createBorrowingSchema = z.object({
  copy_barcode: z.string(),
  member_identifier: z.string()
});

export const getBorrowings = asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const borrowings =
    user.role === 'member'
      ? await borrowingRepo.findByMemberId(user.id)
      : await borrowingRepo.findAll();
  res.json({ data: borrowings, totalCount: borrowings.length });
});

export const createBorrowing = asyncHandler(async (req: Request, res: Response) => {
  const { copy_barcode, member_identifier } = createBorrowingSchema.parse(req.body);
  try {
    // Resolve copy
    const copy = await prisma.book_copies.findUnique({ where: { barcode: copy_barcode } });
    if (!copy) throw new Error('Book copy not found for barcode: ' + copy_barcode);

    // Resolve member (try exact match on student_id, index_number, username, or internal ID if numeric)
    const memberIdNum = parseInt(member_identifier, 10);
    const user = await prisma.users.findFirst({
      where: {
        OR: [
          { student_id: member_identifier },
          { index_number: member_identifier },
          { username: member_identifier },
          ...(isNaN(memberIdNum) ? [] : [{ id: memberIdNum }])
        ]
      }
    });
    if (!user) throw new Error('Member not found: ' + member_identifier);

    const borrowing = await circulationService.checkout(user.id, copy.id);
    res.status(201).json(borrowing);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export const returnBorrowing = asyncHandler(async (req: Request, res: Response) => {
  const barcodeOrId = req.params.id as string;
  try {
    // Check if they passed a borrowing ID (purely numeric) or a barcode.
    // In real libraries, you scan the book's barcode to return it.
    let borrowingId = parseInt(barcodeOrId, 10);
    // First, try to resolve it as a barcode
    const copy = await prisma.book_copies.findUnique({ where: { barcode: barcodeOrId } });
    if (copy) {
      const activeBorrowing = await prisma.borrowings.findFirst({
        where: { copy_id: copy.id, return_date: null },
        orderBy: { borrow_date: 'desc' }
      });
      if (!activeBorrowing) throw new Error('No active borrowing found for this book copy');
      borrowingId = activeBorrowing.id;
    } else if (isNaN(borrowingId)) {
      throw new Error('Book copy not found for barcode: ' + barcodeOrId);
    }
    const result = await circulationService.returnBook(borrowingId);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export const getFines = asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const fines =
    user.role === 'member'
      ? await circulationService.getFinesForMember(user.id)
      : await circulationService.getFines();
  res.json(fines);
});

export const payFine = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id as string);
  try {
    const result = await circulationService.payFine(id);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});
