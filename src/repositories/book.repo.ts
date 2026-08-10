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

  async create(data: Omit<books, 'id'>): Promise<books> {
    return this.prisma.books.create({ data });
  }

  async findById(id: number): Promise<books | null> {
    return this.prisma.books.findUnique({ where: { id } });
  }

  async update(id: number, data: Partial<books>): Promise<books> {
    return this.prisma.books.update({ where: { id }, data });
  }

  async delete(id: number): Promise<books> {
    return this.prisma.books.delete({ where: { id } });
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
}
