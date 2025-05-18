#!/usr/bin/env ts-node

import { configService } from '../src/config/config.service';
import { databaseService } from '../src/database/database.service';
import { logger } from '../src/utils/logger';

async function testConfig() {
  try {
    logger.info('=== Testing Configuration ===');
    
    // Test App Config
    const appConfig = configService.getAppConfig();
    logger.info('App Config:', {
      environment: appConfig.environment,
      port: appConfig.port,
      logLevel: appConfig.logLevel,
      isProduction: appConfig.isProduction,
    });

    // Test AWS Config
    const awsConfig = configService.getAwsConfig();
    logger.info('AWS Config:', {
      region: awsConfig.region,
      accountId: awsConfig.accountId ? '***' : 'Not set',
      secretsPrefix: awsConfig.secretsPrefix,
    });

    // Test Database Config
    try {
      const dbConfig = await configService.getDatabaseConfig();
      logger.info('Database Config:', {
        host: dbConfig.host,
        port: dbConfig.port,
        database: dbConfig.database,
        username: dbConfig.username,
        password: '***', // Never log actual passwords
      });
    } catch (error) {
      logger.error('Failed to load database config:', error);
    }

    // Test JWT Config
    try {
      const jwtConfig = await configService.getJwtConfig();
      logger.info('JWT Config:', {
        expiresIn: jwtConfig.expiresIn,
        issuer: jwtConfig.issuer,
        audience: jwtConfig.audience,
      });
    } catch (error) {
      logger.error('Failed to load JWT config:', error);
    }

    // Test Plaid Config
    try {
      const plaidConfig = await configService.getPlaidConfig();
      logger.info('Plaid Config:', {
        environment: plaidConfig.environment,
        clientId: plaidConfig.clientId ? '***' : 'Not set',
        webhookUrl: plaidConfig.webhookUrl || 'Not set',
      });
    } catch (error) {
      logger.error('Failed to load Plaid config:', error);
    }

    // Test Database Connection
    logger.info('\n=== Testing Database Connection ===');
    try {
      await databaseService.initialize();
      logger.info('✅ Database connection successful');
      
      // Test a simple query
      const [results] = await databaseService.getSequelize().query('SELECT version()');
      logger.info('Database version:', results);
      
      await databaseService.close();
    } catch (error) {
      logger.error('❌ Database connection failed:', error);
    }

    logger.info('\n=== Configuration Test Complete ===');
    process.exit(0);
  } catch (error) {
    logger.error('❌ Configuration test failed:', error);
    process.exit(1);
  }
}

// Run the test
testConfig();
