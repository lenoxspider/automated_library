import 'reflect-metadata';
import 'dotenv/config';
import app from './app';
import * as http from 'http';

import { container } from 'tsyringe';
import { CronService } from './services/cron.service';
import logger from './config/logger';

const PORT = process.env.PORT || 3000;

// Create HTTP server
const server = http.createServer(app);

// Initialize background jobs
const cronService = container.resolve(CronService);
cronService.startJobs();

// Start listening
server.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT}`);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  logger.info('SIGINT signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});
