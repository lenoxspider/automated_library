import { Request, Response } from 'express';
import { container } from 'tsyringe';
import { BookRepository } from '../repositories/book.repo';
import { z } from 'zod';
import asyncHandler from 'express-async-handler';
import crypto from 'crypto';
import { getOrFetchCoverPath } from '../services/bookCover.service';
import { lookupBookByIsbn } from '../services/bookLookup.service';
import logger from '../config/logger';
import sharp from 'sharp';
import { uploadCover } from '../services/s3.service';

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

interface CoverCandidate {
  url: string;
  source: string;
  title?: string;
}

async function searchOpenLibraryCovers(query: string): Promise<CoverCandidate[]> {
  try {
    const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=8&fields=title,cover_i`;
    const response = await fetch(url);
    if (!response.ok) return [];

    const data = (await response.json()) as any;
    return (data.docs ?? [])
      .filter((doc: any) => doc.cover_i)
      .map((doc: any) => ({
        url: `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`,
        source: 'Open Library',
        title: doc.title
      }));
  } catch (err) {
    logger.warn({ err }, 'Open Library cover search failed');
    return [];
  }
}

async function searchGoogleBookCovers(query: string): Promise<CoverCandidate[]> {
  try {
    const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=8`;
    const response = await fetch(url);
    if (!response.ok) return [];

    const data = (await response.json()) as any;
    return (data.items ?? [])
      .map((item: any) => {
        const links = item.volumeInfo?.imageLinks;
        const thumbnail = links?.thumbnail || links?.smallThumbnail;
        return thumbnail
          ? {
              url: thumbnail.replace('http://', 'https://'),
              source: 'Google Books',
              title: item.volumeInfo.title
            }
          : null;
      })
      .filter(
        (candidate: CoverCandidate | null): candidate is CoverCandidate => candidate !== null
      );
  } catch (err) {
    logger.warn({ err }, 'Google Books cover search failed');
    return [];
  }
}

export const searchCovers = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query.q as string;
  if (!query) {
    res.status(400).json({ error: 'Query parameter q is required' });
    return;
  }

  const candidates = [
    ...(await searchOpenLibraryCovers(query)),
    ...(await searchGoogleBookCovers(query))
  ];
  const uniqueCandidates = Array.from(new Map(candidates.map((item) => [item.url, item])).values());
  res.json(uniqueCandidates);
});

async function resizeAndSaveCover(bookId: number, publicId: string, originalBuffer: Buffer) {
  const resizedBuffer = await sharp(originalBuffer)
    .resize({ width: 400, withoutEnlargement: true })
    .jpeg({ quality: 85, progressive: true })
    .toBuffer();

  const minioUrl = await uploadCover(bookId, resizedBuffer, 'image/jpeg');
  return bookRepo.update(publicId, { cover_path: minioUrl });
}

export const selectCover = asyncHandler(async (req: Request, res: Response) => {
  const public_id = req.params.id as string;
  const { coverUrl } = req.body;

  if (!coverUrl) {
    res.status(400).json({ error: 'coverUrl is required' });
    return;
  }

  const book = await bookRepo.findByPublicId(public_id);
  if (!book) {
    res.status(404).json({ error: 'Book not found' });
    return;
  }

  const response = await fetch(coverUrl);
  if (!response.ok) {
    res.status(400).json({ error: 'Failed to download selected cover image' });
    return;
  }

  const originalBuffer = Buffer.from(await response.arrayBuffer());
  const updatedBook = await resizeAndSaveCover(book.id, public_id, originalBuffer);
  res.json(updatedBook);
});

export const uploadCoverFile = asyncHandler(async (req: Request, res: Response) => {
  const public_id = req.params.id as string;
  const file = req.file;

  if (!file) {
    res.status(400).json({ error: 'No image file uploaded' });
    return;
  }

  const book = await bookRepo.findByPublicId(public_id);
  if (!book) {
    res.status(404).json({ error: 'Book not found' });
    return;
  }

  if (!file.mimetype.startsWith('image/')) {
    res.status(400).json({ error: 'Uploaded file must be an image' });
    return;
  }

  const metadata = await sharp(file.buffer).metadata();
  if (!metadata.width || metadata.width < 300) {
    res.status(400).json({ error: 'Cover image must be at least 300px wide' });
    return;
  }

  const updatedBook = await resizeAndSaveCover(book.id, public_id, file.buffer);
  res.json(updatedBook);
});
