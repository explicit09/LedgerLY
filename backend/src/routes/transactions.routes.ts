import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import TransactionController from '../controllers/transaction.controller';

const router = Router();

router.use((req, res, next) => (authMiddleware as any)(req, res, next));
router.get('/export', TransactionController.exportCsv);

export default router;
