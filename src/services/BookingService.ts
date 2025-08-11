import { Op } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';
import { DatabaseConnection } from '../config/database';
import { Booking, BookingException, Resource } from '../models';
import {
  CancelBookingRequest,
  CancelBookingResponse,
  CreateBookingRequest,
  CreateBookingResponse
} from '../types';
import { AvailabilityService } from './AvailabilityService';
import { ConflictDetectionService } from './ConflictDetectionService';
import { RecurrenceService } from './RecurrenceService';

export class BookingService {
  constructor(
    private db: DatabaseConnection,
    private recurrenceService: RecurrenceService,
    private conflictService: ConflictDetectionService,
    private availabilityService: AvailabilityService
  ) {}

  /**
   * Create a new booking (single or recurring)
   */
  async createBooking(request: CreateBookingRequest): Promise<CreateBookingResponse> {
    try {
      // Validate input
      const validationError = this.validateBookingRequest(request);
      if (validationError) {
        return {
          success: false,
          error: validationError
        };
      }

      const startTime = new Date(request.startTime);
      const endTime = new Date(request.endTime);

      // Check for conflicts
      const conflicts = await this.conflictService.detectConflicts(
        request.resourceId,
        startTime,
        endTime,
        request.recurrenceRule
      );

      if (conflicts.length > 0) {
        // Get alternative suggestions
        const suggestions = await this.availabilityService.findNextAvailableSlots(
          request.resourceId,
          startTime,
          endTime,
          3 // Get 3 suggestions
        );

        return {
          success: false,
          conflicts,
          suggestions,
          error: 'Time slot conflicts with existing bookings'
        };
      }

      // Create the booking
      const booking = await this.insertBooking(request);

      return {
        success: true,
        booking
      };

    } catch (error) {
      console.error('Error creating booking:', error);
      return {
        success: false,
        error: 'Internal server error while creating booking'
      };
    }
  }

  /**
   * Insert booking into database using Sequelize
   */
  private async insertBooking(request: CreateBookingRequest): Promise<any> {
    const seriesId = request.recurrenceRule ? uuidv4() : undefined;
    
    const booking = await Booking.create({
      resource_id: request.resourceId,
      title: request.title,
      description: request.description,
      start_time: new Date(request.startTime),
      end_time: new Date(request.endTime),
      is_recurring: !!request.recurrenceRule,
      recurrence_rule: request.recurrenceRule,
      series_id: seriesId,
      created_by: request.createdBy || 'unknown',
    });

    return booking;
  }

  /**
   * Cancel booking(s)
   */
  async cancelBooking(request: CancelBookingRequest): Promise<CancelBookingResponse> {
    try {
      switch (request.cancelType) {
        case 'single':
          return await this.cancelSingleBooking(request.bookingId);
        case 'series':
          return await this.cancelEntireSeries(request.bookingId);
        case 'instance':
          if (!request.instanceDate) {
            return {
              success: false,
              message: 'Instance date is required for instance cancellation',
              error: 'Missing instanceDate parameter'
            };
          }
          return await this.cancelSeriesInstance(request.bookingId, new Date(request.instanceDate));
        default:
          return {
            success: false,
            message: 'Invalid cancel type',
            error: 'cancelType must be one of: single, series, instance'
          };
      }
    } catch (error) {
      console.error('Error cancelling booking:', error);
      return {
        success: false,
        message: 'Internal server error while cancelling booking',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Cancel a single (non-recurring) booking using Sequelize
   */
  private async cancelSingleBooking(bookingId: string): Promise<CancelBookingResponse> {
    const deletedCount = await Booking.destroy({
      where: {
        id: bookingId,
        is_recurring: false,
      },
    });
    
    if (deletedCount === 0) {
      return {
        success: false,
        message: 'Booking not found or is part of a recurring series',
        error: 'BOOKING_NOT_FOUND'
      };
    }

    return {
      success: true,
      message: 'Booking cancelled successfully',
      affectedInstances: deletedCount
    };
  }

  /**
   * Cancel entire recurring series using Sequelize
   */
  private async cancelEntireSeries(bookingId: string): Promise<CancelBookingResponse> {
    return this.db.transaction(async (transaction) => {
      // First, find the booking to get the series_id
      const booking = await Booking.findByPk(bookingId, { transaction });
      
      if (!booking) {
        return {
          success: false,
          message: 'Booking not found',
          error: 'BOOKING_NOT_FOUND'
        };
      }

      const seriesId = booking.series_id || booking.id;

      // Delete all bookings in the series
      const deletedCount = await Booking.destroy({
        where: {
          [Op.or]: [
            { id: bookingId },
            { series_id: seriesId }
          ]
        },
        transaction
      });
      
      if (deletedCount === 0) {
        return {
          success: false,
          message: 'Booking series not found',
          error: 'SERIES_NOT_FOUND'
        };
      }

      return {
        success: true,
        message: `Recurring series cancelled successfully`,
        affectedInstances: deletedCount
      };
    });
  }

  /**
   * Cancel specific instance of recurring series using Sequelize
   */
  private async cancelSeriesInstance(bookingId: string, instanceDate: Date): Promise<CancelBookingResponse> {
    return this.db.transaction(async (transaction) => {
      // First check if the booking exists and is recurring
      const booking = await Booking.findOne({
        where: {
          id: bookingId,
          is_recurring: true,
        },
        transaction
      });
      
      if (!booking) {
        return {
          success: false,
          message: 'Recurring booking not found',
          error: 'RECURRING_BOOKING_NOT_FOUND'
        };
      }

      // Add exception for this instance
      await BookingException.upsert({
        booking_id: bookingId,
        exception_date: instanceDate,
        exception_type: 'cancelled',
      }, { transaction });

      return {
        success: true,
        message: 'Booking instance cancelled successfully',
        affectedInstances: 1
      };
    });
  }

  /**
   * Get booking by ID using Sequelize
   */
  async getBookingById(bookingId: string): Promise<any> {
    const booking = await Booking.findByPk(bookingId, {
      include: [
        {
          model: Resource,
          as: 'resource',
        },
        {
          model: BookingException,
          as: 'exceptions',
        }
      ]
    });

    return booking;
  }

  /**
   * Get bookings for a resource within a date range using Sequelize
   */
  async getBookingsForResource(
    resourceId: string, 
    startDate: Date, 
    endDate: Date
  ): Promise<any[]> {
    const bookings = await Booking.findAll({
      where: {
        resource_id: resourceId,
        start_time: { [Op.gte]: startDate },
        end_time: { [Op.lte]: endDate }
      },
      include: [
        {
          model: Resource,
          as: 'resource',
        },
        {
          model: BookingException,
          as: 'exceptions',
        }
      ],
      order: [['start_time', 'ASC']]
    });

    return bookings;
  }

  /**
   * Add a booking exception
   */
  async addBookingException(bookingId: string, exceptionData: any): Promise<any> {
    try {
      // Check if booking exists
      const booking = await Booking.findByPk(bookingId);
      if (!booking) {
        return {
          success: false,
          error: 'Booking not found'
        };
      }

      // Validate exception data based on type
      if (exceptionData.exceptionType === 'modified') {
        if (!exceptionData.newStartTime || !exceptionData.newEndTime) {
          return {
            success: false,
            error: 'Modified exceptions must include new start and end times'
          };
        }
      }

      // Create the exception
      const exception = await BookingException.create({
        booking_id: bookingId,
        exception_date: new Date(exceptionData.exceptionDate),
        exception_type: exceptionData.exceptionType,
        new_start_time: exceptionData.newStartTime ? new Date(exceptionData.newStartTime) : undefined,
        new_end_time: exceptionData.newEndTime ? new Date(exceptionData.newEndTime) : undefined,
        new_title: exceptionData.newTitle || null,
        new_description: exceptionData.newDescription || null
      });

      return {
        success: true,
        exception
      };

    } catch (error) {
      console.error('Error adding booking exception:', error);
      return {
        success: false,
        error: 'Failed to add booking exception'
      };
    }
  }

  /**
   * Get all exceptions for a booking
   */
  async getBookingExceptions(bookingId: string): Promise<any> {
    try {
      // Check if booking exists
      const booking = await Booking.findByPk(bookingId);
      if (!booking) {
        return {
          success: false,
          error: 'Booking not found'
        };
      }

      // Get exceptions
      const exceptions = await BookingException.findAll({
        where: { booking_id: bookingId },
        order: [['exception_date', 'ASC']]
      });

      return {
        success: true,
        exceptions
      };

    } catch (error) {
      console.error('Error getting booking exceptions:', error);
      return {
        success: false,
        error: 'Failed to get booking exceptions'
      };
    }
  }

  /**
   * Update a booking exception
   */
  async updateBookingException(bookingId: string, exceptionId: string, updateData: any): Promise<any> {
    try {
      // Check if booking exists
      const booking = await Booking.findByPk(bookingId);
      if (!booking) {
        return {
          success: false,
          error: 'Booking not found'
        };
      }

      // Check if exception exists
      const exception = await BookingException.findOne({
        where: {
          id: exceptionId,
          booking_id: bookingId
        }
      });

      if (!exception) {
        return {
          success: false,
          error: 'Exception not found'
        };
      }

      // Update the exception
      await exception.update(updateData);

      return {
        success: true,
        exception
      };

    } catch (error) {
      console.error('Error updating booking exception:', error);
      return {
        success: false,
        error: 'Failed to update booking exception'
      };
    }
  }

  /**
   * Delete a booking exception
   */
  async deleteBookingException(bookingId: string, exceptionId: string): Promise<any> {
    try {
      // Check if booking exists
      const booking = await Booking.findByPk(bookingId);
      if (!booking) {
        return {
          success: false,
          error: 'Booking not found'
        };
      }

      // Check if exception exists
      const exception = await BookingException.findOne({
        where: {
          id: exceptionId,
          booking_id: bookingId
        }
      });

      if (!exception) {
        return {
          success: false,
          error: 'Exception not found'
        };
      }

      // Delete the exception
      await exception.destroy();

      return {
        success: true,
        message: 'Exception deleted successfully'
      };

    } catch (error) {
      console.error('Error deleting booking exception:', error);
      return {
        success: false,
        error: 'Failed to delete booking exception'
      };
    }
  }

  /**
   * Validate booking request
   */
  private validateBookingRequest(request: CreateBookingRequest): string | null {
    if (!request.resourceId || !request.title || !request.startTime || !request.endTime) {
      return 'Missing required fields: resourceId, title, startTime, endTime';
    }

    const startTime = new Date(request.startTime);
    const endTime = new Date(request.endTime);

    if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
      return 'Invalid date format for startTime or endTime';
    }

    if (startTime >= endTime) {
      return 'startTime must be before endTime';
    }

    if (startTime < new Date()) {
      return 'Cannot create bookings in the past';
    }

    // Validate recurrence rule if provided
    if (request.recurrenceRule && !this.recurrenceService.validateRRule(request.recurrenceRule)) {
      return 'Invalid recurrence rule format';
    }

    return null;
  }


}