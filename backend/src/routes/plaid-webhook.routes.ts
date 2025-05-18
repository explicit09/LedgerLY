import { Router, Request, Response, NextFunction } from 'express';
import { plaidWebhookController } from '../controllers/plaid-webhook.controller';

type ExpressRequest = Request;
type ExpressResponse = Response;
type ExpressNextFunction = NextFunction;

export const plaidWebhookRouter = Router();

/**
 * @swagger
 * /api/plaid/webhook:
 *   post:
 *     summary: Handle Plaid webhook events
 *     description: Endpoint for receiving webhook notifications from Plaid
 *     tags: [Plaid]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [webhook_type, item_id]
 *             properties:
 *               webhook_type:
 *                 type: string
 *                 description: The type of webhook event
 *                 example: TRANSACTIONS
 *               item_id:
 *                 type: string
 *                 description: The Plaid item ID associated with the webhook
 *                 example: eQKj5pLdXJs6zVbXnJq5uPbWv7y8aZcD
 *               webhook_code:
 *                 type: string
 *                 description: The specific webhook code
 *                 example: SYNC_UPDATES_AVAILABLE
 *               new_transactions:
 *                 type: number
 *                 description: Number of new transactions available (for TRANSACTIONS webhooks)
 *                 example: 5
 *               removed_transactions:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of transaction IDs that have been removed (for TRANSACTIONS_REMOVED webhook)
 *               error:
 *                 type: object
 *                 description: Error details (for ERROR webhooks)
 *     responses:
 *       200:
 *         description: Webhook received and processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Webhook processed
 *       400:
 *         description: Invalid webhook data
 *       500:
 *         description: Server error while processing webhook
 */
plaidWebhookRouter.post('/webhook', 
  // Middleware to verify the webhook request
  async (req: ExpressRequest, res: ExpressResponse, next: ExpressNextFunction) => {
    try {
      await plaidWebhookController.verifyWebhookRequest(req as any, res as any, next);
      next();
    } catch (error) {
      next(error);
    }
  },
  // Handler for the webhook
  async (req: ExpressRequest, res: ExpressResponse, next: ExpressNextFunction) => {
    try {
      await plaidWebhookController.handleWebhook(req as any, res as any, next);
    } catch (error) {
      next(error);
    }
  }
);

// Add a test endpoint for webhook verification (for Plaid's webhook verification)
plaidWebhookRouter.get('/webhook-test', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'Webhook test endpoint is working',
    timestamp: new Date().toISOString(),
  });
});

export default plaidWebhookRouter;
