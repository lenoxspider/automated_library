import { injectable } from 'tsyringe';
import prisma from '../config/prisma';
import { ComplianceRepository } from '../repositories/compliance.repo';
import { UserRepository } from '../repositories/user.repo';

export class ComplianceError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
  }
}

@injectable()
export class ComplianceService {
  constructor(
    private complianceRepo: ComplianceRepository,
    private userRepo: UserRepository
  ) {}

  async getRequests() {
    return this.complianceRepo.findAllRequests();
  }

  async processRequest(id: number, adminId: number) {
    const request = await this.complianceRepo.findRequestById(id);
    if (!request) {
      throw new ComplianceError(404, 'Request not found');
    }

    if (request.request_type === 'ACCOUNT_DELETION') {
      // Hard delete user and all cascade data
      await this.userRepo.delete(request.member_id);
    }

    await this.complianceRepo.markCompleted(id);

    await prisma.audit_logs.create({
      data: {
        admin_id: adminId,
        action: 'PROCESS_COMPLIANCE',
        details: `Processed ${request.request_type} for member ${request.member_id}`,
        timestamp: new Date().toISOString()
      }
    });
  }
}
