import { Router } from 'express';
import { getInventory, updateBulkInventory } from '../controllers/inventory.controller';

const router = Router();

router.get('/', getInventory);
router.patch('/bulk', updateBulkInventory);

export default router;
