#!/usr/bin/env ts-node

import { configService } from '../src/config/config.service';
import { logger } from '../src/utils/logger';

async function testAwsSecrets() {
  try {
    logger.info('=== Testing AWS Secrets Manager Integration ===');
    
    // Test database configuration
    try {
      const dbConfig = await configService.getDatabaseConfig();
      logger.info('✅ Database configuration loaded successfully', {
        host: dbConfig.host,
        port: dbConfig.port,
        database: dbConfig.database,
        username: dbConfig.username,
      });
    } catch (error) {
      logger.error('❌ Failed to load database configuration', { error });
    }
    
    // Test JWT configuration
    try {
      const jwtConfig = await configService.getJwtConfig();
      logger.info('✅ JWT configuration loaded successfully', {
        issuer: jwtConfig.issuer,
        audience: jwtConfig.audience,
        expiresIn: jwtConfig.expiresIn,
      });
    } catch (error) {
      logger.error('❌ Failed to load JWT configuration', { error });
    }
    
    // Test Plaid configuration
    try {
      const plaidConfig = await configService.getPlaidConfig();
      logger.info('✅ Plaid configuration loaded successfully', {
        environment: plaidConfig.environment,
        clientId: plaidConfig.clientId ? '***' : 'Not set',
        webhookUrl: plaidConfig.webhookUrl || 'Not set',
      });
    } catch (error) {
      logger.error('❌ Failed to load Plaid configuration', { error });
    }
    
    logger.info('=== AWS Secrets Manager Test Complete ===');
    process.exit(0);
  } catch (error) {
    logger.error('❌ AWS Secrets Manager test failed:', error);
    process.exit(1);
  }
}

// Run the test
testAwsSecrets();
