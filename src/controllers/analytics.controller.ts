import { Request, Response } from 'express';
import { container } from 'tsyringe';
import asyncHandler from 'express-async-handler';
import { AnalyticsService } from '../services/analytics.service';

const analyticsService = container.resolve(AnalyticsService);

export const getPopularBooks = asyncHandler(async (req: Request, res: Response) => {
  const results = await analyticsService.getPopularBooks();
  res.json(results);
});

export const getPeakSearchTimes = asyncHandler(async (req: Request, res: Response) => {
  const results = await analyticsService.getPeakSearchTimes();
  res.json(results);
});

export const getPublicStats = asyncHandler(async (req: Request, res: Response) => {
  const stats = await analyticsService.getPublicStats();
  res.json(stats);
});
