import { Router, Request, Response, NextFunction } from 'express';
import { PlaidController } from '../controllers/plaid.controller.new';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// Apply auth middleware to all Plaid routes
const authHandler = (req: Request, res: Response, next: NextFunction) => {
  return (authMiddleware as any)(req, res, next);
};

router.use(authHandler);

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
router.post('/link-token', PlaidController.createLinkToken);

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
router.post('/exchange-token', PlaidController.exchangePublicToken);

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
router.get('/items', PlaidController.getLinkedItems);

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
router.get('/items/:itemId/transactions', PlaidController.getTransactions);

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
router.delete('/items/:id', PlaidController.removeItem);

export default router;
