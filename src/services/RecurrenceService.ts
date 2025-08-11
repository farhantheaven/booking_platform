import { RRule, rrulestr } from 'rrule';
import { RecurrencePattern, TimeSlot } from '../types';

export class RecurrenceService {
  /**
   * Parse RRULE string and generate occurrences within a date range
   */
  generateOccurrences(
    rruleString: string,
    startTime: Date,
    endTime: Date,
    rangeStart: Date,
    rangeEnd: Date
  ): TimeSlot[] {
    try {
      // Parse the RRule and ensure it has the start date
      let rule = rrulestr(rruleString);
      
      // If the rule doesn't have a dtstart, we need to create a new one with the startTime
      if (!rule.origOptions.dtstart) {
        const options = { ...rule.origOptions, dtstart: startTime };
        rule = new RRule(options);
      }
      
      const duration = endTime.getTime() - startTime.getTime();
      
      // Calculate proper range to ensure we don't miss occurrences
      const { adjustedRangeStart, adjustedRangeEnd } = this.calculateOccurrenceRange(
        startTime, endTime, rangeStart, rangeEnd
      );
      
      // Generate occurrences within the adjusted range
      const occurrences = rule.between(adjustedRangeStart, adjustedRangeEnd, true);
      
      // Filter occurrences to ensure they fall within the actual requested range
      const filteredOccurrences = occurrences.filter(occurrence => 
        occurrence >= rangeStart && occurrence <= rangeEnd
      );
      
      return filteredOccurrences.map(occurrence => ({
        start: occurrence,
        end: new Date(occurrence.getTime() + duration)
      }));
    } catch (error) {
      console.error('Error parsing RRULE:', error);
      throw new Error(`Invalid recurrence rule: ${rruleString}`);
    }
  }

  /**
   * Create RRULE string from pattern object
   */
  createRRule(pattern: RecurrencePattern, startDate: Date): string {
    const options: any = {
      freq: this.getFrequency(pattern.frequency),
      interval: pattern.interval || 1,
      dtstart: startDate,
    };

    if (pattern.byWeekDay && pattern.byWeekDay.length > 0) {
      options.byweekday = pattern.byWeekDay.map(day => this.getWeekday(day));
    }

    if (pattern.byMonthDay && pattern.byMonthDay.length > 0) {
      options.bymonthday = pattern.byMonthDay;
    }

    if (pattern.count) {
      options.count = pattern.count;
    }

    if (pattern.until) {
      options.until = pattern.until;
    }

    const rule = new RRule(options);
    return rule.toString();
  }

  /**
   * Validate RRULE string
   */
  validateRRule(rruleString: string): boolean {
    try {
      rrulestr(rruleString);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Calculate the proper range for occurrence generation
   * This ensures we don't miss the first occurrence due to time precision issues
   */
  calculateOccurrenceRange(
    startTime: Date,
    endTime: Date,
    rangeStart: Date,
    rangeEnd: Date
  ): { adjustedRangeStart: Date; adjustedRangeEnd: Date } {
    // Ensure rangeStart is at the beginning of the day to catch all occurrences
    const adjustedRangeStart = new Date(rangeStart);
    adjustedRangeStart.setHours(0, 0, 0, 0);
    
    // Ensure rangeEnd is at the end of the day to catch all occurrences
    const adjustedRangeEnd = new Date(rangeEnd);
    adjustedRangeEnd.setHours(23, 59, 59, 999);
    
    return { adjustedRangeStart, adjustedRangeEnd };
  }

  /**
   * Debug method to test RRule behavior
   * This helps troubleshoot occurrence generation issues
   */
  debugRRuleBehavior(
    rruleString: string,
    startTime: Date,
    endTime: Date,
    rangeStart: Date,
    rangeEnd: Date
  ): any {
    try {
      const rule = rrulestr(rruleString);
      const { adjustedRangeStart, adjustedRangeEnd } = this.calculateOccurrenceRange(
        startTime, endTime, rangeStart, rangeEnd
      );
      
      // Test different range approaches
      const occurrencesWithOriginalRange = rule.between(rangeStart, rangeEnd, true);
      const occurrencesWithAdjustedRange = rule.between(adjustedRangeStart, adjustedRangeEnd, true);
      
      return {
        rruleString,
        originalRange: {
          start: rangeStart.toISOString(),
          end: rangeEnd.toISOString()
        },
        adjustedRange: {
          start: adjustedRangeStart.toISOString(),
          end: adjustedRangeEnd.toISOString()
        },
        occurrencesWithOriginalRange: occurrencesWithOriginalRange.map(o => o.toISOString()),
        occurrencesWithAdjustedRange: occurrencesWithAdjustedRange.map(o => o.toISOString()),
        countWithOriginalRange: occurrencesWithOriginalRange.length,
        countWithAdjustedRange: occurrencesWithAdjustedRange.length
      };
    } catch (error) {
      return { error: error instanceof Error ? error.message : String(error) };
    }
  }

  /**
   * Check if a specific date is part of a recurring series
   */
  isDateInSeries(
    rruleString: string,
    startTime: Date,
    targetDate: Date
  ): boolean {
    try {
      // Parse the RRule and ensure it has the start date
      let rule = rrulestr(rruleString);
      
      // If the rule doesn't have a dtstart, we need to create a new one with the startTime
      if (!rule.origOptions.dtstart) {
        const options = { ...rule.origOptions, dtstart: startTime };
        rule = new RRule(options);
      }
      
      const occurrences = rule.between(
        new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate()),
        new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate() + 1),
        true
      );
      
      return occurrences.length > 0;
    } catch {
      return false;
    }
  }

  /**
   * Get the next N occurrences from a given date
   */
  getNextOccurrences(
    rruleString: string,
    startTime: Date,
    endTime: Date,
    fromDate: Date,
    count: number = 5
  ): TimeSlot[] {
    try {
      // Parse the RRule and ensure it has the start date
      let rule = rrulestr(rruleString);
      
      // If the rule doesn't have a dtstart, we need to create a new one with the startTime
      if (!rule.origOptions.dtstart) {
        const options = { ...rule.origOptions, dtstart: startTime };
        rule = new RRule(options);
      }
      
      const duration = endTime.getTime() - startTime.getTime();
      
      // Use between method to get occurrences in a range starting from after the fromDate
      // This ensures we get occurrences strictly after the fromDate
      const rangeEnd = new Date(fromDate.getTime() + (365 * 24 * 60 * 60 * 1000)); // 1 year later
      const allOccurrences = rule.between(fromDate, rangeEnd, true);
      
      // Filter to get only occurrences strictly after the fromDate and limit to count
      // We need to exclude the entire day of fromDate, so we check if the occurrence date is different
      const nextOccurrences = allOccurrences
        .filter(occurrence => {
          const occurrenceDate = new Date(occurrence.getFullYear(), occurrence.getMonth(), occurrence.getDate());
          const fromDateOnly = new Date(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate());
          return occurrenceDate > fromDateOnly;
        })
        .slice(0, count);
      
      return nextOccurrences.map(occurrence => ({
        start: occurrence,
        end: new Date(occurrence.getTime() + duration)
      }));
    } catch (error) {
      console.error('Error getting next occurrences:', error);
      return [];
    }
  }

  /**
   * Calculate end date for finite recurrence series
   */
  calculateSeriesEndDate(rruleString: string, startDate: Date): Date | null {
    try {
      // Parse the RRule and ensure it has the start date
      let rule = rrulestr(rruleString);
      
      // If the rule doesn't have a dtstart, we need to create a new one with the startDate
      if (!rule.origOptions.dtstart) {
        const options = { ...rule.origOptions, dtstart: startDate };
        rule = new RRule(options);
      }
      
      // If the rule has an until date, return it
      if (rule.options.until) {
        return rule.options.until;
      }
      
      // If the rule has a count, calculate the last occurrence
      if (rule.options.count) {
        const allOccurrences = rule.all();
        return allOccurrences[allOccurrences.length - 1] || null;
      }
      
      // Infinite recurrence
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Convert frequency string to RRule frequency constant
   */
  private getFrequency(frequency: string): number {
    switch (frequency.toUpperCase()) {
      case 'DAILY':
        return RRule.DAILY;
      case 'WEEKLY':
        return RRule.WEEKLY;
      case 'MONTHLY':
        return RRule.MONTHLY;
      case 'YEARLY':
        return RRule.YEARLY;
      default:
        throw new Error(`Unsupported frequency: ${frequency}`);
    }
  }

  /**
   * Convert weekday string to RRule weekday constant
   */
  private getWeekday(day: string): number {
    switch (day.toUpperCase()) {
      case 'MO':
        return RRule.MO as unknown as number;
      case 'TU':
        return RRule.TU as unknown as number;
      case 'WE':
        return RRule.WE as unknown as number;
      case 'TH':
        return RRule.TH as unknown as number;
      case 'FR':
        return RRule.FR as unknown as number;
      case 'SA':
        return RRule.SA as unknown as number;
      case 'SU':
        return RRule.SU as unknown as number;
      default:
        throw new Error(`Unsupported weekday: ${day}`);
    }
  }

  /**
   * Generate human-readable description of recurrence rule
   */
  getHumanReadableDescription(rruleString: string): string {
    try {
      const rule = rrulestr(rruleString);
      return rule.toText();
    } catch {
      return 'Invalid recurrence rule';
    }
  }

  /**
   * Optimize RRULE for database storage
   * Remove unnecessary parts and normalize format
   */
  normalizeRRule(rruleString: string): string {
    try {
      const rule = rrulestr(rruleString);
      return rule.toString();
    } catch {
      throw new Error(`Cannot normalize invalid RRULE: ${rruleString}`);
    }
  }
}