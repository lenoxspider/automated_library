import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import prisma from '../config/prisma';
import { getOrFetchCoverPath } from '../services/bookCover.service';
import logger from '../config/logger';

export const getOrders = asyncHandler(async (req: Request, res: Response) => {
  const orders = await prisma.purchase_orders.findMany({
    orderBy: { id: 'desc' }
  });
  res.json(orders);
});

export const createOrder = asyncHandler(async (req: Request, res: Response) => {
  const { title, vendor, quantity, total_price } = req.body;

  const order = await prisma.purchase_orders.create({
    data: {
      title,
      vendor,
      quantity: Number(quantity),
      total_price: Number(total_price),
      order_date: new Date().toISOString()
    }
  });

  res.status(201).json({ message: 'Purchase order created', order });
});

export const updateOrderStatus = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id as string);
  const { status } = req.body;

  const order = await prisma.purchase_orders.update({
    where: { id },
    data: { status }
  });

  res.json({ message: 'Order status updated', order });
});

export const receiveOrder = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id as string);
  const { author, genre, isbn, branch, section, shelf } = req.body;

  if (!author || !genre || !isbn) {
    res.status(400).json({ error: 'Author, genre, and ISBN are required to receive an order into inventory' });
    return;
  }

  const order = await prisma.purchase_orders.findUnique({ where: { id } });
  if (!order) {
    res.status(404).json({ error: 'Order not found' });
    return;
  }
  if (order.status === 'received') {
    res.status(400).json({ error: 'Order is already received' });
    return;
  }

  // Fetch cover path before starting the transaction so we don't hold the DB lock
  // during a network request to OpenLibrary.
  let coverPath: string | null = null;
  try {
    coverPath = await getOrFetchCoverPath(isbn);
  } catch (err) {
    logger.warn({ err, isbn }, 'Cover lookup failed during order receipt');
  }

  // Use a transaction for safety
  await prisma.$transaction(async (tx) => {
    // 1. Mark order as received
    await tx.purchase_orders.update({
      where: { id },
      data: { status: 'received' }
    });

    // 2. Upsert the Book
    const existingBook = await tx.books.findUnique({ where: { isbn } });
    let bookId: number;

    if (existingBook) {
      const updatedBook = await tx.books.update({
        where: { id: existingBook.id },
        data: {
          total_copies: existingBook.total_copies + order.quantity,
          available_copies: existingBook.available_copies + order.quantity
        }
      });
      bookId = updatedBook.id;
    } else {
      const newBook = await tx.books.create({
        data: {
          title: order.title,
          author,
          genre,
          isbn,
          total_copies: order.quantity,
          available_copies: order.quantity,
          cover_path: coverPath
        }
      });
      bookId = newBook.id;
    }

    // 3. Create the Book Copies
    const copiesToCreate = Array.from({ length: order.quantity }).map(() => ({
      book_id: bookId,
      barcode: `BC-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      status: 'Available',
      branch: branch || null,
      section: section || null,
      shelf: shelf || null
    }));

    await tx.book_copies.createMany({ data: copiesToCreate });
  });

  res.json({ message: 'Order received and added to inventory' });
});
