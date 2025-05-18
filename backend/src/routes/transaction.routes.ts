import { Router, Request, Response, NextFunction } from 'express';
import { TransactionController } from '../controllers/transaction.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

const authHandler = (req: Request, res: Response, next: NextFunction) => {
  return (authMiddleware as any)(req, res, next);
};

router.use(authHandler);

router.get('/', TransactionController.listTransactions);

export default router;
