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
      const rule = rrulestr(rruleString);
      const duration = endTime.getTime() - startTime.getTime();
      
      // Generate occurrences within the range
      const occurrences = rule.between(rangeStart, rangeEnd, true);
      
      return occurrences.map(occurrence => ({
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
   * Check if a specific date is part of a recurring series
   */
  isDateInSeries(
    rruleString: string,
    startTime: Date,
    targetDate: Date
  ): boolean {
    try {
      const rule = rrulestr(rruleString);
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
      const rule = rrulestr(rruleString);
      const duration = endTime.getTime() - startTime.getTime();
      
      const occurrences = rule.after(fromDate, false);
      const nextOccurrences: Date[] = [];
      
      let current = occurrences;
      while (nextOccurrences.length < count && current) {
        nextOccurrences.push(current);
        current = rule.after(current, false);
      }
      
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
      const rule = rrulestr(rruleString);
      
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