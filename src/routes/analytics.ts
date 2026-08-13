import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth';
import {
  deleteSavedReport,
  exportCsv,
  exportJson,
  exportPdf,
  getCatalog,
  getPeakSearchTimes,
  getPopularBooks,
  getPublicStats,
  listSavedReports,
  runQuery,
  runSavedReport,
  saveReport
} from '../controllers/analytics.controller';

const router = Router();

router.get('/popular-books', getPopularBooks);
router.get('/peak-search-times', getPeakSearchTimes);
router.get('/public-stats', getPublicStats);

router.use(authenticate, authorize(['admin', 'librarian']));
router.get('/catalog', getCatalog);
router.post('/query', runQuery);
router.post('/export/csv', exportCsv);
router.post('/export/json', exportJson);
router.post('/export/pdf', exportPdf);
router.get('/saved', listSavedReports);
router.post('/saved', saveReport);
router.delete('/saved/:id', deleteSavedReport);
router.post('/saved/:id/run', runSavedReport);

export default router;
