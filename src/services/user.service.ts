import { injectable } from 'tsyringe';
import { UserRepository } from '../repositories/user.repo';
import prisma from '../config/prisma';

@injectable()
export class UserService {
  constructor(private userRepo: UserRepository) {}

  async verifyRoster(studentId: string, indexNumber: string): Promise<boolean> {
    const student = await prisma.student_roster.findUnique({
      where: { student_id: studentId }
    });
    
    if (student && student.index_number === indexNumber) {
      return true;
    }
    return false;
  }
}
