import { Router, Request, Response, NextFunction } from 'express';
import { UserController } from '../controllers/user.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

const authHandler = (req: Request, res: Response, next: NextFunction) => {
  return (authMiddleware as any)(req, res, next);
};

router.use(authHandler);
router.delete('/me', UserController.deleteAccount);

export default router;
