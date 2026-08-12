import { injectable } from 'tsyringe';
import prisma from '../config/prisma';
import logger from '../config/logger';
import sharp from 'sharp';
import { AcquisitionRepository } from '../repositories/acquisition.repo';
import { getOrFetchCoverPath } from './bookCover.service';
import { uploadCover } from './s3.service';

export class AcquisitionError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
  }
}

interface ReceiveOrderInput {
  author: string;
  genre: string;
  isbn: string;
  branch?: string;
  section?: string;
  shelf?: string;
  coverUrl?: string;
}

@injectable()
export class AcquisitionService {
  constructor(private acquisitionRepo: AcquisitionRepository) {}

  async getOrders() {
    return this.acquisitionRepo.findAllOrders();
  }

  async createOrder(data: {
    title: string;
    vendor: string;
    quantity: number;
    total_price: number;
  }) {
    return this.acquisitionRepo.createOrder(data);
  }

  async updateOrderStatus(id: number, status: string) {
    return this.acquisitionRepo.updateOrderStatus(id, status);
  }

  private async resolveCoverPath(isbn: string, coverUrl: string | undefined) {
    if (coverUrl) {
      try {
        const response = await fetch(coverUrl);
        if (response.ok) {
          const originalBuffer = Buffer.from(await response.arrayBuffer());
          const resizedBuffer = await sharp(originalBuffer)
            .resize({ width: 400, withoutEnlargement: true })
            .jpeg({ quality: 85, progressive: true })
            .toBuffer();
          return await uploadCover(isbn, resizedBuffer, 'image/jpeg');
        }
      } catch (err) {
        logger.warn(
          { err, coverUrl },
          'Custom cover download failed during receipt, falling back to auto-fetch'
        );
      }
    }

    try {
      return await getOrFetchCoverPath(isbn);
    } catch (err) {
      logger.warn({ err, isbn }, 'Cover lookup failed during order receipt');
      return null;
    }
  }

  async receiveOrder(id: number, data: ReceiveOrderInput) {
    const order = await this.acquisitionRepo.findOrderById(id);
    if (!order) {
      throw new AcquisitionError(404, 'Order not found');
    }
    if (order.status === 'received') {
      throw new AcquisitionError(400, 'Order is already received');
    }

    // Fetch cover path before starting the transaction so we don't hold the DB
    // lock during a network request.
    const coverPath = await this.resolveCoverPath(data.isbn, data.coverUrl);

    await prisma.$transaction(async (tx) => {
      await tx.purchase_orders.update({ where: { id }, data: { status: 'received' } });

      const existingBook = await tx.books.findUnique({ where: { isbn: data.isbn } });
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
            author: data.author,
            genre: data.genre,
            isbn: data.isbn,
            total_copies: order.quantity,
            available_copies: order.quantity,
            cover_path: coverPath
          }
        });
        bookId = newBook.id;
      }

      const copiesToCreate = Array.from({ length: order.quantity }).map(() => ({
        book_id: bookId,
        barcode: `BC-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
        status: 'Available',
        branch: data.branch || null,
        section: data.section || null,
        shelf: data.shelf || null
      }));

      await tx.book_copies.createMany({ data: copiesToCreate });
    });
  }
}
