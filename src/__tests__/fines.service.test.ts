import 'reflect-metadata';
import { CirculationService } from '../services/circulation.service';

jest.mock('../config/prisma', () => {
  const mockP = {
    borrowings: { findUnique: jest.fn(), update: jest.fn() },
    library_settings: { findUnique: jest.fn() },
    fines: { create: jest.fn(), findUnique: jest.fn(), update: jest.fn(), findMany: jest.fn() },
    book_copies: { findUnique: jest.fn(), update: jest.fn() },
    books: { findUnique: jest.fn(), update: jest.fn() }
  };
  return { __esModule: true, default: mockP, prisma: mockP };
});

import { prisma } from '../config/prisma';
const mockPrisma = prisma as any;

describe('CirculationService fine calculation', () => {
  let service: CirculationService;

  beforeEach(() => {
    service = new CirculationService();
    jest.clearAllMocks();

    // Common defaults used by returnBook regardless of fine outcome
    mockPrisma.book_copies.findUnique.mockResolvedValue({
      id: 5,
      book_id: 10,
      status: 'Checked Out'
    });
    mockPrisma.book_copies.update.mockResolvedValue({});
    mockPrisma.books.findUnique.mockResolvedValue({ id: 10, available_copies: 2 });
    mockPrisma.books.update.mockResolvedValue({});
    mockPrisma.borrowings.update.mockResolvedValue({ id: 1, status: 'returned' });
  });

  it('throws if the borrowing does not exist', async () => {
    mockPrisma.borrowings.findUnique.mockResolvedValue(null);
    await expect(service.returnBook(999)).rejects.toThrow(
      'Invalid borrowing record or already returned'
    );
  });

  it('throws if the borrowing has already been returned', async () => {
    mockPrisma.borrowings.findUnique.mockResolvedValue({
      id: 1,
      copy_id: 5,
      due_date: new Date().toISOString(),
      return_date: '2026-01-01T00:00:00.000Z'
    });
    await expect(service.returnBook(1)).rejects.toThrow(
      'Invalid borrowing record or already returned'
    );
  });

  it('charges no fine when returned before the due date', async () => {
    const dueDate = new Date(Date.now() + 24 * 3600 * 1000); // due tomorrow
    mockPrisma.borrowings.findUnique.mockResolvedValue({
      id: 1,
      copy_id: 5,
      due_date: dueDate.toISOString(),
      return_date: null
    });

    const result = await service.returnBook(1);

    expect(result.fine).toBeNull();
    expect(mockPrisma.fines.create).not.toHaveBeenCalled();
  });

  it('charges no fine when returned exactly at the due-date boundary', async () => {
    // returnDate > dueDate is a strict comparison, so returning at the exact
    // instant of the due date must not trigger a fine.
    const dueDate = new Date();
    jest.useFakeTimers().setSystemTime(dueDate);

    mockPrisma.borrowings.findUnique.mockResolvedValue({
      id: 1,
      copy_id: 5,
      due_date: dueDate.toISOString(),
      return_date: null
    });

    const result = await service.returnBook(1);

    expect(result.fine).toBeNull();
    expect(mockPrisma.fines.create).not.toHaveBeenCalled();

    jest.useRealTimers();
  });

  it('charges exactly one day of fine when returned 1ms past the due date, using the default rate', async () => {
    const dueDate = new Date('2026-01-01T12:00:00.000Z');
    const returnDate = new Date('2026-01-01T12:00:00.001Z'); // 1ms overdue
    jest.useFakeTimers().setSystemTime(returnDate);

    mockPrisma.borrowings.findUnique.mockResolvedValue({
      id: 1,
      copy_id: 5,
      due_date: dueDate.toISOString(),
      return_date: null
    });
    mockPrisma.library_settings.findUnique.mockResolvedValue(null); // no override -> default rate 1.0
    mockPrisma.fines.create.mockResolvedValue({ id: 1, amount: 1, status: 'unpaid' });

    await service.returnBook(1);

    // Math.ceil(1ms / day) = 1 day overdue, default fine_rate = 1.0 -> amount 1
    expect(mockPrisma.fines.create).toHaveBeenCalledWith({
      data: { borrowing_id: 1, amount: 1, status: 'unpaid' }
    });

    jest.useRealTimers();
  });

  it('applies a configured fine_rate and rounds overdue days up (partial day counts as a full day)', async () => {
    const dueDate = new Date('2026-01-01T00:00:00.000Z');
    // 2 days + 1 hour overdue -> should round up to 3 days
    const returnDate = new Date('2026-01-03T01:00:00.000Z');
    jest.useFakeTimers().setSystemTime(returnDate);

    mockPrisma.borrowings.findUnique.mockResolvedValue({
      id: 1,
      copy_id: 5,
      due_date: dueDate.toISOString(),
      return_date: null
    });
    mockPrisma.library_settings.findUnique.mockResolvedValue({ key: 'fine_rate', value: '2.5' });
    mockPrisma.fines.create.mockResolvedValue({ id: 2, amount: 7.5, status: 'unpaid' });

    await service.returnBook(1);

    expect(mockPrisma.fines.create).toHaveBeenCalledWith({
      data: { borrowing_id: 1, amount: 7.5, status: 'unpaid' } // 3 days * 2.5
    });

    jest.useRealTimers();
  });

  it('marks the returned copy Available again and increments available_copies', async () => {
    const dueDate = new Date(Date.now() + 24 * 3600 * 1000);
    mockPrisma.borrowings.findUnique.mockResolvedValue({
      id: 1,
      copy_id: 5,
      due_date: dueDate.toISOString(),
      return_date: null
    });

    await service.returnBook(1);

    expect(mockPrisma.book_copies.update).toHaveBeenCalledWith({
      where: { id: 5 },
      data: { status: 'Available' }
    });
    expect(mockPrisma.books.update).toHaveBeenCalledWith({
      where: { id: 10 },
      data: { available_copies: 3 }
    });
  });
});

describe('CirculationService.payFine', () => {
  let service: CirculationService;

  beforeEach(() => {
    service = new CirculationService();
    jest.clearAllMocks();
  });

  it('throws if the fine does not exist', async () => {
    mockPrisma.fines.findUnique.mockResolvedValue(null);
    await expect(service.payFine(999)).rejects.toThrow('Fine not found');
  });

  it('marks an existing fine as paid with a payment date', async () => {
    mockPrisma.fines.findUnique.mockResolvedValue({ id: 1, amount: 5, status: 'unpaid' });
    mockPrisma.fines.update.mockResolvedValue({ id: 1, amount: 5, status: 'paid' });

    const result = await service.payFine(1);

    expect(mockPrisma.fines.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: expect.objectContaining({ status: 'paid', payment_date: expect.any(String) })
    });
    expect(result.status).toBe('paid');
  });
});
