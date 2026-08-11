import { injectable } from 'tsyringe';
import { PrismaClient, users } from '@prisma/client';
import prisma from '../config/prisma';

@injectable()
export class UserRepository {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = prisma;
  }

  async findAll(): Promise<users[]> {
    return this.prisma.users.findMany();
  }

  async findById(id: number): Promise<users | null> {
    return this.prisma.users.findUnique({ where: { id } });
  }

  async delete(id: number): Promise<void> {
    await this.prisma.users.delete({ where: { id } });
  }

  async create(data: any): Promise<users> {
    return this.prisma.users.create({ data });
  }
}
