import { Router, RequestHandler } from 'express';
import AnalyticsController from '../controllers/analytics.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();
const authHandler: RequestHandler = authMiddleware as any;

router.use(authHandler);

router.get('/cash-flow', (req, res, next) => AnalyticsController.cashFlow(req, res, next));
router.get('/net-cash-trend', (req, res, next) => AnalyticsController.netCashTrend(req, res, next));
router.get('/recurring', (req, res, next) => AnalyticsController.recurring(req, res, next));
router.get('/expenses-by-category', (req, res, next) => AnalyticsController.expensesByCategory(req, res, next));
router.get('/expenses-by-merchant', (req, res, next) => AnalyticsController.expensesByMerchant(req, res, next));

export default router;
