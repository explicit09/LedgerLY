import { format, createLogger, transports } from 'winston';
import { AWSConfig } from '../config/aws.config';

// Define the logger interface
export interface ILogger {
  info: (message: string, meta?: any) => void;
  error: (message: string, meta?: any) => void;
  debug: (message: string, meta?: any) => void;
  warn: (message: string, meta?: any) => void;
  http: (message: string, meta?: any) => void;
}

// Create a mock logger for test environment
const createMockLogger = (): ILogger => ({
  info: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
  warn: jest.fn(),
  http: jest.fn(),
});

// Create a real logger for non-test environments
const createRealLogger = (): ILogger => {
  const { combine, timestamp, printf, errors, json } = format;

  // Define log format
  const logFormat = printf(({ level, message, timestamp, stack, ...meta }) => {
    const logEntry: any = {
      timestamp,
      level,
      message,
      ...meta,
    };

    // Include stack trace for errors
    if (stack) {
      logEntry.stack = stack;
    }

    return JSON.stringify(logEntry);
  });

  // Create logger instance
  const winstonLogger = createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: combine(
      timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      errors({ stack: true }),
      json()
    ),
    defaultMeta: {
      service: 'ledgerly-backend',
      environment: process.env.NODE_ENV || 'development',
    },
    transports: [
      // Console transport for local development
      new transports.Console({
        format: combine(
          format.colorize(),
          logFormat
        ),
      }),
    ],
  });

  // Add CloudWatch transport in non-development environments
  if (process.env.NODE_ENV !== 'development' && process.env.NODE_ENV !== 'test' && process.env.AWS_CLOUDWATCH_GROUP_NAME) {
    // Use dynamic import to avoid loading AWS SDK in test environment
    import('winston-cloudwatch')
      .then(WinstonCloudWatch => {
        const cloudwatchConfig = {
          logGroupName: process.env.AWS_CLOUDWATCH_GROUP_NAME,
          logStreamName: `${process.env.AWS_CLOUDWATCH_STREAM_PREFIX || 'backend'}-${Date.now()}`,
          awsRegion: AWSConfig.region,
          messageFormatter: (log: any) => {
            const { level, message, ...meta } = log;
            return JSON.stringify({
              level,
              message,
              ...meta,
            });
          },
          retentionInDays: 30,
        };
        winstonLogger.add(new WinstonCloudWatch.default(cloudwatchConfig));
      })
      .catch(error => {
        console.error('Failed to initialize CloudWatch logging:', error);
      });
  }

  // Log unhandled exceptions
  process.on('unhandledRejection', (reason, promise) => {
    winstonLogger.error('Unhandled Rejection at:', { promise, reason });
  });

  process.on('uncaughtException', (error) => {
    winstonLogger.error('Uncaught Exception thrown:', { error });
    process.exit(1);
  });

  return {
    info: (message: string, meta?: any) => winstonLogger.info(message, meta),
    error: (message: string, meta?: any) => winstonLogger.error(message, meta),
    debug: (message: string, meta?: any) => winstonLogger.debug(message, meta),
    warn: (message: string, meta?: any) => winstonLogger.warn(message, meta),
    http: (message: string, meta?: any) => winstonLogger.http(message, meta),
  };
};

// Create and export the logger instance
const logger: ILogger = process.env.NODE_ENV === 'test' 
  ? createMockLogger() 
  : createRealLogger();

export { logger };
