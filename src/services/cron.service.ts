import cron from 'node-cron';
import { injectable } from 'tsyringe';
import { prisma } from '../config/prisma';
import logger from '../config/logger';
import { EmailService } from './email.service';

@injectable()
export class CronService {
  constructor(private emailService: EmailService) {}

  startJobs() {
    logger.info('Initializing cron jobs...');

    // Process overdue accounts (fines + overdue reminders) every day at midnight
    cron.schedule('0 0 * * *', async () => {
      logger.info('Running scheduled overdue account processing...');
      try {
        await this.processOverdueAccounts();
      } catch (error) {
        logger.error({ err: error }, 'Error during overdue processing');
      }
    });

    // Send due-soon reminders every day at 9am, for loans due within the
    // next 2 days that aren't overdue yet
    cron.schedule('0 9 * * *', async () => {
      logger.info('Running scheduled due-soon reminder job...');
      try {
        await this.sendDueSoonReminders();
      } catch (error) {
        logger.error({ err: error }, 'Error during due-soon reminder processing');
      }
    });
  }

  async processOverdueAccounts() {
    logger.info('Running processOverdueAccounts...');

    // Find all overdue loans that haven't been returned
    const overdueLoans = await prisma.borrowings.findMany({
      where: {
        due_date: { lt: new Date().toISOString() },
        return_date: null
      },
      include: {
        users: { select: { name: true, email: true } },
        book_copies: { include: { books: { select: { title: true } } } }
      }
    });

    if (overdueLoans.length === 0) {
      logger.info('No overdue accounts to process.');
      return;
    }

    // Get the fine rate
    const fineRateSetting = await prisma.library_settings.findUnique({
      where: { key: 'fine_rate' }
    });
    const fineRate = fineRateSetting ? parseFloat(fineRateSetting.value) : 1.0;

    for (const loan of overdueLoans) {
      const dueDate = new Date(loan.due_date);
      const daysOverdue = Math.ceil((Date.now() - dueDate.getTime()) / (1000 * 3600 * 24));
      const amount = daysOverdue * fineRate;

      // Upsert fine to update amount daily if it already exists
      await prisma.fines.upsert({
        where: { borrowing_id: loan.id },
        update: { amount },
        create: {
          borrowing_id: loan.id,
          amount,
          status: 'unpaid'
        }
      });

      try {
        await this.emailService.queueOverdueReminder(
          loan.users.email,
          loan.users.name,
          loan.book_copies.books.title,
          dueDate.toLocaleDateString(),
          daysOverdue,
          amount
        );
      } catch (err) {
        // A failed/queued email must never block fine processing for the
        // rest of the batch.
        logger.warn({ err, borrowingId: loan.id }, 'Failed to queue overdue reminder email');
      }
    }

    logger.info(`Processed fines for ${overdueLoans.length} overdue accounts.`);
  }

  async sendDueSoonReminders() {
    const now = new Date();
    const twoDaysFromNow = new Date(now.getTime() + 2 * 24 * 3600 * 1000);

    const dueSoonLoans = await prisma.borrowings.findMany({
      where: {
        return_date: null,
        due_date: { gte: now.toISOString(), lte: twoDaysFromNow.toISOString() }
      },
      include: {
        users: { select: { name: true, email: true } },
        book_copies: { include: { books: { select: { title: true } } } }
      }
    });

    if (dueSoonLoans.length === 0) {
      logger.info('No loans due soon.');
      return;
    }

    for (const loan of dueSoonLoans) {
      try {
        await this.emailService.queueDueSoonReminder(
          loan.users.email,
          loan.users.name,
          loan.book_copies.books.title,
          new Date(loan.due_date).toLocaleDateString()
        );
      } catch (err) {
        logger.warn({ err, borrowingId: loan.id }, 'Failed to queue due-soon reminder email');
      }
    }

    logger.info(`Queued ${dueSoonLoans.length} due-soon reminder(s).`);
  }
}
