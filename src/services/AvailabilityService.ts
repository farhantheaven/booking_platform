import {
  addDays,
  addMinutes,
  eachDayOfInterval,
  format,
  isWeekend,
  setHours,
  setMinutes
} from 'date-fns';
import { Op } from 'sequelize';
import { DatabaseConnection } from '../config/database';
import { Booking, Resource } from '../models';
import {
  AvailabilityRequest,
  AvailabilityResponse,
  AvailableSlot,
  TimeSlot
} from '../types';
import { ConflictDetectionService } from './ConflictDetectionService';
import { RecurrenceService } from './RecurrenceService';

export class AvailabilityService {
  constructor(
    private db: DatabaseConnection,
    private conflictService: ConflictDetectionService,
    private recurrenceService: RecurrenceService,
    private conflictDetectionService: ConflictDetectionService
  ) {}

  /**
   * Get available time slots for a resource in a date range
   */
  async getAvailability(request: AvailabilityRequest): Promise<AvailabilityResponse> {
    try {
      const startDate = new Date(request.startDate);
      const endDate = new Date(request.endDate);
      const duration = request.duration || 60; // Default 60 minutes

      // Validate input
      if (startDate >= endDate) {
        return {
          success: false,
          resourceId: request.resourceId,
          requestedRange: { startDate, endDate },
          availableSlots: [],
          totalSlots: 0,
          error: 'Start date must be before end date'
        };
      }

      // Generate potential time slots
      const potentialSlots = this.generateTimeSlots(startDate, endDate, duration);
      
      // Filter out conflicting slots
      const availableSlots: AvailableSlot[] = [];
      
      for (const slot of potentialSlots) {
        const isAvailable = await this.conflictService.isTimeSlotAvailable(
          request.resourceId,
          slot.start,
          slot.end
        );
        
        if (isAvailable) {
          availableSlots.push({
            startTime: slot.start,
            endTime: slot.end,
            duration
          });
        }
      }

      return {
        success: true,
        resourceId: request.resourceId,
        requestedRange: { startDate, endDate },
        availableSlots,
        totalSlots: availableSlots.length
      };

    } catch (error) {
      console.error('Error getting availability:', error);
      return {
        success: false,
        resourceId: request.resourceId,
        requestedRange: { 
          startDate: new Date(request.startDate), 
          endDate: new Date(request.endDate) 
        },
        availableSlots: [],
        totalSlots: 0,
        error: 'Internal server error while checking availability'
      };
    }
  }

  /**
   * Find next available time slots after a conflict
   */
  async findNextAvailableSlots(
    resourceId: string,
    preferredStart: Date,
    preferredEnd: Date,
    count: number = 3
  ): Promise<AvailableSlot[]> {
    const duration = preferredEnd.getTime() - preferredStart.getTime();
    const suggestions: AvailableSlot[] = [];
    
    // Look for slots starting from the preferred time
    let searchStart = preferredStart;
    const maxSearchDays = 14; // Search up to 2 weeks ahead
    const searchEnd = addDays(preferredStart, maxSearchDays);

    // Generate time slots in 30-minute increments
    while (searchStart < searchEnd && suggestions.length < count) {
      const slotEnd = new Date(searchStart.getTime() + duration);
      
      // Only check slots within business hours (9 AM to 5 PM)
      if (this.isWithinBusinessHours(searchStart, slotEnd)) {
        const isAvailable = await this.conflictService.isTimeSlotAvailable(
          resourceId,
          searchStart,
          slotEnd
        );

        if (isAvailable) {
          suggestions.push({
            startTime: new Date(this.conflictDetectionService.convertUTCToUserLocal(searchStart).localDateTime),
            endTime: new Date(this.conflictDetectionService.convertUTCToUserLocal(slotEnd).localDateTime),
            duration: Math.floor(duration / (1000 * 60)) // Convert to minutes
          });
        }
      }

      // Move to next 30-minute slot
      searchStart = addMinutes(searchStart, 30);
      
      // Skip weekends (Saturday and Sunday)
      if (isWeekend(searchStart)) {
        searchStart = this.getNextBusinessDay(searchStart);
      }
    }

    return suggestions;
  }

  /**
   * Generate time slots for business hours
   */
  private generateTimeSlots(
    startDate: Date, 
    endDate: Date, 
    durationMinutes: number
  ): TimeSlot[] {
    const slots: TimeSlot[] = [];
    const days = eachDayOfInterval({ start: startDate, end: endDate });

    for (const day of days) {
      // Skip weekends
      if (isWeekend(day)) {
        continue;
      }

      // Generate slots from 9 AM to 5 PM
      const businessStart = setMinutes(setHours(day, 9), 0);
      const businessEnd = setMinutes(setHours(day, 17), 0);

      let slotStart = businessStart;
      
      while (slotStart < businessEnd) {
        const slotEnd = addMinutes(slotStart, durationMinutes);
        
        // Ensure slot doesn't exceed business hours
        if (slotEnd <= businessEnd) {
          slots.push({
            start: new Date(slotStart),
            end: new Date(slotEnd)
          });
        }
        
        // Move to next slot (30-minute increments)
        slotStart = addMinutes(slotStart, 30);
      }
    }

    return slots;
  }

  /**
   * Check if a time slot is within business hours
   */
  private isWithinBusinessHours(startTime: Date, endTime: Date): boolean {
    const startHour = startTime.getHours();
    const endHour = endTime.getHours();
    const endMinutes = endTime.getMinutes();

    // Business hours: 9 AM to 5 PM, Monday to Friday
    const isWeekday = !isWeekend(startTime);
    const startsAfter9AM = startHour >= 9;
    const endsBefore5PM = endHour < 17 || (endHour === 17 && endMinutes === 0);

    return isWeekday && startsAfter9AM && endsBefore5PM;
  }

  /**
   * Get the next business day (skip weekends)
   */
  private getNextBusinessDay(date: Date): Date {
    let nextDay = addDays(date, 1);
    while (isWeekend(nextDay)) {
      nextDay = addDays(nextDay, 1);
    }
    return setMinutes(setHours(nextDay, 9), 0); // Start at 9 AM
  }

  /**
   * Get availability summary for a resource
   */
  async getAvailabilitySummary(
    resourceId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    totalBusinessHours: number;
    bookedHours: number;
    availableHours: number;
    utilizationRate: number;
    busyDays: string[];
    availableDays: string[];
  }> {
    // Calculate total business hours in the period
    const businessDays = eachDayOfInterval({ start: startDate, end: endDate })
      .filter(day => !isWeekend(day));
    
    const totalBusinessHours = businessDays.length * 8; // 8 hours per business day

    // Get all bookings for the resource in this period using Sequelize
    const bookings = await Booking.findAll({
      where: {
        resource_id: resourceId,
        start_time: { [Op.lte]: endDate },
        end_time: { [Op.gte]: startDate }
      },
      attributes: ['start_time', 'end_time', 'is_recurring', 'recurrence_rule']
    });
    
    let bookedMinutes = 0;
    const busyDays = new Set<string>();

    for (const booking of bookings) {
      if (booking.is_recurring && booking.recurrence_rule) {
        // Handle recurring bookings
        const occurrences = this.recurrenceService.generateOccurrences(
          booking.recurrence_rule,
          booking.start_time,
          booking.end_time,
          startDate,
          endDate
        );

        for (const occurrence of occurrences) {
          const duration = occurrence.end.getTime() - occurrence.start.getTime();
          bookedMinutes += duration / (1000 * 60);
          busyDays.add(format(occurrence.start, 'yyyy-MM-dd'));
        }
      } else {
        // Handle single bookings
        const duration = booking.end_time.getTime() - booking.start_time.getTime();
        bookedMinutes += duration / (1000 * 60);
        busyDays.add(format(booking.start_time, 'yyyy-MM-dd'));
      }
    }

    const bookedHours = bookedMinutes / 60;
    const availableHours = totalBusinessHours - bookedHours;
    const utilizationRate = totalBusinessHours > 0 ? (bookedHours / totalBusinessHours) * 100 : 0;

    const availableDays = businessDays
      .filter(day => !busyDays.has(format(day, 'yyyy-MM-dd')))
      .map(day => format(day, 'yyyy-MM-dd'));

    return {
      totalBusinessHours,
      bookedHours: Math.max(0, bookedHours),
      availableHours: Math.max(0, availableHours),
      utilizationRate: Math.min(100, Math.max(0, utilizationRate)),
      busyDays: Array.from(busyDays),
      availableDays
    };
  }

  /**
   * Find optimal meeting time for multiple resources
   */
  async findOptimalMeetingTime(
    resourceIds: string[],
    duration: number,
    preferredStart: Date,
    preferredEnd: Date
  ): Promise<AvailableSlot[]> {
    const potentialSlots = this.generateTimeSlots(preferredStart, preferredEnd, duration);
    const commonAvailableSlots: AvailableSlot[] = [];

    for (const slot of potentialSlots) {
      let allResourcesAvailable = true;

      for (const resourceId of resourceIds) {
        const isAvailable = await this.conflictService.isTimeSlotAvailable(
          resourceId,
          slot.start,
          slot.end
        );

        if (!isAvailable) {
          allResourcesAvailable = false;
          break;
        }
      }

      if (allResourcesAvailable) {
        commonAvailableSlots.push({
          startTime: slot.start,
          endTime: slot.end,
          duration
        });
      }
    }

    return commonAvailableSlots.slice(0, 10); // Return top 10 options
  }

  /**
   * Check if resource exists using Sequelize
   */
  async resourceExists(resourceId: string): Promise<boolean> {
    const resource = await Resource.findByPk(resourceId);
    return resource !== null;
  }
}