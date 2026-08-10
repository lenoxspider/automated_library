import { injectable } from 'tsyringe';
import prisma from '../config/prisma';

@injectable()
export class CirculationService {
  async checkout(memberId: number, copyId: number): Promise<any> {
    // 1. Check if copy is available
    const copy = await prisma.book_copies.findUnique({ where: { id: copyId } });
    if (!copy || copy.status !== 'Available') {
      throw new Error('Book copy is not available');
    }

    // 2. Check unpaid fines
    const blockFinesSetting = await prisma.library_settings.findUnique({ where: { key: 'block_fines' } });
    if (blockFinesSetting?.value === 'true') {
      const unpaidFines = await prisma.fines.count({
        where: { status: 'unpaid', borrowings: { member_id: memberId } }
      });
      if (unpaidFines > 0) {
        throw new Error('User has unpaid fines and cannot borrow');
      }
    }

    // 3. Check max loans
    const maxLoansSetting = await prisma.library_settings.findUnique({ where: { key: 'max_loans' } });
    const maxLoans = maxLoansSetting ? parseInt(maxLoansSetting.value) : 3;
    const currentLoans = await prisma.borrowings.count({
      where: { member_id: memberId, return_date: null }
    });
    if (currentLoans >= maxLoans) {
      throw new Error('User has reached the maximum number of active loans');
    }

    // 4. Create borrowing and update copy status
    const borrowDate = new Date();
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 14); // 14 days loan period

    const borrowing = await prisma.borrowings.create({
      data: {
        copy_id: copyId,
        member_id: memberId,
        borrow_date: borrowDate.toISOString(),
        due_date: dueDate.toISOString(),
        status: 'borrowed'
      }
    });

    await prisma.book_copies.update({
      where: { id: copyId },
      data: { status: 'Checked Out' }
    });

    const book = await prisma.books.findUnique({ where: { id: copy.book_id } });
    if (book) {
      await prisma.books.update({
        where: { id: book.id },
        data: { available_copies: book.available_copies - 1 }
      });
    }

    return borrowing;
  }

  async returnBook(borrowingId: number): Promise<any> {
    const borrowing = await prisma.borrowings.findUnique({ where: { id: borrowingId } });
    if (!borrowing || borrowing.return_date) {
      throw new Error('Invalid borrowing record or already returned');
    }

    const returnDate = new Date();
    const dueDate = new Date(borrowing.due_date);
    let fineAmount = 0;
    let fine = null;

    if (returnDate > dueDate) {
      const daysOverdue = Math.ceil((returnDate.getTime() - dueDate.getTime()) / (1000 * 3600 * 24));
      const fineRateSetting = await prisma.library_settings.findUnique({ where: { key: 'fine_rate' } });
      const fineRate = fineRateSetting ? parseFloat(fineRateSetting.value) : 1.0;
      fineAmount = daysOverdue * fineRate;

      fine = await prisma.fines.create({
        data: {
          borrowing_id: borrowingId,
          amount: fineAmount,
          status: 'unpaid'
        }
      });
    }

    const updatedBorrowing = await prisma.borrowings.update({
      where: { id: borrowingId },
      data: { return_date: returnDate.toISOString(), status: 'returned' }
    });

    const copy = await prisma.book_copies.findUnique({ where: { id: borrowing.copy_id } });
    if (copy) {
      await prisma.book_copies.update({
        where: { id: copy.id },
        data: { status: 'Available' }
      });

      const book = await prisma.books.findUnique({ where: { id: copy.book_id } });
      if (book) {
        await prisma.books.update({
          where: { id: book.id },
          data: { available_copies: book.available_copies + 1 }
        });
      }
    }

    return { borrowing: updatedBorrowing, fine };
  }

  async payFine(fineId: number): Promise<any> {
    const fine = await prisma.fines.findUnique({ where: { id: fineId } });
    if (!fine) throw new Error('Fine not found');

    return prisma.fines.update({
      where: { id: fineId },
      data: { status: 'paid', payment_date: new Date().toISOString() }
    });
  }

  async getFines(): Promise<any> {
    return prisma.fines.findMany();
  }
}
