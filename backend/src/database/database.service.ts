import { PrismaClient } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { logger } from '../utils/logger';

/**
 * Database service for managing database connections using Prisma
 */
export class DatabaseService {
  private static instance: DatabaseService;
  private _isInitialized = false;

  private constructor() {}

  /**
   * Get singleton instance of DatabaseService
   */
  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  /**
   * Initialize the database connection
   */
  async initialize(): Promise<void> {
    if (this._isInitialized) {
      logger.debug('Database already initialized');
      return;
    }

    try {
      // Test the database connection
      await prisma.$connect();
      logger.info('Database connection established');
      this._isInitialized = true;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to connect to database:', { error: errorMessage });
      throw error;
    }
  }

  /**
   * Check if the database is initialized
   */
  isInitialized(): boolean {
    return this._isInitialized;
  }

  /**
   * Get the Prisma client instance
   */
  getPrismaClient(): PrismaClient {
    if (!this._isInitialized) {
      throw new Error('Database not initialized. Call initialize() first.');
    }
    return prisma;
  }

  /**
   * Close the database connection
   */
  async disconnect(): Promise<void> {
    try {
      await prisma.$disconnect();
      this._isInitialized = false;
      logger.info('Database connection closed');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Error closing database connection:', { error: errorMessage });
      throw error;
    }
  }

  /**
   * Check if the database is connected
   */
  async isConnected(): Promise<boolean> {
    if (!this._isInitialized) {
      return false;
    }

    try {
      await prisma.$queryRaw`SELECT 1`;
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Run a callback within a transaction
   * @param callback Function to run within the transaction
   */
  async withTransaction<T>(
    callback: (tx: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>) => Promise<T>
  ): Promise<T> {
    if (!this._isInitialized) {
      throw new Error('Database not initialized. Call initialize() first.');
    }

    return prisma.$transaction(callback);
  }
}

// Export singleton instance
export const databaseService = DatabaseService.getInstance();
