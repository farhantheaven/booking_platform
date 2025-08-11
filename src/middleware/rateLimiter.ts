import { Request, Response } from 'express';
import rateLimit from 'express-rate-limit';

// Extend Express Request interface to include rateLimit property
declare global {
  namespace Express {
    interface Request {
      rateLimit?: {
        current: number;
        limit: number;
        resetTime: number;
      };
    }
  }
}

// Rate limiting configuration for load testing
export const createRateLimiters = () => {
  // General API rate limiter
  const generalLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 1000, // Limit each IP to 1000 requests per minute
    message: {
      error: 'Too many requests from this IP, please try again later.',
      retryAfter: '1 minute'
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    handler: (req: Request, res: Response) => {
      res.status(429).json({
        success: false,
        error: 'Rate limit exceeded',
        message: 'Too many requests, please try again later',
        retryAfter: Math.ceil((req.rateLimit?.resetTime || 0) / 1000) || 60
      });
    }
  });

  // Strict rate limiter for booking creation (most resource-intensive)
  const bookingLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 100, // Limit each IP to 100 booking creations per minute
    message: {
      error: 'Too many booking creation requests, please try again later.',
      retryAfter: '1 minute'
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req: Request, res: Response) => {
      res.status(429).json({
        success: false,
        error: 'Booking rate limit exceeded',
        message: 'Too many booking creation requests, please try again later',
        retryAfter: Math.ceil((req.rateLimit?.resetTime || 0) / 1000) || 60
      });
    }
  });

  // Availability check rate limiter (most common operation)
  const availabilityLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 500, // Limit each IP to 500 availability checks per minute
    message: {
      error: 'Too many availability check requests, please try again later.',
      retryAfter: '1 minute'
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req: Request, res: Response) => {
      res.status(429).json({
        success: false,
        error: 'Availability rate limit exceeded',
        message: 'Too many availability check requests, please try again later',
        retryAfter: Math.ceil((req.rateLimit?.resetTime || 0) / 1000) || 60
      });
    }
  });

  // Health check rate limiter (very permissive)
  const healthCheckLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 10000, // Limit each IP to 10000 health checks per minute
    message: {
      error: 'Too many health check requests.',
      retryAfter: '1 minute'
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req: Request, res: Response) => {
      res.status(429).json({
        success: false,
        error: 'Health check rate limit exceeded',
        message: 'Too many health check requests',
        retryAfter: Math.ceil((req.rateLimit?.resetTime || 0) / 1000) || 60
      });
    }
  });

  return {
    generalLimiter,
    bookingLimiter,
    availabilityLimiter,
    healthCheckLimiter
  };
};

// Dynamic rate limiter that adjusts based on system load
export const createDynamicRateLimiter = () => {
  let currentLimit = 1000; // Start with 1000 requests per minute
  let lastAdjustment = Date.now();
  
  return rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: (req: Request) => {
      // Adjust rate limit based on system performance
      const now = Date.now();
      if (now - lastAdjustment > 60000) { // Adjust every minute
        // You can implement logic here to adjust based on:
        // - Database response times
        // - Memory usage
        // - CPU usage
        // - Error rates
        
        // For now, we'll use a simple adaptive approach
        if (req.rateLimit?.current && req.rateLimit.current > req.rateLimit.limit * 0.8) {
          // If usage is high, reduce limit
          currentLimit = Math.max(100, Math.floor(currentLimit * 0.9));
        } else if (req.rateLimit?.current && req.rateLimit.current < req.rateLimit.limit * 0.3) {
          // If usage is low, increase limit
          currentLimit = Math.min(2000, Math.floor(currentLimit * 1.1));
        }
        
        lastAdjustment = now;
      }
      
      return currentLimit;
    },
    message: {
      error: 'Dynamic rate limit exceeded, please try again later.',
      retryAfter: '1 minute'
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req: Request, res: Response) => {
      res.status(429).json({
        success: false,
        error: 'Dynamic rate limit exceeded',
        message: 'Rate limit exceeded, please try again later',
        currentLimit,
        retryAfter: Math.ceil((req.rateLimit?.resetTime || 0) / 1000) || 60
      });
    }
  });
}; 