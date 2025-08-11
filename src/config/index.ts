import dotenv from 'dotenv';
import { DatabaseConfig, ServerConfig } from '../types';

// Load environment variables
dotenv.config();

const requiredEnvVars = [
  'DB_HOST',
  'DB_PORT', 
  'DB_NAME',
  'DB_USER',
  'DB_PASSWORD'
];

// Validate required environment variables
const missingVars = requiredEnvVars.filter(varName => !process.env[varName] && varName !== 'DB_PASSWORD');
if (missingVars.length > 0) {
  throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
}

const databaseConfig: DatabaseConfig = {
  host: process.env.DB_HOST!,
  port: parseInt(process.env.DB_PORT!, 10),
  database: process.env.DB_NAME!,
  username: process.env.DB_USER!,
  password: process.env.DB_PASSWORD!,
};

const serverConfig: ServerConfig = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  database: databaseConfig,
};

export { databaseConfig, serverConfig };

export const isProduction = serverConfig.nodeEnv === 'production';
export const isDevelopment = serverConfig.nodeEnv === 'development';
export const isTest = serverConfig.nodeEnv === 'test';

