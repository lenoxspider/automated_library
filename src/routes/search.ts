import { Router } from 'express';
import { logSearchQuery, getSearchHistory } from '../controllers/search.controller';
import { authenticate } from '../middlewares/auth';

const router = Router();

router.use(authenticate);

router.post('/', logSearchQuery);
router.get('/', getSearchHistory);

export default router;
