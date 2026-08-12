import 'reflect-metadata';
import express, { Application } from 'express';
import path from 'path';

// Create Express application
export const app: Application = express();

// Global middleware
app.use(express.json());

import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';
import { isMaintenanceMode } from './config/state';

import authRoutes from './routes/auth';
import bookRoutes from './routes/books';
import userRoutes from './routes/users';
import borrowingRoutes from './routes/borrowings';
import reservationRoutes from './routes/reservations';
import settingRoutes from './routes/settings';
import reportRoutes from './routes/reports';
import fineRoutes from './routes/fines';
import healthRoutes from './routes/health';
import searchRoutes from './routes/search';
import recommendationRoutes from './routes/recommendations';
import acquisitionsRoutes from './routes/acquisitions';
import supportRoutes from './routes/support';
import catalogSyncRoutes from './routes/catalogSync';
import auditRoutes from './routes/audit';
import backupRoutes from './routes/backup';
import integrationsRoutes from './routes/integrations';
import complianceRoutes from './routes/compliance';
import analyticsRoutes from './routes/analytics';
import contributionsRoutes from './routes/contributions';
import inventoryRoutes from './routes/inventory';

// Maintenance Mode
app.use((req, res, next) => {
  if (isMaintenanceMode) {
    res.status(503).json({ error: 'Service is temporarily unavailable for maintenance' });
    return;
  }
  next();
});

// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Security Middlewares
app.use(helmet());
app.use(morgan('dev'));

const allowedOrigins = (process.env.CLIENT_ORIGIN || 'http://localhost:3000')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow non-browser requests (no Origin header, e.g. curl/server-to-server)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`Origin ${origin} not allowed by CORS`));
      }
    },
    credentials: true
  })
);
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
  })
);

app.use('/api/auth', authRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/users', userRoutes);
app.use('/api/borrowings', borrowingRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/settings', settingRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/fines', fineRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/search-history', searchRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/acquisitions', acquisitionsRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/catalog-sync', catalogSyncRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/backup', backupRoutes);
app.use('/api/integrations', integrationsRoutes);
app.use('/api/compliance', complianceRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/contributions', contributionsRoutes);
app.use('/api/inventory', inventoryRoutes);

// Export the app for use in server.ts and tests
export default app;
