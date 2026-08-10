import 'reflect-metadata';
import { CronService } from '../services/cron.service';
import 'reflect-metadata';

describe('CronService', () => {
  let cronService: CronService;

  beforeEach(() => {
    cronService = new CronService();
  });

  it('should be defined', () => {
    expect(cronService).toBeDefined();
  });

  it('should have a startJobs method', () => {
    expect(typeof cronService.startJobs).toBe('function');
  });

  it('should have a processOverdueAccounts method', () => {
    expect(typeof cronService.processOverdueAccounts).toBe('function');
  });
});
