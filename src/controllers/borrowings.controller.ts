import { Request, Response } from 'express';
import { container } from 'tsyringe';
import { BorrowingRepository } from '../repositories/borrowing.repo';
import { CirculationService } from '../services/circulation.service';
import asyncHandler from 'express-async-handler';
import { z } from 'zod';

const borrowingRepo = container.resolve(BorrowingRepository);
const circulationService = container.resolve(CirculationService);

const createBorrowingSchema = z.object({
  copy_id: z.number().int(),
  member_id: z.number().int(),
});

export const getBorrowings = asyncHandler(async (req: Request, res: Response) => {
  const borrowings = await borrowingRepo.findAll();
  res.json({ data: borrowings, totalCount: borrowings.length });
});

export const createBorrowing = asyncHandler(async (req: Request, res: Response) => {
  const { copy_id, member_id } = createBorrowingSchema.parse(req.body);
  try {
    const borrowing = await circulationService.checkout(member_id, copy_id);
    res.status(201).json(borrowing);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export const returnBorrowing = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id as string);
  try {
    const result = await circulationService.returnBook(id);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export const getFines = asyncHandler(async (req: Request, res: Response) => {
  const fines = await circulationService.getFines();
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
