import { Request, Response } from 'express';
import { container } from 'tsyringe';
import { BookRepository } from '../repositories/book.repo';
import { z } from 'zod';
import asyncHandler from 'express-async-handler';
import crypto from 'crypto';

const bookRepo = container.resolve(BookRepository);

// Validation schemas using Zod
const createBookSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  author: z.string().min(1, 'Author is required'),
  genre: z.string().min(1, 'Genre is required'),
  isbn: z.string().min(1, 'ISBN is required'),
  total_copies: z.number().int().min(1, 'Must have at least 1 copy')
});

const updateBookSchema = createBookSchema.partial();

const addCopySchema = z.object({
  barcode: z.string().min(1, 'Barcode is required')
});

export const getBooks = asyncHandler(async (req: Request, res: Response) => {
  // Note: For full implementation, search/pagination should be added to the BookRepository
  // For Phase 3 MVC refactor, we are just hooking up the basic route
  const books = await bookRepo.findAll();
  res.json({ data: books, totalCount: books.length });
});

export const createBook = asyncHandler(async (req: Request, res: Response) => {
  const validatedData = createBookSchema.parse(req.body);

  // Note: In a real scenario, check for unique ISBN here or handle Prisma unique constraint error
  const newBook = await bookRepo.create({
    ...validatedData,
    available_copies: validatedData.total_copies
  });

  res.status(201).json(newBook);
});

export const getBookById = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id as string);
  const book = await bookRepo.findById(id);

  if (!book) {
    res.status(404).json({ error: 'Book not found' });
    return;
  }

  res.json(book);
});

export const updateBook = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id as string);
  const validatedData = updateBookSchema.parse(req.body);

  const updatedBook = await bookRepo.update(id, validatedData);
  res.json(updatedBook);
});

export const deleteBook = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id as string);
  await bookRepo.delete(id);
  res.json({ message: 'Book deleted successfully' });
});

export const getBookCopies = asyncHandler(async (req: Request, res: Response) => {
  const bookId = parseInt(req.params.id as string);
  const copies = await bookRepo.getCopies(bookId);
  res.json(copies);
});

export const addBookCopy = asyncHandler(async (req: Request, res: Response) => {
  const bookId = parseInt(req.params.id as string);

  // Either accept a barcode from the request, or generate one if not provided
  let barcode = req.body.barcode;
  if (!barcode) {
    barcode = crypto.randomUUID();
  }

  const copy = await bookRepo.addCopy(bookId, barcode);

  // Increment total_copies and available_copies for the book
  const book = await bookRepo.findById(bookId);
  if (book) {
    await bookRepo.update(bookId, {
      total_copies: book.total_copies + 1,
      available_copies: book.available_copies + 1
    });
  }

  res.status(201).json(copy);
});
