import { injectable } from 'tsyringe';
import { UserRepository } from '../repositories/user.repo';
import prisma from '../config/prisma';
import { student_roster } from '@prisma/client';

@injectable()
export class UserService {
  constructor(private userRepo: UserRepository) {}

  async verifyRoster(studentId: string, indexNumber: string): Promise<student_roster | null> {
    const student = await prisma.student_roster.findUnique({
      where: { student_id: studentId }
    });

    if (student && student.index_number === indexNumber) {
      return student;
    }
    return null;
  }
}
