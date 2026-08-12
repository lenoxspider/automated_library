import { Router } from 'express';
import {
  getInventory,
  updateBulkInventory,
  updateSingleInventory
} from '../controllers/inventory.controller';

const router = Router();

router.get('/', getInventory);
router.patch('/bulk', updateBulkInventory);
router.patch('/:id', updateSingleInventory);

export default router;
