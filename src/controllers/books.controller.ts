import { Request, Response } from 'express';
import { container } from 'tsyringe';
import { BookRepository } from '../repositories/book.repo';
import { z } from 'zod';
import asyncHandler from 'express-async-handler';
import crypto from 'crypto';
import { getOrFetchCoverPath } from '../services/bookCover.service';
import { lookupBookByIsbn } from '../services/bookLookup.service';
import logger from '../config/logger';

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
  const query = (req.query.q as string) || '';
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const genre = (req.query.genre as string) || '';
  const availability = (req.query.availability as string) || '';

  const result = await bookRepo.findBooks(query, page, limit, genre, availability);

  res.json({
    data: result.data,
    totalCount: result.totalCount,
    page,
    limit,
    totalPages: Math.ceil(result.totalCount / limit)
  });
});

export const getGenres = asyncHandler(async (req: Request, res: Response) => {
  const genres = await bookRepo.getDistinctGenres();
  res.json(genres);
});

export const createBook = asyncHandler(async (req: Request, res: Response) => {
  const validatedData = createBookSchema.parse(req.body);

  // Cover fetch/cache must never fail book creation - swallow any error and
  // fall back to null, which the frontend renders as a generated
  // placeholder (see client/src/components/ui/BookCover.tsx).
  let coverPath: string | null = null;
  try {
    coverPath = await getOrFetchCoverPath(validatedData.isbn);
  } catch (err) {
    logger.warn({ err, isbn: validatedData.isbn }, 'Cover lookup failed during book creation');
  }

  // Note: In a real scenario, check for unique ISBN here or handle Prisma unique constraint error
  const newBook = await bookRepo.create({
    ...validatedData,
    public_id: crypto.randomUUID(),
    available_copies: validatedData.total_copies,
    cover_path: coverPath
  });

  // total_copies is meaningless for circulation unless matching book_copies
  // rows actually exist - checkout/return operate on individual copies
  // (with their own barcode/status), not the book's counter fields.
  for (let i = 0; i < validatedData.total_copies; i++) {
    await bookRepo.addCopy(newBook.id, crypto.randomUUID());
  }

  res.status(201).json(newBook);
});

export const lookupBook = asyncHandler(async (req: Request, res: Response) => {
  const isbn = req.params.isbn as string;
  const result = await lookupBookByIsbn(isbn);

  if (!result) {
    res.status(404).json({ error: 'No book found for that ISBN' });
    return;
  }

  res.json(result);
});

export const getBookById = asyncHandler(async (req: Request, res: Response) => {
  const public_id = req.params.id as string;
  const book = await bookRepo.findByPublicId(public_id);

  if (!book) {
    res.status(404).json({ error: 'Book not found' });
    return;
  }

  res.json(book);
});

export const updateBook = asyncHandler(async (req: Request, res: Response) => {
  const public_id = req.params.id as string;
  const validatedData = updateBookSchema.parse(req.body);

  const existing = await bookRepo.findByPublicId(public_id);
  const updateData: typeof validatedData & { cover_path?: string | null } = { ...validatedData };

  // Only refetch the cover when the ISBN actually changed (or no cover is
  // cached yet) - editing title/author/copies on every save shouldn't
  // re-hit the network. Never fails the update itself if the fetch fails.
  if (validatedData.isbn && (!existing?.cover_path || validatedData.isbn !== existing.isbn)) {
    try {
      updateData.cover_path = await getOrFetchCoverPath(validatedData.isbn);
    } catch (err) {
      logger.warn({ err, isbn: validatedData.isbn }, 'Cover lookup failed during book update');
    }
  }

  const updatedBook = await bookRepo.update(public_id, updateData);
  res.json(updatedBook);
});

export const deleteBook = asyncHandler(async (req: Request, res: Response) => {
  const public_id = req.params.id as string;
  await bookRepo.delete(public_id);
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
  const public_id = req.params.id as string;
  const book = await bookRepo.findByPublicId(public_id);

  if (book && book.public_id) {
    await bookRepo.update(book.public_id, {
      total_copies: book.total_copies + 1,
      available_copies: book.available_copies + 1
    });
  }

  res.status(201).json(copy);
});
