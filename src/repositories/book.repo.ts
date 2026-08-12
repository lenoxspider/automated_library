import { injectable } from 'tsyringe';
import { PrismaClient, books } from '@prisma/client';
import prisma from '../config/prisma';

@injectable()
export class BookRepository {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = prisma;
  }

  async findAll(): Promise<books[]> {
    return this.prisma.books.findMany();
  }

  async findBooks(
    query: string,
    page: number,
    limit: number
  ): Promise<{ data: books[]; totalCount: number }> {
    const skip = (page - 1) * limit;
    const where = query
      ? {
          OR: [
            { title: { contains: query } },
            { author: { contains: query } },
            { isbn: { contains: query } }
          ]
        }
      : {};

    const [totalCount, data] = await this.prisma.$transaction([
      this.prisma.books.count({ where }),
      this.prisma.books.findMany({
        where,
        orderBy: { id: 'desc' },
        skip,
        take: limit
      })
    ]);

    return { data, totalCount };
  }

  async create(data: Omit<books, 'id'>): Promise<books> {
    return this.prisma.books.create({ data });
  }

  async findByPublicId(public_id: string): Promise<books | null> {
    return this.prisma.books.findUnique({ where: { public_id } });
  }

  async update(public_id: string, data: Partial<books>): Promise<books> {
    return this.prisma.books.update({ where: { public_id }, data });
  }

  async delete(public_id: string): Promise<books> {
    return this.prisma.books.delete({ where: { public_id } });
  }

  async addCopy(bookId: number, barcode: string) {
    return this.prisma.book_copies.create({
      data: {
        book_id: bookId,
        barcode,
        status: 'Available'
      }
    });
  }

  async getCopies(bookId: number) {
    return this.prisma.book_copies.findMany({
      where: { book_id: bookId }
    });
  }

  async getDistinctGenres(): Promise<string[]> {
    const books = await this.prisma.books.findMany({
      select: { genre: true },
      distinct: ['genre']
    });
    return books.map((b) => b.genre).filter(Boolean);
  }
}
