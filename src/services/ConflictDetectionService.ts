import { addDays, addMonths } from 'date-fns';
import { Op } from 'sequelize';
import { DatabaseConnection } from '../config/database';
import { Booking, BookingException } from '../models';
import { ConflictingBooking, TimeSlot } from '../types';
import { RecurrenceService } from './RecurrenceService';

export class ConflictDetectionService {
  constructor(
    private db: DatabaseConnection,
    private recurrenceService: RecurrenceService
  ) {}

  /**
   * Main method to detect conflicts for a booking request
   */
  async detectConflicts(
    resourceId: string,
    startTime: Date,
    endTime: Date,
    recurrenceRule?: string
  ): Promise<ConflictingBooking[]> {
    try {
      let conflicts: ConflictingBooking[] = [];

      // First check for duplicate recurring bookings
      if (recurrenceRule) {
        const duplicateCheck = await this.checkForDuplicateRecurringBooking(
          resourceId,
          startTime,
          endTime,
          recurrenceRule
        );
        if (duplicateCheck.length > 0) {
          return duplicateCheck; // Already enhanced with local time
        }
      }
      else {
        conflicts = await this.detectSingleConflicts(resourceId, startTime, endTime);
      }

      // Ensure all conflicts have local time information
      const enhancedConflicts = conflicts.map(conflict => {
        // Check if already enhanced
        if ('localTimeInfo' in conflict) {
          return conflict;
        }
        // Enhance if not already done
        return this.enhanceConflictWithLocalTime(conflict);
      });

      return this.deduplicateConflicts(enhancedConflicts);
    } catch (error) {
      console.error('Error detecting conflicts:', error);
      return [];
    }
  }

  /**
   * Detect conflicts for a single booking request
   */
  private async detectSingleConflicts(
    resourceId: string,
    startTime: Date,
    endTime: Date
  ): Promise<ConflictingBooking[]> {
    try {
      // Find all potentially conflicting bookings (both single and recurring)
      const bookings = await Booking.findAll({
        where: {
          resource_id: resourceId,
          start_time: { [Op.lt]: endTime },
          end_time: { [Op.gt]: startTime }
        },
        include: [
          {
            model: BookingException,
            as: 'exceptions',
            required: false // LEFT JOIN - include bookings even without exceptions
          }
        ],
        order: [['start_time', 'ASC']]
      });

      const conflicts: ConflictingBooking[] = [];

      for (const booking of bookings) {
        // Check if this specific time slot is cancelled via exception
        const isCancelled = await this.isTimeSlotCancelled(booking, startTime, endTime);
        
        if (isCancelled) {
          // This time slot is cancelled, so it's available for new bookings
          continue;
        }

        if (booking.is_recurring) {
          // For recurring bookings, check if the specific instance conflicts
          const recurringConflicts = await this.checkRecurringBookingConflicts(
            booking,
            startTime,
            endTime
          );
          conflicts.push(...recurringConflicts);
        } else {
          // Direct conflict with single booking
          conflicts.push({
            id: booking.id,
            title: booking.title,
            startTime: booking.start_time,
            endTime: booking.end_time,
            bookingType: 'single',
            message: 'Time slot conflicts with existing single booking'
          });
        }
      }

      // Enhance conflicts with local time information
      return conflicts.map(conflict => this.enhanceConflictWithLocalTime(conflict));
    } catch (error) {
      console.error('Error detecting single conflicts:', error);
      return [];
    }
  }

  /**
   * Detect conflicts for a recurring booking - OPTIMIZED VERSION
   */
  private async detectRecurringConflicts(
    resourceId: string,
    startTime: Date,
    endTime: Date,
    recurrenceRule: string
  ): Promise<ConflictingBooking[]> {
    try {
      // OPTIMIZATION: Use database queries instead of generating all occurrences
      const conflicts = await this.detectRecurringConflictsOptimized(
        resourceId,
        startTime,
        endTime,
        recurrenceRule
      );

      return this.deduplicateConflicts(conflicts);
    } catch (error) {
      console.error('Error detecting recurring conflicts:', error);
      throw new Error('Failed to analyze recurring booking conflicts');
    }
  }

  /**
   * OPTIMIZED: Detect recurring conflicts using database queries
   */
  private async detectRecurringConflictsOptimized(
    resourceId: string,
    startTime: Date,
    endTime: Date,
    recurrenceRule: string
  ): Promise<ConflictingBooking[]> {
    const allConflicts: ConflictingBooking[] = [];

    // OPTIMIZATION: Check for overlapping recurring patterns first (fast database query)
    const overlappingPatterns = await this.findOverlappingRecurringPatterns(
      resourceId,
      startTime,
      endTime,
      recurrenceRule
    );

    if (overlappingPatterns.length > 0) {
      // OPTIMIZATION: Early exit if we find overlapping patterns
      return overlappingPatterns.map(pattern => ({
        id: pattern.id,
        title: pattern.title,
        startTime: pattern.start_time,
        endTime: pattern.end_time,
        bookingType: 'recurring',
        message: 'Overlapping recurring pattern detected'
      }));
    }

    // OPTIMIZATION: Only generate occurrences for conflict checking (limited scope)
    const checkEnd = addMonths(startTime, 3); // Reduced from 24 months to 3 months
    const occurrences = this.recurrenceService.generateOccurrences(
      recurrenceRule,
      startTime,
      endTime,
      startTime,
      checkEnd
    );

    // OPTIMIZATION: Limit occurrences and use batch processing
    const limitedOccurrences = occurrences.slice(0, 50); // Reduced from 100 to 50
    
    // OPTIMIZATION: Batch database queries instead of individual calls
    const conflicts = await this.detectConflictsBatch(
      resourceId,
      limitedOccurrences
    );

    allConflicts.push(...conflicts);

    // OPTIMIZATION: Check for self-conflicts only if needed
    if (occurrences.length > 1) {
      const selfConflicts = this.checkForSelfConflictsOptimized(occurrences);
      allConflicts.push(...selfConflicts);
    }

    return allConflicts;
  }

  /**
   * OPTIMIZED: Find overlapping recurring patterns using database query
   */
  private async findOverlappingRecurringPatterns(
    resourceId: string,
    startTime: Date,
    endTime: Date,
    recurrenceRule: string
  ): Promise<any[]> {
    // OPTIMIZATION: Use a single database query to find potential conflicts
    const overlappingBookings = await Booking.findAll({
      where: {
        resource_id: resourceId,
        is_recurring: true,
        [Op.or]: [
          // Check if existing recurring patterns overlap with requested time
          {
            start_time: { [Op.lt]: endTime },
            end_time: { [Op.gt]: startTime }
          },
          // Check if requested time overlaps with existing patterns
          {
            start_time: { [Op.lte]: startTime },
            end_time: { [Op.gte]: endTime }
          }
        ]
      },
      attributes: ['id', 'title', 'start_time', 'end_time', 'recurrence_rule'],
      limit: 10 // OPTIMIZATION: Limit results for performance
    });

    return overlappingBookings;
  }

  /**
   * OPTIMIZED: Detect conflicts in batch instead of individual calls
   */
  private async detectConflictsBatch(
    resourceId: string,
    occurrences: any[]
  ): Promise<ConflictingBooking[]> {
    if (occurrences.length === 0) return [];

    const minStart = new Date(Math.min(...occurrences.map(o => o.start.getTime())));
    const maxEnd = new Date(Math.max(...occurrences.map(o => o.end.getTime())));

    const existingBookings = await Booking.findAll({
      where: {
        resource_id: resourceId,
        start_time: { [Op.lt]: maxEnd },
        end_time: { [Op.gt]: minStart }
      },
      include: [
        {
          model: BookingException,
          as: 'exceptions',
          required: false
        }
      ],
      attributes: ['id', 'title', 'start_time', 'end_time', 'is_recurring'],
      limit: 100 // Limit results
    });

    const conflicts: ConflictingBooking[] = [];

    for (const occurrence of occurrences) {
      for (const booking of existingBookings) {
        // Check if this specific occurrence is cancelled via exception
        const isCancelled = await this.isTimeSlotCancelled(booking, occurrence.start, occurrence.end);
        
        if (isCancelled) {
          // This occurrence is cancelled, so it's available for new bookings
          continue;
        }

        if (this.doTimeRangesOverlap(
          occurrence.start, occurrence.end,
          booking.start_time, booking.end_time
        )) {
          conflicts.push({
            id: booking.id,
            title: `${booking.title} (conflicts with occurrence at ${occurrence.start.toISOString()})`,
            startTime: occurrence.start,
            endTime: occurrence.end,
            bookingType: booking.is_recurring ? 'recurring' : 'single',
            message: `Conflicts with ${booking.is_recurring ? 'recurring' : 'single'} booking`
          });
          if (conflicts.length >= 10) break; // Early exit
        }
      }
      if (conflicts.length >= 10) break; // Early exit
    }
    
    // Enhance conflicts with local time information
    return conflicts.map(conflict => this.enhanceConflictWithLocalTime(conflict));
  }

  /**
   * OPTIMIZED: Check for self-conflicts with early exit
   */
  private checkForSelfConflictsOptimized(occurrences: any[]): ConflictingBooking[] {
    const conflicts: ConflictingBooking[] = [];
    
    // OPTIMIZATION: Use early exit and limit iterations
    for (let i = 0; i < Math.min(occurrences.length - 1, 20); i++) {
      for (let j = i + 1; j < Math.min(occurrences.length, i + 21); j++) {
        if (this.doTimeRangesOverlap(
          occurrences[i].start, occurrences[i].end,
          occurrences[j].start, occurrences[j].end
        )) {
          conflicts.push({
            id: 'self-conflict',
            title: 'Recurring pattern creates overlapping instances',
            startTime: occurrences[i].start,
            endTime: occurrences[i].end,
            bookingType: 'recurring',
            message: 'This recurrence rule would create overlapping time slots'
          });
          
          // OPTIMIZATION: Early exit - only need one self-conflict
          return conflicts;
        }
      }
    }
    
    return conflicts;
  }

  /**
   * Check if a recurring booking has instances that conflict with the requested time
   */
  private async checkRecurringBookingConflicts(
    recurringBooking: any,
    requestedStart: Date,
    requestedEnd: Date
  ): Promise<ConflictingBooking[]> {
    if (!recurringBooking.recurrence_rule) {
      return [];
    }

    try {
      // Generate occurrences around the requested time
      const checkStart = addDays(requestedStart, -7); // Look back a week
      const checkEnd = addDays(requestedEnd, 7);      // Look ahead a week

      const occurrences = this.recurrenceService.generateOccurrences(
        recurringBooking.recurrence_rule,
        new Date(recurringBooking.start_time),
        new Date(recurringBooking.end_time),
        checkStart,
        checkEnd
      );

      const conflicts: ConflictingBooking[] = [];

      for (const occurrence of occurrences) {
        // Check if this occurrence overlaps with requested time
        if (this.doTimeRangesOverlap(
          occurrence.start, occurrence.end,
          requestedStart, requestedEnd
        )) {
          // Check if this specific occurrence is cancelled
          const isCancelled = await this.isOccurrenceCancelled(
            recurringBooking.id,
            occurrence.start
          );

          if (!isCancelled) {
            conflicts.push({
              id: recurringBooking.id,
              title: recurringBooking.title,
              startTime: occurrence.start,
              endTime: occurrence.end,
              bookingType: 'recurring'
            });
          }
        }
      }

      return conflicts;
    } catch (error) {
      console.error('Error checking recurring booking conflicts:', error);
      return [];
    }
  }

  /**
   * Check if a specific occurrence of a recurring booking is cancelled using Sequelize
   */
  private async isOccurrenceCancelled(bookingId: string, occurrenceDate: Date): Promise<boolean> {
    try {
      const exception = await BookingException.findOne({
        where: {
          booking_id: bookingId,
          exception_date: this.getUserLocalDateString(occurrenceDate),
          exception_type: 'cancelled'
        }
      });

      return exception !== null;
    } catch (error) {
      console.error('Error checking if occurrence is cancelled:', error);
      return false;
    }
  }

  /**
   * Check if two time ranges overlap
   */
  private doTimeRangesOverlap(
    start1: Date, end1: Date,
    start2: Date, end2: Date
  ): boolean {
    return start1 < end2 && end1 > start2;
  }

  /**
   * Remove duplicate conflicts (same booking appearing multiple times)
   */
  private deduplicateConflicts(conflicts: ConflictingBooking[]): ConflictingBooking[] {
    const seen = new Set<string>();
    return conflicts.filter(conflict => {
      const key = `${conflict.id}-${conflict.startTime.getTime()}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  /**
   * Get detailed conflict information including suggestions
   */
  async getDetailedConflictInfo(
    resourceId: string,
    startTime: Date,
    endTime: Date
  ): Promise<{
    conflicts: ConflictingBooking[];
    totalConflicts: number;
    conflictingSeries: number;
    conflictingInstances: number;
  }> {
    const conflicts = await this.detectSingleConflicts(resourceId, startTime, endTime);
    
    const conflictingSeries = new Set(
      conflicts
        .filter(c => c.bookingType === 'recurring')
        .map(c => c.id)
    ).size;

    const conflictingInstances = conflicts.filter(c => c.bookingType === 'single').length;

    return {
      conflicts,
      totalConflicts: conflicts.length,
      conflictingSeries,
      conflictingInstances
    };
  }

  /**
   * Check resource availability for a specific time slot
   */
  async isTimeSlotAvailable(
    resourceId: string,
    startTime: Date,
    endTime: Date
  ): Promise<boolean> {
    const conflicts = await this.detectSingleConflicts(resourceId, startTime, endTime);
    return conflicts.length === 0;
  }

  /**
   * Bulk check availability for multiple time slots
   */
  async checkMultipleTimeSlots(
    resourceId: string,
    timeSlots: TimeSlot[]
  ): Promise<Map<string, boolean>> {
    const results = new Map<string, boolean>();

    for (const slot of timeSlots) {
      const key = `${slot.start.getTime()}-${slot.end.getTime()}`;
      const isAvailable = await this.isTimeSlotAvailable(resourceId, slot.start, slot.end);
      results.set(key, isAvailable);
    }

    return results;
  }

  /**
   * Check if there's already a recurring booking with identical pattern
   */
  private async checkForDuplicateRecurringBooking(
    resourceId: string,
    startTime: Date,
    endTime: Date,
    recurrenceRule: string
  ): Promise<ConflictingBooking[]> {
    try {
      // Find existing recurring bookings for this resource
      const existingRecurringBookings = await Booking.findAll({
        where: {
          resource_id: resourceId,
          is_recurring: true,
          // [Op.or]: [  
          //   {
          //     start_time: { [Op.lt]: endTime },
          //     end_time: { [Op.gt]: startTime }
          //   },
          //   Sequelize.literal(`(CAST("Booking"."start_time" AS TIME) <= '${endTime.toTimeString().split(' ')[0]}' AND CAST("Booking"."end_time" AS TIME) >= '${startTime.toTimeString().split(' ')[0]}')`)
          // ]
        },
        // include: [
        //   {
        //     model: BookingException,
        //     as: 'exceptions',
        //     required: false,
        //     separate: false
        //   }
        // ]
      });

      // Load exceptions separately for each booking
      for (const booking of existingRecurringBookings) {
        const exceptions = await BookingException.findAll({
          where: {
            booking_id: booking.id,
            exception_date: startTime.toISOString().split('T')[0],
            exception_type: 'cancelled'
          }
        });
        (booking as any).exceptions = exceptions;
        console.log('🔍 Loaded exceptions for booking', booking.id, ':', exceptions.length);
      }

      const conflicts: ConflictingBooking[] = [];

      for (const existingBooking of existingRecurringBookings) {
        console.log('🔍 Processing booking:', existingBooking.id, 'with', (existingBooking as any).exceptions?.length || 0, 'exceptions');
        
        // Filter exceptions for the specific date and type
        const relevantExceptions = (existingBooking as any).exceptions?.filter((exception: any) => 
          (
            (exception.new_start_time && exception.new_end_time && 
             exception.new_start_time <= endTime && exception.new_end_time >= startTime) ||
            (exception.new_start_time === null && exception.new_end_time === null)
          )
        ) || [];

        console.log('🔍 Relevant exceptions found:', relevantExceptions.length);

        // If there are relevant cancelled exceptions for this date, skip this booking
        if (relevantExceptions.length > 0 && !existingBooking.recurrence_rule) {
          console.log('🔍 Skipping booking due to cancelled exceptions');
          continue; // This time slot is cancelled, so it's available for new bookings
        }

        // Check if the time patterns are identical
        const existingStart = new Date(existingBooking.start_time);
        const existingEnd = new Date(existingBooking.end_time);
        
        // Calculate time differences in minutes
        const startTimeDiff = Math.abs(startTime.getTime() - existingStart.getTime()) / (1000 * 60);
        const endTimeDiff = Math.abs(endTime.getTime() - existingEnd.getTime()) / (1000 * 60);
        
        // If times are within 1 minute and recurrence rule is identical, it's a duplicate
        if (startTimeDiff <= 1 && endTimeDiff <= 1 && existingBooking.recurrence_rule === recurrenceRule) {
          conflicts.push({
            id: existingBooking.id,
            title: existingBooking.title,
            startTime: existingStart,
            endTime: existingEnd,
            bookingType: 'recurring',
            message: 'Duplicate recurring booking detected - identical time and recurrence pattern already exists'
          });
        }
        
        if (existingBooking.recurrence_rule && this.wouldRecurringPatternsOverlap(
          startTime, endTime, recurrenceRule,
          existingStart, existingEnd, existingBooking.recurrence_rule
        )) {
          conflicts.push({
            id: existingBooking.id,
            title: existingBooking.title,
            startTime: existingStart,
            endTime: existingEnd,
            bookingType: 'recurring',
            message: 'Overlapping recurring pattern detected - this would create conflicts with existing recurring bookings'
          });
        }
      }

      // Enhance conflicts with local time information
      return conflicts.map(conflict => this.enhanceConflictWithLocalTime(conflict));
    } catch (error) {
      console.error('Error checking for duplicate recurring bookings:', error);
      return [];
    }
  }


  /**
   * Check if two recurring patterns would overlap
   */
  private wouldRecurringPatternsOverlap(
    start1: Date, end1: Date, rule1: string,
    start2: Date, end2: Date, rule2: string
  ): boolean {
    try {
      // Generate occurrences for both patterns for the next 6 months to check for overlaps
      const checkEnd1 = addMonths(new Date(end1), 6);
      const checkEnd2 = addMonths(new Date(end2), 6);

      
      const occurrences1 = this.recurrenceService.generateOccurrences(
        rule1, start1, end1, start1, checkEnd1
      );
      
      const occurrences2 = this.recurrenceService.generateOccurrences(
        rule2, start2, end2, start2, checkEnd2
      );

      // Check if any occurrences overlap
      for (const occ1 of occurrences1.slice(0, 50)) { // Limit for performance
        for (const occ2 of occurrences2.slice(0, 50)) {
          if (this.doTimeRangesOverlap(occ1.start, occ1.end, occ2.start, occ2.end)) {
            return true;
          }
        }
      }
      
      return false;
    } catch (error) {
      console.error('Error checking recurring pattern overlap:', error);
      return false; // Default to no overlap if there's an error
    }
  }

  /**
   * Check if a specific time slot is cancelled via exception
   * This handles both single and recurring bookings
   * ASSUMPTION: requestedStart and requestedEnd are in USER'S timezone
   */
  private async isTimeSlotCancelled(
    booking: any, 
    requestedStart: Date, 
    requestedEnd: Date
  ): Promise<boolean> {
    try {
      const exceptions = await booking.getExceptions();
      
      if (!exceptions || exceptions.length === 0) {
        return false; // No exceptions, booking is active
      }

      // Get the user's local date (assuming requestedStart is in user's timezone)
      const userLocalDate = this.getUserLocalDateString(requestedStart);

      // For single bookings, check if the entire booking is cancelled
      if (!booking.is_recurring) {
        const cancelledException = exceptions.find(
          (exception: any) => 
            exception.exception_type === 'cancelled' &&
            this.compareUserTimezoneDates(exception.exception_date, userLocalDate)
        );
        return cancelledException !== undefined;
      }

      // For recurring bookings, check if this specific occurrence is cancelled
      const cancelledException = exceptions.find(
        (exception: any) => 
          exception.exception_type === 'cancelled' &&
          this.compareUserTimezoneDates(exception.exception_date, userLocalDate)
        );

      return cancelledException !== undefined;
    } catch (error) {
      console.error('Error checking if time slot is cancelled:', error);
      return false; // Default to not cancelled if there's an error
    }
  }

  /**
   * Get user's local date string (assuming input dates are in user's timezone)
   * This is the key method for user-timezone-centric date handling
   */
  private getUserLocalDateString(date: Date): string {
    // Since the input date is already in user's timezone, we can extract directly
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Compare dates assuming the first date is in user's timezone
   * This handles both Date objects and strings safely
   */
  private compareUserTimezoneDates(date1: any, userLocalDate: string): boolean {
    if (date1 instanceof Date) {
      // If date1 is a Date object, convert it to user's timezone for comparison
      return this.getUserLocalDateString(date1) === userLocalDate;
    }
    
    // If date1 is a string, extract just the date part
    if (typeof date1 === 'string') {
      const date1Str = date1.split('T')[0];
      return date1Str === userLocalDate;
    }
    
    return false;
  }

  /**
   * Enhanced conflict object with local time information
   */
  private enhanceConflictWithLocalTime(conflict: ConflictingBooking): ConflictingBooking & {
    localTimeInfo: {
      startTime: {
        localDate: string;
        localTime: string;
        localDateTime: string;
        utcDateTime: string;
      };
      endTime: {
        localDate: string;
        localTime: string;
        localDateTime: string;
        utcDateTime: string;
      };
    };
  } {
    const startTimeInfo = this.convertUTCToUserLocal(conflict.startTime);
    const endTimeInfo = this.convertUTCToUserLocal(conflict.endTime);
    
    return {
      ...conflict,
      localTimeInfo: {
        startTime: startTimeInfo,
        endTime: endTimeInfo
      }
    };
  }

  /**
   * PRACTICAL EXAMPLE: How user-timezone-centric booking works
   * This method demonstrates the complete flow from user input to database storage
   */
  public demonstrateUserTimezoneFlow(userInput: string): {
    userInput: string;
    userLocalDate: string;
    utcDate: Date;
    databaseStorage: string;
    userDisplay: string;
    explanation: string;
  } {
    // 1. User sends date in their timezone (e.g., "2025-08-12T21:00:00")
    const userDate = new Date(userInput);
    
    // 2. Extract user's local date for business logic
    const userLocalDate = this.getUserLocalDateString(userDate);
    
    // 3. Convert to UTC for database storage
    const utcDate = this.convertUserTimezoneToUTC(userDate);
    
    // 4. What gets stored in database
    const databaseStorage = utcDate.toISOString();
    
    // 5. What user sees (converted back to their timezone)
    const userDisplay = this.getDisplayTimeFromUTC(utcDate);
    
    // 6. Explanation of the flow
    const explanation = `
      User Input: ${userInput} (assumed to be in user's timezone)
      Local Date: ${userLocalDate} (extracted for business logic)
      UTC Storage: ${databaseStorage} (stored in database)
      User Display: ${userDisplay.localDateTime} (shown to user)
      
      This approach ensures:
      - User sends dates in their timezone (intuitive)
      - Database stores in UTC (consistent)
      - Business logic uses user timezone dates (accurate)
      - Frontend displays in user timezone (user-friendly)
    `;
    
    return {
      userInput,
      userLocalDate,
      utcDate,
      databaseStorage,
      userDisplay: userDisplay.localDateTime,
      explanation
    };
  }

  /**
   * Convert UTC date to user's local timezone for display
   * This provides user-friendly time information in conflicts
   */
  public convertUTCToUserLocal(utcDate: Date): {
    localDate: string;
    localTime: string;
    localDateTime: string;
    utcDateTime: string;
    timezone: string;
  } {
    try {

      const userTimezoneOffset = utcDate.getTimezoneOffset();
      const serverTimezoneOffset = new Date().getTimezoneOffset();
      if (userTimezoneOffset === serverTimezoneOffset) {
        return {
          localDate: utcDate.toLocaleDateString('en-US'),
          localTime: utcDate.toLocaleTimeString('en-US'),
          localDateTime: utcDate.toLocaleString('en-US'),
          utcDateTime: utcDate.toISOString(),
          timezone: 'UTC'
        };
      }
      // Since we're storing in UTC, we need to convert to user's local time
      // For now, we'll assume the user is in the same timezone as the server
      // In a real application, you'd get the user's timezone from their profile
      
      // Get the current timezone offset (this will be the server's timezone)
      
      
      // Convert UTC to server's local time (which should match user's timezone)
      const localDate = new Date(utcDate.getTime() - (serverTimezoneOffset * 60000));
      
      // Format for display
      const localDateStr = localDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
      
      const localTimeStr = localDate.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
      
      const localDateTimeStr = localDate.toLocaleString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
      
      const utcDateTimeStr = utcDate.toISOString();
      
      return {
        localDate: localDateStr,
        localTime: localTimeStr,
        localDateTime: localDateTimeStr,
        utcDateTime: utcDateTimeStr,
        timezone: 'Asia/Kolkata' // Default to IST timezone
      };
    } catch (error) {
      console.error('Error converting UTC to user local time:', error);
      // Fallback to UTC if conversion fails
      return {
        localDate: utcDate.toLocaleDateString('en-US'),
        localTime: utcDate.toLocaleTimeString('en-US'),
        localDateTime: utcDate.toLocaleString('en-US'),
        utcDateTime: utcDate.toISOString(),
        timezone: 'UTC' // Fallback to UTC timezone
      };
    }
  }

  /**
   * Convert user timezone date to UTC for storage
   * This ensures we store the correct UTC time
   */
  private convertUserTimezoneToUTC(userDate: Date): Date {
    try {
      // If the date has timezone information (like +05:30), JavaScript will handle conversion
      // If it's a local time without timezone, we need to convert it to UTC
      
      // Create a new Date object - JavaScript will automatically handle timezone conversion
      const utcDate = new Date(userDate);
      
      // Return the UTC equivalent
      return utcDate;
    } catch (error) {
      console.error('Error converting user timezone to UTC:', error);
      return userDate; // Fallback to original date
    }
  }

  /**
   * Get user-friendly time display from UTC date
   * This method properly converts UTC to user's expected timezone
   */
  private getDisplayTimeFromUTC(utcDate: Date, userTimezone?: string): {
    localDate: string;
    localTime: string;
    localDateTime: string;
    utcDateTime: string;
    timezone: string;
  } {
    try {
      // For now, we'll use the server's timezone as a proxy for user's timezone
      // In production, you'd get the user's timezone from their profile
      const timezone = userTimezone || 'Asia/Kolkata'; // Default to IST
      
      // Convert UTC to the specified timezone
      const localDate = new Date(utcDate.toLocaleString('en-US', { timeZone: timezone }));
      
      // Format for display
      const localDateStr = localDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
      
      const localTimeStr = localDate.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
        timeZone: timezone
      });
      
      const localDateTimeStr = localDate.toLocaleString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
        timeZone: timezone
      });
      
      const utcDateTimeStr = utcDate.toISOString();
      
      return {
        localDate: localDateStr,
        localTime: localTimeStr,
        localDateTime: localDateTimeStr,
        utcDateTime: utcDateTimeStr,
        timezone: timezone
      };
    } catch (error) {
      console.error('Error getting display time from UTC:', error);
      // Fallback to server timezone
      return this.convertUTCToUserLocal(utcDate);
    }
  }
}