import express, { Express, Request, Response, NextFunction, Router } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import https from 'https';
import http from 'http';
import path from 'path';
import { transactionSyncScheduler } from './services/scheduler';
import { plaidWebhookRouter } from './routes/plaid-webhook.routes';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Import services
import { configService } from './config';
import { databaseService } from './database';
import { logger } from './utils/logger';

// Import routes
import plaidRoutes from './routes/plaid.routes';
import transactionRoutes from './routes/transaction.routes';
// Import auth middleware if needed
// import { authMiddleware } from './middleware/auth.middleware';

const app: Express = express();
const appConfig = configService.getAppConfig();
const port = appConfig.port;
const isProduction = appConfig.isProduction;

// Middleware configuration
app.use(helmet()); // Security headers
app.use(cors({
  origin: isProduction ? process.env.ALLOWED_ORIGINS?.split(',') : '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

// Request logging
app.use(morgan(isProduction ? 'combined' : 'dev', {
  stream: {
    write: (message: string) => logger.http(message.trim())
  }
}));

// Parse JSON and URL-encoded bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api/plaid', plaidRoutes);
app.use('/api/transactions', transactionRoutes);

// Webhook Routes (no JSON body parsing for webhooks)
const webhookRouter = Router();
webhookRouter.use(express.raw({ type: 'application/json' }));
webhookRouter.use('/api/plaid', plaidWebhookRouter);
app.use(webhookRouter);

// Health check endpoint
app.get('/health', async (req: Request, res: Response) => {
  try {
    // Check database connection
    const isConnected = await databaseService.isConnected();
    
    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: appConfig.environment,
      database: isConnected ? 'connected' : 'disconnected',
    });
  } catch (error) {
    logger.error('Health check failed:', error);
    res.status(503).json({
      status: 'error',
      message: 'Service Unavailable',
      database: 'disconnected',
    });
  }
});

// Redirect HTTP to HTTPS in production (handled by reverse proxy in production)
if (isProduction) {
  app.use((req: Request, res: Response, next: NextFunction) => {
    const xForwardedProto = req.headers['x-forwarded-proto'];
    if (xForwardedProto && xForwardedProto !== 'https') {
      return res.redirect(`https://${req.headers.host}${req.url}`);
    }
    next();
  });
}

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    status: 'error',
    message: 'Not Found',
  });
});

// Global error handler
app.use((err: unknown, req: Request, res: Response, next: NextFunction) => {
  // Skip if headers already sent
  if (res.headersSent) {
    return next(err as Error);
  }
  
  // Log the error
  logger.error('Unhandled error:', {
    error: err instanceof Error ? err.stack || err.message : err,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
  });
  
  // Handle different types of errors
  let statusCode = 500;
  let message = 'Internal Server Error';
  let code: string | undefined;
  let details: any;
  
  // Handle Sequelize errors
  if (err && typeof err === 'object' && 'name' in err) {
    const error = err as { name: string; message: string; [key: string]: any };
    
    switch (error.name) {
      case 'SequelizeValidationError':
      case 'SequelizeUniqueConstraintError':
        statusCode = 400;
        message = 'Validation Error';
        details = error.errors?.map((e: any) => ({
          field: e.path,
          message: e.message,
        }));
        break;
        
      case 'SequelizeDatabaseError':
        statusCode = 400;
        message = 'Database Error';
        code = error.original?.code;
        break;
        
      case 'JsonWebTokenError':
        statusCode = 401;
        message = 'Invalid Token';
        break;
        
      case 'TokenExpiredError':
        statusCode = 401;
        message = 'Token Expired';
        break;
        
      case 'PlaidError':
        statusCode = 400;
        message = error.message || 'Plaid API Error';
        code = error.code;
        break;
    }
  }
  
  // For development, include more error details
  if (!isProduction && err instanceof Error) {
    details = {
      name: err.name,
      message: err.message,
      stack: err.stack,
    };
  }
  
  // Send error response
  const errorResponse: any = {
    status: 'error',
    message,
    ...(code && { code }),
    ...(details && { details }),
  };
  
  res.status(statusCode).json(errorResponse);
});

/**
 * Start the server
 */
async function startServer() {
  try {
    // Initialize database connection
    await databaseService.initialize();
    
    // Start the transaction sync scheduler
    if (process.env.ENABLE_TRANSACTION_SYNC === 'true') {
      transactionSyncScheduler.start(process.env.TRANSACTION_SYNC_CRON || '0 * * * *');
      logger.info('Transaction sync scheduler started');
    } else {
      logger.info('Transaction sync scheduler is disabled (ENABLE_TRANSACTION_SYNC is not set to true)');
    }
    
    // In production, we use a reverse proxy that handles SSL termination
    if (isProduction) {
      const server = app.listen(port, () => {
        logger.info(`Server is running in production mode on port ${port}`);
        logger.info(`Environment: ${appConfig.environment}`);
      });
      
      // Handle graceful shutdown
      setupGracefulShutdown(server);
    } else {
      // In development, we'll run both HTTP and HTTPS
      const httpPort = port;
      const httpsPort = parseInt(port.toString(), 10) + 1;
      
      // HTTP server (for development)
      const httpServer = http.createServer(app);
      httpServer.listen(httpPort, () => {
        logger.info(`HTTP server is running at http://localhost:${httpPort}`);
      });
      
      // HTTPS server (for development with mTLS)
      // Note: In a real project, you would configure SSL properly
      const httpsServer = https.createServer({
        // For development only - in production, use a real certificate
        key: process.env.SSL_KEY,
        cert: process.env.SSL_CERT,
        requestCert: false,
        rejectUnauthorized: false, // Only for development!
      }, app);
      
      httpsServer.listen(httpsPort, () => {
        logger.info(`HTTPS server is running at https://localhost:${httpsPort}`);
      });
      
      // Handle graceful shutdown for both servers
      setupGracefulShutdown(httpServer);
      setupGracefulShutdown(httpsServer);
      
      // Stop the scheduler on process exit
      process.on('SIGTERM', () => {
        logger.info('SIGTERM received, stopping transaction sync scheduler...');
        transactionSyncScheduler.stop();
        process.exit(0);
      });
      
      process.on('SIGINT', () => {
        logger.info('SIGINT received, stopping transaction sync scheduler...');
        transactionSyncScheduler.stop();
        process.exit(0);
      });
    }
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

/**
 * Setup graceful shutdown for a server
 */
function setupGracefulShutdown(server: http.Server | https.Server) {
  const shutdown = async () => {
    logger.info('Gracefully shutting down...');
    
    try {
      // Close the server
      server.close(async () => {
        logger.info('Server closed');
        
        // Close database connection
        await databaseService.disconnect();
        logger.info('Database connection closed');
        
        process.exit(0);
      });
      
      // Force close after timeout
      setTimeout(() => {
        logger.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
      }, 10000);
      
    } catch (error) {
      logger.error('Error during shutdown:', error);
      process.exit(1);
    }
  };
  
  // Handle shutdown signals
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
  
  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', { promise, reason });
    // Consider whether to shut down here or not
    // For critical errors, you might want to shut down
    // shutdown();
  });
  
  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error);
    // Consider whether to shut down here or not
    // For critical errors, you might want to shut down
    // shutdown();
  });
}

// Start the server
startServer().catch(error => {
  logger.error('Fatal error during startup:', error);
  process.exit(1);
}); 