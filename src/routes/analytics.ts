import { Router } from 'express';
import {
  getPopularBooks,
  getPeakSearchTimes,
  getPublicStats
} from '../controllers/analytics.controller';

const router = Router();

// These endpoints are public but differentially private!
router.get('/popular-books', getPopularBooks);
router.get('/peak-search-times', getPeakSearchTimes);
router.get('/public-stats', getPublicStats);

export default router;
