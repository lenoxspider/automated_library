import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import prisma from '../config/prisma';
import Papa from 'papaparse';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

export const exportCatalog = asyncHandler(async (req: Request, res: Response) => {
  const books = await prisma.books.findMany();

  // Exclude some internal fields if necessary, or just stringify the objects
  const csv = Papa.unparse(books);

  res.header('Content-Type', 'text/csv');
  res.attachment('catalog-export.csv');
  res.send(csv);
});

export const importCatalog = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) {
    res.status(400).json({ message: 'No file uploaded' });
    return;
  }

  const fileContent = fs.readFileSync(req.file.path, 'utf-8');

  // Parse CSV
  const parsed = Papa.parse(fileContent, { header: true, skipEmptyLines: true });
  const rows = parsed.data as any[];

  let importedCount = 0;
  let copyCount = 0;

  // Process rows
  for (const row of rows) {
    // Assuming CSV columns: Title, Author, Genre, ISBN, Quantity
    const title = row.Title || row.title;
    const author = row.Author || row.author;
    const genre = row.Genre || row.genre || 'Uncategorized';
    const isbn = row.ISBN || row.isbn || uuidv4().substring(0, 13);
    const quantity = parseInt(row.Quantity || row.quantity || '1', 10);

    if (!title || !author) continue;

    // Check if book exists
    let book = await prisma.books.findUnique({ where: { isbn } });

    if (!book) {
      book = await prisma.books.create({
        data: {
          title,
          author,
          genre,
          isbn,
          total_copies: quantity,
          available_copies: quantity
        }
      });
      importedCount++;
    } else {
      // Update quantities if exists
      book = await prisma.books.update({
        where: { isbn },
        data: {
          total_copies: book.total_copies + quantity,
          available_copies: book.available_copies + quantity
        }
      });
    }

    // Generate barcodes and copies
    if (quantity > 0) {
      const copiesData = [];
      for (let i = 0; i < quantity; i++) {
        copiesData.push({
          book_id: book.id,
          barcode: `LIB-${book.id}-${uuidv4().substring(0, 8).toUpperCase()}`,
          status: 'Available'
        });
        copyCount++;
      }
      await prisma.book_copies.createMany({ data: copiesData });
    }
  }

  // Cleanup temp file
  fs.unlinkSync(req.file.path);

  res.json({
    message: `Successfully imported ${importedCount} new books and generated ${copyCount} unique copies.`
  });
});
