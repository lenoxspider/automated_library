import 'reflect-metadata';

jest.mock('../config/prisma', () => {
  const mockP = {
    borrowings: { findMany: jest.fn() },
    library_settings: { findUnique: jest.fn() },
    fines: { upsert: jest.fn() }
  };
  return { __esModule: true, default: mockP, prisma: mockP };
});

// cron.service.ts imports EmailService (type only, never instantiated in
// this file), but that import still pulls in email.service.ts's module
// body, which imports config/redis.ts and opens a real ioredis connection
// at module-load time. With Redis actually reachable (WSL), that live
// socket keeps Jest's process alive after the run finishes. Mock it out,
// same as auth.test.ts does.
jest.mock('../config/redis', () => ({
  __esModule: true,
  default: { get: jest.fn(), set: jest.fn(), del: jest.fn() }
}));

import { CronService } from '../services/cron.service';
import { prisma } from '../config/prisma';

const mockPrisma = prisma as any;

function makeMockEmailService() {
  return {
    queueVerificationEmail: jest.fn(),
    queueDueSoonReminder: jest.fn(),
    queueOverdueReminder: jest.fn()
  } as any;
}

const makeLoan = (overrides: Partial<Record<string, any>> = {}) => ({
  id: 1,
  copy_id: 5,
  member_id: 1,
  due_date: new Date(),
  return_date: null,
  users: { name: 'Jane Doe', email: 'jane@library.com' },
  book_copies: { books: { title: 'Clean Code' } },
  ...overrides
});

describe('CronService', () => {
  let mockEmailService: ReturnType<typeof makeMockEmailService>;
  let cronService: CronService;

  beforeEach(() => {
    jest.clearAllMocks();
    mockEmailService = makeMockEmailService();
    cronService = new CronService(mockEmailService);
  });

  it('is defined and exposes the expected job methods', () => {
    expect(cronService).toBeDefined();
    expect(typeof cronService.startJobs).toBe('function');
    expect(typeof cronService.processOverdueAccounts).toBe('function');
    expect(typeof cronService.sendDueSoonReminders).toBe('function');
  });

  describe('processOverdueAccounts', () => {
    it('does nothing when there are no overdue loans', async () => {
      mockPrisma.borrowings.findMany.mockResolvedValue([]);

      await cronService.processOverdueAccounts();

      expect(mockPrisma.fines.upsert).not.toHaveBeenCalled();
      expect(mockEmailService.queueOverdueReminder).not.toHaveBeenCalled();
    });

    it('upserts a fine and queues an overdue reminder for each overdue loan', async () => {
      const dueDate = new Date('2026-01-01T00:00:00.000Z');
      const loan = makeLoan({ id: 42, due_date: dueDate });
      mockPrisma.borrowings.findMany.mockResolvedValue([loan]);
      mockPrisma.library_settings.findUnique.mockResolvedValue({ key: 'fine_rate', value: '1.5' });

      await cronService.processOverdueAccounts();

      expect(mockPrisma.fines.upsert).toHaveBeenCalledWith(
        expect.objectContaining({ where: { borrowing_id: 42 } })
      );
      expect(mockEmailService.queueOverdueReminder).toHaveBeenCalledWith(
        'jane@library.com',
        'Jane Doe',
        'Clean Code',
        expect.any(String),
        expect.any(Number),
        expect.any(Number)
      );
    });

    it('still processes the fine even if queuing the reminder email fails', async () => {
      const loan = makeLoan();
      mockPrisma.borrowings.findMany.mockResolvedValue([loan]);
      mockPrisma.library_settings.findUnique.mockResolvedValue(null);
      mockEmailService.queueOverdueReminder.mockRejectedValue(new Error('redis down'));

      await expect(cronService.processOverdueAccounts()).resolves.not.toThrow();
      expect(mockPrisma.fines.upsert).toHaveBeenCalled();
    });
  });

  describe('sendDueSoonReminders', () => {
    it('does nothing when no loans are due soon', async () => {
      mockPrisma.borrowings.findMany.mockResolvedValue([]);

      await cronService.sendDueSoonReminders();

      expect(mockEmailService.queueDueSoonReminder).not.toHaveBeenCalled();
    });

    it('queues a due-soon reminder for each loan due within the window', async () => {
      const loan = makeLoan();
      mockPrisma.borrowings.findMany.mockResolvedValue([loan]);

      await cronService.sendDueSoonReminders();

      expect(mockEmailService.queueDueSoonReminder).toHaveBeenCalledWith(
        'jane@library.com',
        'Jane Doe',
        'Clean Code',
        expect.any(String)
      );
    });

    it('only queries loans that are not yet returned and due within the next 2 days', async () => {
      mockPrisma.borrowings.findMany.mockResolvedValue([]);

      await cronService.sendDueSoonReminders();

      expect(mockPrisma.borrowings.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ return_date: null })
        })
      );
    });
  });
});
