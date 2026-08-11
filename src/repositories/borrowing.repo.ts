import { injectable } from 'tsyringe';
import { PrismaClient, borrowings } from '@prisma/client';
import prisma from '../config/prisma';

@injectable()
export class BorrowingRepository {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = prisma;
  }

  async findAll(): Promise<borrowings[]> {
    return this.prisma.borrowings.findMany();
  }

  async findByMemberId(memberId: number): Promise<borrowings[]> {
    return this.prisma.borrowings.findMany({ where: { member_id: memberId } });
  }

  async create(data: Omit<borrowings, 'id'>): Promise<borrowings> {
    return this.prisma.borrowings.create({ data });
  }

  async findById(id: number): Promise<borrowings | null> {
    return this.prisma.borrowings.findUnique({ where: { id } });
  }
}
