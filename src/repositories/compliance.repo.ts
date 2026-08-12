import { injectable } from 'tsyringe';
import { PrismaClient, compliance_requests } from '@prisma/client';
import prisma from '../config/prisma';

@injectable()
export class ComplianceRepository {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = prisma;
  }

  async findAllRequests(): Promise<compliance_requests[]> {
    return this.prisma.compliance_requests.findMany({ orderBy: { id: 'desc' } });
  }

  async findRequestById(id: number): Promise<compliance_requests | null> {
    return this.prisma.compliance_requests.findUnique({ where: { id } });
  }

  async markCompleted(id: number): Promise<compliance_requests> {
    return this.prisma.compliance_requests.update({ where: { id }, data: { status: 'completed' } });
  }
}
