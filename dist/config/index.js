"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isTest = exports.isDevelopment = exports.isProduction = exports.serverConfig = exports.databaseConfig = void 0;
var dotenv_1 = require("dotenv");
// Load environment variables
dotenv_1.default.config();
var requiredEnvVars = [
    'DB_HOST',
    'DB_PORT',
    'DB_NAME',
    'DB_USER',
    'DB_PASSWORD'
];
// Validate required environment variables
var missingVars = requiredEnvVars.filter(function (varName) { return !process.env[varName] && varName !== 'DB_PASSWORD'; });
if (missingVars.length > 0) {
    throw new Error("Missing required environment variables: ".concat(missingVars.join(', ')));
}
var databaseConfig = {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT, 10),
    database: process.env.DB_NAME,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
};
exports.databaseConfig = databaseConfig;
var serverConfig = {
    port: parseInt(process.env.PORT || '3000', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    database: databaseConfig,
};
exports.serverConfig = serverConfig;
exports.isProduction = serverConfig.nodeEnv === 'production';
exports.isDevelopment = serverConfig.nodeEnv === 'development';
exports.isTest = serverConfig.nodeEnv === 'test';
