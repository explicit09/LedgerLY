interface EnvConfig {
  apiUrl: string;
  nodeEnv: 'development' | 'production' | 'test';
  isProduction: boolean;
  isDevelopment: boolean;
  isTest: boolean;
  sentryDsn?: string;
  googleClientId?: string;
  facebookAppId?: string;
  appVersion: string;
  buildNumber: string;
}

// Get environment variables with defaults
const env = process.env;

// Validate required environment variables in production
if (env.NODE_ENV === 'production') {
  const requiredVars = ['REACT_APP_API_URL'];
  const missingVars = requiredVars.filter(varName => !env[varName]);
  
  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }
}

// Create config object with defaults
const config: EnvConfig = {
  // API configuration
  apiUrl: env.REACT_APP_API_URL || 'http://localhost:3001/api',
  
  // Environment flags
  nodeEnv: (env.NODE_ENV as 'development' | 'production' | 'test') || 'development',
  isProduction: env.NODE_ENV === 'production',
  isDevelopment: env.NODE_ENV === 'development',
  isTest: env.NODE_ENV === 'test',
  
  // Third-party services
  sentryDsn: env.REACT_APP_SENTRY_DSN,
  googleClientId: env.REACT_APP_GOOGLE_CLIENT_ID,
  facebookAppId: env.REACT_APP_FACEBOOK_APP_ID,
  
  // App info
  appVersion: env.REACT_APP_VERSION || '0.1.0',
  buildNumber: env.REACT_APP_BUILD_NUMBER || '1',
};

// Freeze the config object to prevent accidental modifications
Object.freeze(config);

export default config;
