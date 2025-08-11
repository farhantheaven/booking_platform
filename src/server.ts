import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { databaseConfig, serverConfig } from './config';
import { initializeDatabase } from './config/database';
import { createRateLimiters } from './middleware/rateLimiter';
import { createRoutes } from './routes';

// Error handling middleware
import { NextFunction, Request, Response } from 'express';

// Custom error handling middleware
const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error('Unhandled error:', error);
  
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    ...(serverConfig.nodeEnv === 'development' && {
      details: error.message,
      stack: error.stack
    })
  });
};

// 404 handler
const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    error: `Route ${req.method} ${req.path} not found`,
    availableEndpoints: [
      'GET /health',
      'GET /api-docs',
      'POST /bookings',
      'GET /bookings/:id',
      'DELETE /bookings/:id',
      'GET /availability',
      'GET /resources/:id/summary'
    ]
  });
};

// Request logging middleware
const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} ${res.statusCode} - ${duration}ms`);
  });
  
  next();
};

async function startServer(): Promise<void> {
  try {
    // Initialize database connection
    console.log('Initializing database connection...');
    const db = initializeDatabase(databaseConfig);
    
    // Test database connection
    const isHealthy = await db.isHealthy();
    if (!isHealthy) {
      throw new Error('Database connection failed');
    }
    console.log('Database connected successfully');

    // Initialize Sequelize models
    console.log('Initializing Sequelize models...');
    const { initializeModels } = await import('./models');
    await initializeModels(db.getSequelize());
    console.log('Models initialized successfully');

    // Create Express app
    const app = express();

    // Security middleware
    app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
    }));

    // CORS configuration
    app.use(cors({
      origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
    }));

    // Create rate limiters
    const rateLimiters = createRateLimiters();
    
    // Body parsing middleware
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Request logging
    if (serverConfig.nodeEnv !== 'test') {
      app.use(requestLogger);
    }

    // Apply rate limiting before routes
    app.use('/api/v1/health', rateLimiters.healthCheckLimiter);
    app.use('/api/v1/bookings', rateLimiters.bookingLimiter);
    app.use('/api/v1/availability', rateLimiters.availabilityLimiter);
    app.use('/api/v1', rateLimiters.generalLimiter);

    // API routes
    app.use('/api/v1', createRoutes(db));

    // Root endpoint
    app.get('/', (req: Request, res: Response) => {
      res.json({
        service: 'HighLevel Booking Platform',
        version: '1.0.0',
        status: 'healthy',
        timestamp: new Date().toISOString(),
        documentation: '/api/v1/api-docs',
        endpoints: {
          health: '/api/v1/health',
          bookings: '/api/v1/bookings',
          availability: '/api/v1/availability'
        }
      });
    });

    // 404 handler
    app.use(notFoundHandler);

    // Error handling middleware (must be last)
    app.use(errorHandler);

    // Start server
    const server = app.listen(serverConfig.port, () => {
      console.log(`
🚀 HighLevel Booking Platform started successfully!

📋 Server Information:
   • Port: ${serverConfig.port}
   • Environment: ${serverConfig.nodeEnv}
   • Database: ${databaseConfig.host}:${databaseConfig.port}/${databaseConfig.database}

📚 API Documentation: http://localhost:${serverConfig.port}/api/v1/api-docs
🏥 Health Check: http://localhost:${serverConfig.port}/api/v1/health

🔗 Available Endpoints:
   • POST   /api/v1/bookings - Create booking
   • GET    /api/v1/bookings/:id - Get booking
   • DELETE /api/v1/bookings/:id - Cancel booking
   • GET    /api/v1/availability - Check availability
   • GET    /api/v1/resources/:id/summary - Get utilization summary

📊 Load Testing:
   • npm run load-test - Simulate normal load
   • npm run spike-test - Simulate traffic spikes
      `);
    });

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      console.log('Received SIGTERM, shutting down gracefully...');
      
      server.close(async () => {
        console.log('HTTP server closed');
        
        try {
          await db.close();
          console.log('Database connection closed');
          process.exit(0);
        } catch (error) {
          console.error('Error closing database:', error);
          process.exit(1);
        }
      });
    });

    process.on('SIGINT', async () => {
      console.log('Received SIGINT, shutting down gracefully...');
      
      server.close(async () => {
        console.log('HTTP server closed');
        
        try {
          await db.close();
          console.log('Database connection closed');
          process.exit(0);
        } catch (error) {
          console.error('Error closing database:', error);
          process.exit(1);
        }
      });
    });

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
if (require.main === module) {
  startServer().catch(error => {
    console.error('Fatal error during startup:', error);
    process.exit(1);
  });
}

export { startServer };
