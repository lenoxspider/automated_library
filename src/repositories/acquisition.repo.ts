import { injectable } from 'tsyringe';
import { PrismaClient, purchase_orders } from '@prisma/client';
import prisma from '../config/prisma';

@injectable()
export class AcquisitionRepository {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = prisma;
  }

  async findAllOrders(): Promise<purchase_orders[]> {
    return this.prisma.purchase_orders.findMany({ orderBy: { id: 'desc' } });
  }

  async findOrderById(id: number): Promise<purchase_orders | null> {
    return this.prisma.purchase_orders.findUnique({ where: { id } });
  }

  async createOrder(
    data: Pick<purchase_orders, 'title' | 'vendor' | 'quantity' | 'total_price'>
  ): Promise<purchase_orders> {
    return this.prisma.purchase_orders.create({
      data: { ...data, status: 'pending', order_date: new Date().toISOString() }
    });
  }

  async updateOrderStatus(id: number, status: string): Promise<purchase_orders> {
    return this.prisma.purchase_orders.update({ where: { id }, data: { status } });
  }
}
