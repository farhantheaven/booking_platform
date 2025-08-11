import { RecurrenceService } from '../../src/services/RecurrenceService';

describe('RecurrenceService', () => {
  let recurrenceService: RecurrenceService;

  beforeEach(() => {
    recurrenceService = new RecurrenceService();
  });

  describe('generateOccurrences', () => {
    it('should generate daily occurrences correctly', () => {
      const rrule = 'FREQ=DAILY;COUNT=5';
      const startTime = new Date('2025-01-15T09:00:00Z');
      const endTime = new Date('2025-01-15T10:00:00Z');
      const rangeStart = new Date('2025-01-15T00:00:00Z');
      const rangeEnd = new Date('2025-01-20T23:59:59Z');

      const occurrences = recurrenceService.generateOccurrences(
        rrule,
        startTime,
        endTime,
        rangeStart,
        rangeEnd
      );

      expect(occurrences).toHaveLength(5);
      expect(occurrences[0].start).toEqual(startTime);
      expect(occurrences[1].start).toEqual(new Date('2025-01-16T09:00:00Z'));
      expect(occurrences[4].start).toEqual(new Date('2025-01-19T09:00:00Z'));

      // Check duration is preserved
      occurrences.forEach(occurrence => {
        const duration = occurrence.end.getTime() - occurrence.start.getTime();
        expect(duration).toBe(60 * 60 * 1000); // 1 hour
      });
    });

    it('should generate weekly occurrences for weekdays only', () => {
      const rrule = 'FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR;COUNT=10';
      const startTime = new Date('2025-01-13T09:00:00Z'); // Monday
      const endTime = new Date('2025-01-13T10:00:00Z');
      const rangeStart = new Date('2025-01-13T00:00:00Z');
      const rangeEnd = new Date('2025-01-27T23:59:59Z');

      const occurrences = recurrenceService.generateOccurrences(
        rrule,
        startTime,
        endTime,
        rangeStart,
        rangeEnd
      );

      expect(occurrences).toHaveLength(10);
      
      // Check that all occurrences are on weekdays
      occurrences.forEach(occurrence => {
        const dayOfWeek = occurrence.start.getDay();
        expect(dayOfWeek).toBeGreaterThanOrEqual(1); // Monday
        expect(dayOfWeek).toBeLessThanOrEqual(5);    // Friday
      });
    });

    it('should generate monthly occurrences', () => {
      const rrule = 'FREQ=MONTHLY;BYMONTHDAY=15;COUNT=3';
      const startTime = new Date('2025-01-15T14:00:00Z');
      const endTime = new Date('2025-01-15T15:00:00Z');
      const rangeStart = new Date('2025-01-01T00:00:00Z');
      const rangeEnd = new Date('2025-04-30T23:59:59Z');

      const occurrences = recurrenceService.generateOccurrences(
        rrule,
        startTime,
        endTime,
        rangeStart,
        rangeEnd
      );

      expect(occurrences).toHaveLength(3);
      expect(occurrences[0].start.getDate()).toBe(15); // January 15
      expect(occurrences[1].start.getDate()).toBe(15); // February 15
      expect(occurrences[2].start.getDate()).toBe(15); // March 15
    });

    it('should handle empty results when no occurrences in range', () => {
      const rrule = 'FREQ=DAILY;COUNT=5';
      const startTime = new Date('2025-01-15T09:00:00Z');
      const endTime = new Date('2025-01-15T10:00:00Z');
      const rangeStart = new Date('2025-02-01T00:00:00Z'); // After all occurrences
      const rangeEnd = new Date('2025-02-28T23:59:59Z');

      const occurrences = recurrenceService.generateOccurrences(
        rrule,
        startTime,
        endTime,
        rangeStart,
        rangeEnd
      );

      expect(occurrences).toHaveLength(0);
    });

    it('should throw error for invalid RRULE', () => {
      const invalidRrule = 'INVALID_RRULE';
      const startTime = new Date('2025-01-15T09:00:00Z');
      const endTime = new Date('2025-01-15T10:00:00Z');
      const rangeStart = new Date('2025-01-15T00:00:00Z');
      const rangeEnd = new Date('2025-01-20T23:59:59Z');

      expect(() => {
        recurrenceService.generateOccurrences(
          invalidRrule,
          startTime,
          endTime,
          rangeStart,
          rangeEnd
        );
      }).toThrow('Invalid recurrence rule');
    });
  });

  describe('validateRRule', () => {
    it('should validate correct RRULE strings', () => {
      const validRules = [
        'FREQ=DAILY;COUNT=5',
        'FREQ=WEEKLY;BYDAY=MO,WE,FR;COUNT=10',
        'FREQ=MONTHLY;BYMONTHDAY=1;UNTIL=20251231T235959Z',
        'FREQ=YEARLY;BYMONTH=12;BYMONTHDAY=25'
      ];

      validRules.forEach(rule => {
        expect(recurrenceService.validateRRule(rule)).toBe(true);
      });
    });

    it('should reject invalid RRULE strings', () => {
      const invalidRules = [
        'INVALID_RULE',
        'FREQ=INVALID',
        'FREQ=DAILY;INVALID_PARAM=VALUE',
        '',
        'FREQ=WEEKLY;BYDAY=INVALID_DAY'
      ];

      invalidRules.forEach(rule => {
        expect(recurrenceService.validateRRule(rule)).toBe(false);
      });
    });
  });

  describe('isDateInSeries', () => {
    it('should correctly identify dates in a daily series', () => {
      const rrule = 'FREQ=DAILY;COUNT=7';
      const startTime = new Date('2025-01-15T09:00:00Z');
      
      // Test dates within the series
      expect(recurrenceService.isDateInSeries(rrule, startTime, new Date('2025-01-15T00:00:00Z'))).toBe(true);
      expect(recurrenceService.isDateInSeries(rrule, startTime, new Date('2025-01-16T00:00:00Z'))).toBe(true);
      expect(recurrenceService.isDateInSeries(rrule, startTime, new Date('2025-01-21T00:00:00Z'))).toBe(true);
      
      // Test date outside the series
      expect(recurrenceService.isDateInSeries(rrule, startTime, new Date('2025-01-22T00:00:00Z'))).toBe(false);
    });

    it('should correctly identify dates in a weekly series', () => {
      const rrule = 'FREQ=WEEKLY;BYDAY=MO,WE,FR;COUNT=6'; // 6 occurrences over 2 weeks
      const startTime = new Date('2025-01-13T09:00:00Z'); // Monday
      
      // Test Monday (in series)
      expect(recurrenceService.isDateInSeries(rrule, startTime, new Date('2025-01-13T00:00:00Z'))).toBe(true);
      // Test Wednesday (in series) 
      expect(recurrenceService.isDateInSeries(rrule, startTime, new Date('2025-01-15T00:00:00Z'))).toBe(true);
      // Test Tuesday (not in series)
      expect(recurrenceService.isDateInSeries(rrule, startTime, new Date('2025-01-14T00:00:00Z'))).toBe(false);
    });
  });

  describe('getNextOccurrences', () => {
    it('should return next N occurrences from a given date', () => {
      const rrule = 'FREQ=DAILY;COUNT=10';
      const startTime = new Date('2025-01-15T09:00:00Z');
      const endTime = new Date('2025-01-15T10:00:00Z');
      const fromDate = new Date('2025-01-17T00:00:00Z'); // Skip first 2 days
      
      const nextOccurrences = recurrenceService.getNextOccurrences(
        rrule,
        startTime,
        endTime,
        fromDate,
        3
      );

      expect(nextOccurrences).toHaveLength(3);
      expect(nextOccurrences[0].start).toEqual(new Date('2025-01-18T09:00:00Z'));
      expect(nextOccurrences[1].start).toEqual(new Date('2025-01-19T09:00:00Z'));
      expect(nextOccurrences[2].start).toEqual(new Date('2025-01-20T09:00:00Z'));
    });

    it('should handle cases where no more occurrences exist', () => {
      const rrule = 'FREQ=DAILY;COUNT=5';
      const startTime = new Date('2025-01-15T09:00:00Z');
      const endTime = new Date('2025-01-15T10:00:00Z');
      const fromDate = new Date('2025-01-25T00:00:00Z'); // After all occurrences
      
      const nextOccurrences = recurrenceService.getNextOccurrences(
        rrule,
        startTime,
        endTime,
        fromDate,
        3
      );

      expect(nextOccurrences).toHaveLength(0);
    });
  });

  describe('calculateSeriesEndDate', () => {
    it('should calculate end date for COUNT-based series', () => {
      const rrule = 'FREQ=DAILY;COUNT=5';
      const startDate = new Date('2025-01-15T09:00:00Z');
      
      const endDate = recurrenceService.calculateSeriesEndDate(rrule, startDate);
      
      expect(endDate).toEqual(new Date('2025-01-19T09:00:00Z'));
    });

    it('should return UNTIL date for UNTIL-based series', () => {
      const rrule = 'FREQ=DAILY;UNTIL=20250131T235959Z';
      const startDate = new Date('2025-01-15T09:00:00Z');
      
      const endDate = recurrenceService.calculateSeriesEndDate(rrule, startDate);
      
      expect(endDate).toEqual(new Date('2025-01-31T23:59:59Z'));
    });

    it('should return null for infinite series', () => {
      const rrule = 'FREQ=DAILY'; // No COUNT or UNTIL
      const startDate = new Date('2025-01-15T09:00:00Z');
      
      const endDate = recurrenceService.calculateSeriesEndDate(rrule, startDate);
      
      expect(endDate).toBeNull();
    });
  });

  describe('getHumanReadableDescription', () => {
    it('should generate human-readable descriptions', () => {
      const testCases = [
        { rrule: 'FREQ=DAILY;COUNT=5', expectedKeywords: ['day', '5'] },
        { rrule: 'FREQ=WEEKLY;BYDAY=MO,WE,FR', expectedKeywords: ['week'] },
        { rrule: 'FREQ=MONTHLY;BYMONTHDAY=15', expectedKeywords: ['month'] }
      ];

      testCases.forEach(({ rrule, expectedKeywords }) => {
        const description = recurrenceService.getHumanReadableDescription(rrule);
        expect(typeof description).toBe('string');
        expect(description.length).toBeGreaterThan(0);
        
        // Check that description contains expected keywords (case insensitive)
        const lowerDescription = description.toLowerCase();
        expectedKeywords.forEach(keyword => {
          expect(lowerDescription).toContain(keyword.toLowerCase());
        });
      });
    });

    it('should handle invalid RRULE gracefully', () => {
      const description = recurrenceService.getHumanReadableDescription('INVALID_RULE');
      expect(description).toBe('Invalid recurrence rule');
    });
  });

  describe('normalizeRRule', () => {
    it('should normalize valid RRULE strings', () => {
      const originalRRule = 'FREQ=DAILY;COUNT=5';
      const normalized = recurrenceService.normalizeRRule(originalRRule);
      
      expect(typeof normalized).toBe('string');
      expect(normalized).toContain('FREQ=DAILY');
      expect(normalized).toContain('COUNT=5');
    });

    it('should throw error for invalid RRULE', () => {
      expect(() => {
        recurrenceService.normalizeRRule('INVALID_RULE');
      }).toThrow('Cannot normalize invalid RRULE');
    });
  });
});