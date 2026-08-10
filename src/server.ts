import 'dotenv/config';
import app from './app';
import * as http from 'http';

import { container } from 'tsyringe';
import { CronService } from './services/cron.service';

const PORT = process.env.PORT || 3000;

// Create HTTP server
const server = http.createServer(app);

// Initialize background jobs
const cronService = container.resolve(CronService);
cronService.startJobs();

// Start listening
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});
