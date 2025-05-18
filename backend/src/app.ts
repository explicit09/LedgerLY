import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { configService } from './config';
import { databaseService } from './database';
import { logger } from './utils/logger';

/**
 * Main application class
 */
class App {
  public app: express.Application;
  private port: number;
  private isProduction: boolean;

  constructor() {
    this.app = express();
    this.port = configService.getAppConfig().port;
    this.isProduction = configService.getAppConfig().isProduction;

    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  /**
   * Initialize application middlewares
   */
  private initializeMiddlewares(): void {
    // Security headers
    this.app.use(helmet());
    
    // Enable CORS
    this.app.use(cors({
      origin: this.isProduction ? process.env.ALLOWED_ORIGINS?.split(',') : '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      credentials: true,
    }));

    // Parse JSON bodies
    this.app.use(express.json());
    
    // Parse URL-encoded bodies
    this.app.use(express.urlencoded({ extended: true }));

    // Log requests
    this.app.use((req, res, next) => {
      const start = Date.now();
      const { method, originalUrl, ip } = req;
      
      res.on('finish', () => {
        const { statusCode } = res;
        const contentLength = res.get('content-length');
        const responseTime = Date.now() - start;
        
        logger.http(`${method} ${originalUrl}`, {
          status: statusCode,
          method,
          url: originalUrl,
          ip,
          duration: `${responseTime}ms`,
          contentLength: contentLength || '0',
        });
      });
      
      next();
    });
  }

  /**
   * Initialize routes
   */
  private initializeRoutes(): void {
    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
      });
    });

    // API routes will be added here
    // this.app.use('/api/v1', apiRouter);

    // 404 handler
    this.app.use((req, res) => {
      res.status(404).json({
        status: 'error',
        message: 'Not Found',
      });
    });
  }

  /**
   * Initialize error handling
   */
  private initializeErrorHandling(): void {
    // Error handling middleware
    this.app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
      logger.error('Unhandled error:', {
        error: err.stack || err.message || err,
        url: req.originalUrl,
        method: req.method,
        ip: req.ip,
      });

      // Don't leak error details in production
      const errorResponse = {
        status: 'error',
        message: this.isProduction ? 'Something went wrong' : err.message,
        ...(!this.isProduction && { stack: err.stack }),
      };

      res.status(err.status || 500).json(errorResponse);
    });
  }

  /**
   * Start the server
   */
  public async start(): Promise<void> {
    try {
      // Initialize database connection
      await databaseService.initialize();
      
      // Start the server
      this.app.listen(this.port, () => {
        logger.info(`Server is running on port ${this.port}`);
        logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
        logger.info(`API Docs: http://localhost:${this.port}/api-docs`);
      });

      // Handle graceful shutdown
      this.handleShutdown();
    } catch (error) {
      logger.error('Failed to start server:', error);
      process.exit(1);
    }
  }

  /**
   * Handle graceful shutdown
   */
  private handleShutdown(): void {
    const signals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM', 'SIGQUIT'];
    
    signals.forEach(signal => {
      process.on(signal, async () => {
        logger.info(`Received ${signal}. Gracefully shutting down...`);
        
        try {
          await databaseService.disconnect();
          logger.info('Database connection closed');
          process.exit(0);
        } catch (error) {
          logger.error('Error during shutdown:', error);
          process.exit(1);
        }
      });
    });
  }
}

export default App;
