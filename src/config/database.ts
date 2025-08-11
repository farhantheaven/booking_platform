import { Options, QueryTypes, Sequelize } from 'sequelize';
import { DatabaseConfig } from '../types';

export class DatabaseConnection {
  private sequelize: Sequelize;
  private config: DatabaseConfig;

  constructor(config: DatabaseConfig) {
    this.config = config;
    
    const sequelizeOptions: Options = {
      host: this.config.host,
      port: this.config.port,
      database: this.config.database,
      username: this.config.username,
      password: this.config.password,
      dialect: 'postgres',
      logging: process.env.NODE_ENV === 'development' ? console.log : false,
      
      // TIMEZONE CONFIGURATION - Force UTC storage
      timezone: '+00:00', // Force UTC timezone
      
      // PERFORMANCE OPTIMIZATIONS for Load Testing
      pool: {
        max: 50,           // Increased from 20 to 50 for load testing
        min: 10,           // Increased from 0 to 10 for faster response
        acquire: 30000,    // 30 seconds to acquire connection
        idle: 10000,       // 10 seconds before closing idle connection
        evict: 60000,      // Check for dead connections every minute
      },
      
      // Connection optimizations
      dialectOptions: {
        connectTimeout: 5000,     // Reduced from 2000ms to 5000ms for stability
        acquireTimeout: 30000,    // 30 seconds to acquire connection
        timeout: 60000,           // 60 seconds query timeout
        idleTimeoutMillis: 10000, // 10 seconds idle timeout
        
        // PostgreSQL specific optimizations
        statement_timeout: 30000, // 30 seconds statement timeout
        query_timeout: 30000,     // 30 seconds query timeout
        
        // Connection pooling optimizations
        max: 50,                  // Maximum connections in pool
        min: 10,                  // Minimum connections in pool
        
        // Force UTC timezone in PostgreSQL
        timezone: '+00:00',
      },
      
      // Query optimizations
      benchmark: process.env.NODE_ENV === 'development', // Log query execution time
      retry: {
        max: 3,                   // Retry failed queries up to 3 times
        backoffBase: 1000,        // Base delay for retries
        backoffExponent: 1.5,     // Exponential backoff
      },
      
      define: {
        underscored: true,
        freezeTableName: true,
        timestamps: true,
        
        // Performance optimizations
        paranoid: false,          // Disable soft deletes for performance
        version: false,           // Disable versioning for performance
      },
      
      // Transaction optimizations
      isolationLevel: 'READ_COMMITTED', // Optimize for read-heavy workloads
      
          // Logging optimizations
    logQueryParameters: process.env.NODE_ENV === 'development',
    };

    this.sequelize = new Sequelize(sequelizeOptions);

    // Handle connection errors
    this.sequelize.addHook('afterConnect', () => {
      console.log('Connected to PostgreSQL database via Sequelize');
    });
  }

  getSequelize(): Sequelize {
    return this.sequelize;
  }

  async authenticate(): Promise<void> {
    try {
      await this.sequelize.authenticate();
      console.log('Database connection established successfully.');
    } catch (error) {
      console.error('Unable to connect to the database:', error);
      throw error;
    }
  }

  async sync(options: { force?: boolean; alter?: boolean } = {}): Promise<void> {
    try {
      await this.sequelize.sync(options);
      console.log('Database synchronized successfully.');
    } catch (error) {
      console.error('Error synchronizing database:', error);
      throw error;
    }
  }

  async close(): Promise<void> {
    try {
      await this.sequelize.close();
      console.log('Database connection closed.');
    } catch (error) {
      console.error('Error closing database connection:', error);
      throw error;
    }
  }

  // Transaction helper
  async transaction<T>(callback: (transaction: any) => Promise<T>): Promise<T> {
    return this.sequelize.transaction(callback);
  }

  // Health check
  async isHealthy(): Promise<boolean> {
    try {
      await this.sequelize.authenticate();
      return true;
    } catch (error) {
      console.error('Database health check failed:', error);
      return false;
    }
  }

  // Raw query method (for backward compatibility)
  async query(sql: string, options: any = {}): Promise<any> {
    try {
      const [results] = await this.sequelize.query(sql, {
        type: QueryTypes.SELECT,
        ...options,
      });
      return { rows: results, rowCount: (results as unknown as any[]).length };
    } catch (error) {
      console.error('Query error:', error);
      throw error;
    }
  }
}

// Singleton instance
let dbInstance: DatabaseConnection | null = null;

export const getDatabase = (config?: DatabaseConfig): DatabaseConnection => {
  if (!dbInstance && config) {
    dbInstance = new DatabaseConnection(config);
  }
  
  if (!dbInstance) {
    throw new Error('Database not initialized. Please provide configuration.');
  }
  
  return dbInstance;
};

export const initializeDatabase = (config: DatabaseConfig): DatabaseConnection => {
  dbInstance = new DatabaseConnection(config);
  return dbInstance;
};

export const getSequelize = (): Sequelize => {
  if (!dbInstance) {
    throw new Error('Database not initialized. Call initializeDatabase first.');
  }
  return dbInstance.getSequelize();
};