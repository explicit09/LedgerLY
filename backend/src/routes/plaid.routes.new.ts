import { Router, Request, Response, NextFunction, RequestHandler } from 'express';
import { PlaidController } from '../controllers/plaid.controller';
import { authMiddleware } from '../middleware/auth.middleware';

// Define custom interface that extends Request to include user property
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        // Add other user properties as needed
      };
    }
  }
}

const router = Router();

// Apply auth middleware to all Plaid routes
router.use(authMiddleware as RequestHandler);

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *   schemas:
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         error:
 *           type: string
 *           description: Error message
 */

/**
 * @swagger
 * /api/plaid/link-token:
 *   post:
 *     summary: Create a Plaid Link token
 *     description: Generates a link token for initializing the Plaid Link component
 *     tags: [Plaid]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully created link token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     linkToken:
 *                       type: string
 *                       description: The generated link token
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post('/link-token', (req, res, next) => {
  PlaidController.createLinkToken(req, res, next).catch(next);
});

/**
 * @swagger
 * /api/plaid/exchange-token:
 *   post:
 *     summary: Exchange a public token for an access token
 *     description: Exchanges a public token from Plaid Link for an access token
 *     tags: [Plaid]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - publicToken
 *               - institutionId
 *               - institutionName
 *             properties:
 *               publicToken:
 *                 type: string
 *                 description: The public token from Plaid Link
 *               institutionId:
 *                 type: string
 *                 description: The Plaid institution ID
 *               institutionName:
 *                 type: string
 *                 description: The name of the financial institution
 *     responses:
 *       200:
 *         description: Successfully exchanged token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     itemId:
 *                       type: string
 *                       description: The ID of the created Plaid item
 *                     message:
 *                       type: string
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
// Create link token
router.post('/link-token', (req, res, next) => {
  PlaidController.createLinkToken(req, res, next).catch(next);
});

// Exchange public token
router.post('/item/public_token/exchange', (req, res, next) => {
  PlaidController.exchangePublicToken(req, res, next).catch(next);
});

// Get linked items
router.get('/items', (req, res, next) => {
  PlaidController.getLinkedItems(req, res, next).catch(next);
});

// Get transactions for an item
router.get('/items/:itemId/transactions', (req, res, next) => {
  PlaidController.getTransactions(req, res, next).catch(next);
});

// Remove a linked item
router.delete('/items/:itemId', (req, res, next) => {
  PlaidController.removeItem(req, res, next).catch(next);
});

/**
 * @swagger
 * /api/plaid/items:
 *   get:
 *     summary: Get all linked Plaid items
 *     description: Retrieves all Plaid items linked to the authenticated user
 *     tags: [Plaid]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved Plaid items
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     items:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/PlaidItem'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/items', (req, res, next) => {
  PlaidController.getLinkedItems(req, res, next).catch(next);
});

/**
 * @swagger
 * /api/plaid/items/{itemId}/transactions:
 *   get:
 *     summary: Get transactions for a Plaid item
 *     description: Retrieves transactions for a specific Plaid item
 *     tags: [Plaid]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the Plaid item
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for transactions (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for transactions (YYYY-MM-DD)
 *       - in: query
 *         name: count
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 500
 *           default: 100
 *         description: Number of transactions to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           minimum: 0
 *           default: 0
 *         description: Number of transactions to skip
 *     responses:
 *       200:
 *         description: Successfully retrieved transactions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/TransactionsResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/items/:itemId/transactions', (req, res, next) => {
  PlaidController.getTransactions(req, res, next).catch(next);
});

/**
 * @swagger
 * /api/plaid/items/{id}:
 *   delete:
 *     summary: Remove a linked Plaid item
 *     description: Removes a Plaid item and its associated data
 *     tags: [Plaid]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the Plaid item to remove
 *     responses:
 *       200:
 *         description: Successfully removed Plaid item
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.delete('/items/:itemId', (req, res, next) => {
  PlaidController.removeItem(req, res, next).catch(next);
});

export default router;
