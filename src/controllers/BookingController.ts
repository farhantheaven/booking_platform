import { Request, Response } from 'express';
import { z } from 'zod';
import { AvailabilityService } from '../services/AvailabilityService';
import { BookingService } from '../services/BookingService';

// Request validation schemas
const CreateBookingSchema = z.object({
  resourceId: z.string().uuid('Invalid resource ID format'),
  title: z.string().min(1, 'Title is required').max(255, 'Title too long'),
  description: z.string().max(1000, 'Description too long').optional(),
  startTime:
   z.string().refine((val) => {
    // More flexible datetime validation that accepts timezone offsets
    const date = new Date(val);
    return !isNaN(date.getTime());
  }, 'Invalid start time format - must be a valid ISO 8601 datetime string'),
  endTime: z.string().refine((val) => {
    // More flexible datetime validation that accepts timezone offsets
    const date = new Date(val);
    return !isNaN(date.getTime());
  }, 'Invalid end time format - must be a valid ISO 8601 datetime string'),
  recurrenceRule: z.string().optional(),
  createdBy: z.string().max(255, 'Created by field too long').optional()
});

const AvailabilityQuerySchema = z.object({
  resourceId: z.string().uuid('Invalid resource ID format'),
  startDate: z.string().refine((val) => {
    // More flexible datetime validation that accepts timezone offsets
    const date = new Date(val);
    return !isNaN(date.getTime());
  }, 'Invalid start date format - must be a valid ISO 8601 datetime string'),
  endDate: z.string().refine((val) => {
    // More flexible datetime validation that accepts timezone offsets
    const date = new Date(val);
    return !isNaN(date.getTime());
  }, 'Invalid end date format - must be a valid ISO 8601 datetime string'),
  duration: z.string().transform(val => parseInt(val, 10)).pipe(
    z.number().min(15, 'Minimum duration is 15 minutes').max(480, 'Maximum duration is 8 hours')
  ).optional()
});

const CancelBookingSchema = z.object({
  bookingId: z.string().uuid('Invalid booking ID format'),
  cancelType: z.enum(['single', 'series', 'instance']),
  instanceDate: z.string().refine((val) => {
    // More flexible datetime validation that accepts timezone offsets
    const date = new Date(val);
    return !isNaN(date.getTime());
  }, 'Invalid instance date format - must be a valid ISO 8601 datetime string').optional()
});

export class BookingController {
  constructor(
    private bookingService: BookingService,
    private availabilityService: AvailabilityService
  ) {
    // Bind methods to preserve 'this' context
    this.createBooking = this.createBooking.bind(this);
    this.getAvailability = this.getAvailability.bind(this);
    this.cancelBooking = this.cancelBooking.bind(this);
    this.getBooking = this.getBooking.bind(this);
    this.getResourceSummary = this.getResourceSummary.bind(this);
  }

  /**
   * POST /bookings - Create a new booking
   */
  async createBooking(req: Request, res: Response): Promise<void> {
    try {
      // Validate request body
      const validationResult = CreateBookingSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: validationResult.error.errors
        });
        return;
      }

      const bookingRequest = validationResult.data;

      // Additional business logic validation
      const startTime = new Date(bookingRequest.startTime);
      const endTime = new Date(bookingRequest.endTime);

      if (startTime >= endTime) {
        res.status(400).json({
          success: false,
          error: 'Start time must be before end time'
        });
        return;
      }

      if (startTime < new Date()) {
        res.status(400).json({
          success: false,
          error: 'Cannot create bookings in the past'
        });
        return;
      }

      // Check if resource exists
      const resourceExists = await this.availabilityService.resourceExists(bookingRequest.resourceId);
      if (!resourceExists) {
        res.status(404).json({
          success: false,
          error: 'Resource not found'
        });
        return;
      }

      // Create the booking
      const result = await this.bookingService.createBooking(bookingRequest);

      if (result.success) {
        res.status(201).json(result);
      } else {
        // Conflict or other business logic error
        const statusCode = result.conflicts && result.conflicts.length > 0 ? 409 : 400;
        res.status(statusCode).json(result);
      }

    } catch (error) {
      console.error('Error in createBooking:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  /**
   * GET /availability - Get available time slots
   */
  async getAvailability(req: Request, res: Response): Promise<void> {
    try {
      // Validate query parameters
      const validationResult = AvailabilityQuerySchema.safeParse(req.query);
      
      if (!validationResult.success) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: validationResult.error.errors
        });
        return;
      }

      const availabilityRequest = validationResult.data;

      // Check if resource exists
      const resourceExists = await this.availabilityService.resourceExists(availabilityRequest.resourceId);
      if (!resourceExists) {
        res.status(404).json({
          success: false,
          error: 'Resource not found'
        });
        return;
      }

      // Get availability
      const result = await this.availabilityService.getAvailability(availabilityRequest);

      res.status(200).json(result);

    } catch (error) {
      console.error('Error in getAvailability:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  /**
   * DELETE /bookings/:id - Cancel a booking
   */
  async cancelBooking(req: Request, res: Response): Promise<void> {
    try {
      const bookingId = req.params.id;

      // Validate booking ID format
      if (!z.string().uuid().safeParse(bookingId).success) {
        res.status(400).json({
          success: false,
          error: 'Invalid booking ID format'
        });
        return;
      }

      // Validate request body
      const requestBody = { ...req.body, bookingId };
      const validationResult = CancelBookingSchema.safeParse(requestBody);
      
      if (!validationResult.success) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: validationResult.error.errors
        });
        return;
      }

      const cancelRequest = validationResult.data;

      // Check if booking exists
      const existingBooking = await this.bookingService.getBookingById(bookingId);
      if (!existingBooking) {
        res.status(404).json({
          success: false,
          error: 'Booking not found'
        });
        return;
      }

      // Cancel the booking
      const result = await this.bookingService.cancelBooking(cancelRequest);

      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(400).json(result);
      }

    } catch (error) {
      console.error('Error in cancelBooking:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  /**
   * GET /bookings/:id - Get booking details
   */
  async getBooking(req: Request, res: Response): Promise<void> {
    try {
      const bookingId = req.params.id;

      // Validate booking ID format
      if (!z.string().uuid().safeParse(bookingId).success) {
        res.status(400).json({
          success: false,
          error: 'Invalid booking ID format'
        });
        return;
      }

      const booking = await this.bookingService.getBookingById(bookingId);

      if (!booking) {
        res.status(404).json({
          success: false,
          error: 'Booking not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        booking
      });

    } catch (error) {
      console.error('Error in getBooking:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  /**
   * GET /resources/:id/summary - Get resource utilization summary
   */
  async getResourceSummary(req: Request, res: Response): Promise<void> {
    try {
      const resourceId = req.params.id;

      // Validate resource ID format
      if (!z.string().uuid().safeParse(resourceId).success) {
        res.status(400).json({
          success: false,
          error: 'Invalid resource ID format'
        });
        return;
      }

      // Get date range from query parameters (default to current month)
      const startDate = req.query.startDate 
        ? new Date(req.query.startDate as string)
        : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
      
      const endDate = req.query.endDate
        ? new Date(req.query.endDate as string)
        : new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);

      // Check if resource exists
      const resourceExists = await this.availabilityService.resourceExists(resourceId);
      if (!resourceExists) {
        res.status(404).json({
          success: false,
          error: 'Resource not found'
        });
        return;
      }

      // Get availability summary
      const summary = await this.availabilityService.getAvailabilitySummary(
        resourceId,
        startDate,
        endDate
      );

      res.status(200).json({
        success: true,
        resourceId,
        period: {
          startDate,
          endDate
        },
        summary
      });

    } catch (error) {
      console.error('Error in getResourceSummary:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  /**
   * POST /bookings/:id/exceptions - Add a booking exception
   */
  async addBookingException(req: Request, res: Response): Promise<void> {
    try {
      const bookingId = req.params.id;
      const exceptionData = req.body;

      // Validate booking ID format
      if (!z.string().uuid().safeParse(bookingId).success) {
        res.status(400).json({
          success: false,
          error: 'Invalid booking ID format'
        });
        return;
      }

      // Validate exception data
      const validationResult = z.object({
        exceptionDate: z.string().refine((val) => {
          // More flexible datetime validation that accepts timezone offsets
          const date = new Date(val);
          return !isNaN(date.getTime());
        }, 'Invalid exception date format - must be a valid ISO 8601 datetime string'),
        exceptionType: z.enum(['cancelled', 'modified']),
        newStartTime: z.string().refine((val) => {
          // More flexible datetime validation that accepts timezone offsets
          const date = new Date(val);
          return !isNaN(date.getTime());
        }, 'Invalid new start time format - must be a valid ISO 8601 datetime string').optional(),
        newEndTime: z.string().refine((val) => {
          // More flexible datetime validation that accepts timezone offsets
          const date = new Date(val);
          return !isNaN(date.getTime());
        }, 'Invalid new end time format - must be a valid ISO 8601 datetime string').optional(),
        newTitle: z.string().optional(),
        newDescription: z.string().optional()
      }).safeParse(exceptionData);

      if (!validationResult.success) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: validationResult.error.errors
        });
        return;
      }

      // Add the exception
      const result = await this.bookingService.addBookingException(bookingId, validationResult.data);

      if (result.success) {
        res.status(201).json(result);
      } else {
        res.status(400).json(result);
      }

    } catch (error) {
      console.error('Error in addBookingException:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  /**
   * GET /bookings/:id/exceptions - Get all exceptions for a booking
   */
  async getBookingExceptions(req: Request, res: Response): Promise<void> {
    try {
      const bookingId = req.params.id;

      // Validate booking ID format
      if (!z.string().uuid().safeParse(bookingId).success) {
        res.status(400).json({
          success: false,
          error: 'Invalid booking ID format'
        });
        return;
      }

      // Get exceptions
      const result = await this.bookingService.getBookingExceptions(bookingId);

      res.status(200).json(result);

    } catch (error) {
      console.error('Error in getBookingExceptions:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  /**
   * PUT /bookings/:id/exceptions/:exceptionId - Update a booking exception
   */
  async updateBookingException(req: Request, res: Response): Promise<void> {
    try {
      const bookingId = req.params.id;
      const exceptionId = req.params.exceptionId;
      const updateData = req.body;

      // Validate IDs
      if (!z.string().uuid().safeParse(bookingId).success) {
        res.status(400).json({
          success: false,
          error: 'Invalid booking ID format'
        });
        return;
      }

      if (!z.string().uuid().safeParse(exceptionId).success) {
        res.status(400).json({
          success: false,
          error: 'Invalid exception ID format'
        });
        return;
      }

      // Update the exception
      const result = await this.bookingService.updateBookingException(bookingId, exceptionId, updateData);

      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(400).json(result);
      }

    } catch (error) {
      console.error('Error in updateBookingException:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  /**
   * DELETE /bookings/:id/exceptions/:exceptionId - Delete a booking exception
   */
  async deleteBookingException(req: Request, res: Response): Promise<void> {
    try {
      const bookingId = req.params.id;
      const exceptionId = req.params.exceptionId;

      // Validate IDs
      if (!z.string().uuid().safeParse(bookingId).success) {
        res.status(400).json({
          success: false,
          error: 'Invalid booking ID format'
        });
        return;
      }

      if (!z.string().uuid().safeParse(exceptionId).success) {
        res.status(400).json({
          success: false,
          error: 'Invalid exception ID format'
        });
        return;
      }

      // Delete the exception
      const result = await this.bookingService.deleteBookingException(bookingId, exceptionId);

      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(400).json(result);
      }

    } catch (error) {
      console.error('Error in deleteBookingException:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  /**
   * GET /health - Health check endpoint
   */
  async healthCheck(req: Request, res: Response): Promise<void> {
    try {
      // You could add database connectivity check here
      res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      });
    } catch (error) {
      res.status(500).json({
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}