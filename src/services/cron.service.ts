import cron from 'node-cron';
import { injectable } from 'tsyringe';
import { prisma } from '../config/prisma';
import logger from '../config/logger';

@injectable()
export class CronService {
  constructor() {
    // Empty constructor for tsyringe
  }

  startJobs() {
    logger.info('Initializing cron jobs...');

    // Process overdue accounts every day at midnight
    cron.schedule('0 0 * * *', async () => {
      logger.info('Running scheduled overdue account processing...');
      try {
        await this.processOverdueAccounts();
      } catch (error) {
        logger.error({ err: error }, 'Error during overdue processing');
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
    }

    logger.info(`Processed fines for ${overdueLoans.length} overdue accounts.`);
  }
}
