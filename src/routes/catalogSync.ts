import { Router } from 'express';
import multer from 'multer';
import { exportCatalog, importCatalog } from '../controllers/catalogSync.controller';
import { authenticate, authorize } from '../middlewares/auth';
import os from 'os';

const upload = multer({ dest: os.tmpdir() });
const router = Router();

// Only librarians and admins
router.use(authenticate, authorize(['librarian', 'admin']));

router.get('/export', exportCatalog);
router.post('/import', upload.single('file'), importCatalog);

export default router;
