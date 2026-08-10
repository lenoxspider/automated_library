import 'reflect-metadata';
import { CirculationService } from '../services/circulation.service';

jest.mock('../config/prisma', () => {
  const mockP = {
    book_copies: { findUnique: jest.fn(), update: jest.fn() },
    library_settings: { findUnique: jest.fn() },
    borrowings: { count: jest.fn(), create: jest.fn(), findUnique: jest.fn(), update: jest.fn() },
    fines: { count: jest.fn(), create: jest.fn() },
    books: { findUnique: jest.fn(), update: jest.fn() }
  };
  return {
    __esModule: true,
    default: mockP,
    prisma: mockP
  };
});

import { prisma } from '../config/prisma';
const mockPrisma = prisma as any;

describe('CirculationService', () => {
  let service: CirculationService;

  beforeEach(() => {
    service = new CirculationService();
    jest.clearAllMocks();
  });

  describe('checkout', () => {
    it('should throw an error if the book copy is not available', async () => {
      mockPrisma.book_copies.findUnique.mockResolvedValue({ id: 1, status: 'Checked Out' });
      await expect(service.checkout(1, 1)).rejects.toThrow('Book copy is not available');
    });

    it('should throw an error if the user has reached the max loan limit', async () => {
      mockPrisma.book_copies.findUnique.mockResolvedValue({ id: 1, status: 'Available' });
      mockPrisma.library_settings.findUnique.mockResolvedValue(null); // default to max 3
      mockPrisma.borrowings.count.mockResolvedValue(3); // already has 3 loans

      await expect(service.checkout(1, 1)).rejects.toThrow(
        'User has reached the maximum number of active loans'
      );
    });

    it('should successfully checkout a book', async () => {
      mockPrisma.book_copies.findUnique.mockResolvedValue({
        id: 1,
        status: 'Available',
        book_id: 10
      });
      mockPrisma.library_settings.findUnique.mockResolvedValue(null);
      mockPrisma.borrowings.count.mockResolvedValue(1);
      mockPrisma.borrowings.create.mockResolvedValue({ id: 100 });
      mockPrisma.books.findUnique.mockResolvedValue({ id: 10, available_copies: 5 });

      const result = await service.checkout(1, 1);

      expect(result).toEqual({ id: 100 });
      expect(mockPrisma.borrowings.create).toHaveBeenCalled();
      expect(mockPrisma.book_copies.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { status: 'Checked Out' }
      });
      expect(mockPrisma.books.update).toHaveBeenCalledWith({
        where: { id: 10 },
        data: { available_copies: 4 }
      });
    });
  });
});
