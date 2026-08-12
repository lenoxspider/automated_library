import { injectable } from 'tsyringe';
import { PrismaClient } from '@prisma/client';
import prisma from '../config/prisma';

@injectable()
export class AnalyticsRepository {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = prisma;
  }

  async getBorrowingsWithBookTitles() {
    return this.prisma.borrowings.findMany({
      include: { book_copies: { include: { books: true } } }
    });
  }

  async getSearchTimestamps(): Promise<{ timestamp: string }[]> {
    return this.prisma.search_history.findMany({ select: { timestamp: true } });
  }

  async getPublicCounts() {
    const [totalBooks, totalUsers, totalReserves] = await Promise.all([
      this.prisma.books.count(),
      this.prisma.users.count(),
      this.prisma.reservations.count()
    ]);
    return { totalBooks, totalUsers, totalReserves };
  }
}
