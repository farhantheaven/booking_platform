"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecurrenceService = void 0;
var rrule_1 = require("rrule");
var RecurrenceService = /** @class */ (function () {
    function RecurrenceService() {
    }
    /**
     * Parse RRULE string and generate occurrences within a date range
     */
    RecurrenceService.prototype.generateOccurrences = function (rruleString, startTime, endTime, rangeStart, rangeEnd) {
        try {
            var rule = (0, rrule_1.rrulestr)(rruleString);
            var duration_1 = endTime.getTime() - startTime.getTime();
            // Generate occurrences within the range
            var occurrences = rule.between(rangeStart, rangeEnd, true);
            return occurrences.map(function (occurrence) { return ({
                start: occurrence,
                end: new Date(occurrence.getTime() + duration_1)
            }); });
        }
        catch (error) {
            console.error('Error parsing RRULE:', error);
            throw new Error("Invalid recurrence rule: ".concat(rruleString));
        }
    };
    /**
     * Create RRULE string from pattern object
     */
    RecurrenceService.prototype.createRRule = function (pattern, startDate) {
        var _this = this;
        var options = {
            freq: this.getFrequency(pattern.frequency),
            interval: pattern.interval || 1,
            dtstart: startDate,
        };
        if (pattern.byWeekDay && pattern.byWeekDay.length > 0) {
            options.byweekday = pattern.byWeekDay.map(function (day) { return _this.getWeekday(day); });
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
        var rule = new rrule_1.RRule(options);
        return rule.toString();
    };
    /**
     * Validate RRULE string
     */
    RecurrenceService.prototype.validateRRule = function (rruleString) {
        try {
            (0, rrule_1.rrulestr)(rruleString);
            return true;
        }
        catch (_a) {
            return false;
        }
    };
    /**
     * Check if a specific date is part of a recurring series
     */
    RecurrenceService.prototype.isDateInSeries = function (rruleString, startTime, targetDate) {
        try {
            var rule = (0, rrule_1.rrulestr)(rruleString);
            var occurrences = rule.between(new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate()), new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate() + 1), true);
            return occurrences.length > 0;
        }
        catch (_a) {
            return false;
        }
    };
    /**
     * Get the next N occurrences from a given date
     */
    RecurrenceService.prototype.getNextOccurrences = function (rruleString, startTime, endTime, fromDate, count) {
        if (count === void 0) { count = 5; }
        try {
            var rule = (0, rrule_1.rrulestr)(rruleString);
            var duration_2 = endTime.getTime() - startTime.getTime();
            var occurrences = rule.after(fromDate, false);
            var nextOccurrences = [];
            var current = occurrences;
            while (nextOccurrences.length < count && current) {
                nextOccurrences.push(current);
                current = rule.after(current, false);
            }
            return nextOccurrences.map(function (occurrence) { return ({
                start: occurrence,
                end: new Date(occurrence.getTime() + duration_2)
            }); });
        }
        catch (error) {
            console.error('Error getting next occurrences:', error);
            return [];
        }
    };
    /**
     * Calculate end date for finite recurrence series
     */
    RecurrenceService.prototype.calculateSeriesEndDate = function (rruleString, startDate) {
        try {
            var rule = (0, rrule_1.rrulestr)(rruleString);
            // If the rule has an until date, return it
            if (rule.options.until) {
                return rule.options.until;
            }
            // If the rule has a count, calculate the last occurrence
            if (rule.options.count) {
                var allOccurrences = rule.all();
                return allOccurrences[allOccurrences.length - 1] || null;
            }
            // Infinite recurrence
            return null;
        }
        catch (_a) {
            return null;
        }
    };
    /**
     * Convert frequency string to RRule frequency constant
     */
    RecurrenceService.prototype.getFrequency = function (frequency) {
        switch (frequency.toUpperCase()) {
            case 'DAILY':
                return rrule_1.RRule.DAILY;
            case 'WEEKLY':
                return rrule_1.RRule.WEEKLY;
            case 'MONTHLY':
                return rrule_1.RRule.MONTHLY;
            case 'YEARLY':
                return rrule_1.RRule.YEARLY;
            default:
                throw new Error("Unsupported frequency: ".concat(frequency));
        }
    };
    /**
     * Convert weekday string to RRule weekday constant
     */
    RecurrenceService.prototype.getWeekday = function (day) {
        switch (day.toUpperCase()) {
            case 'MO':
                return rrule_1.RRule.MO;
            case 'TU':
                return rrule_1.RRule.TU;
            case 'WE':
                return rrule_1.RRule.WE;
            case 'TH':
                return rrule_1.RRule.TH;
            case 'FR':
                return rrule_1.RRule.FR;
            case 'SA':
                return rrule_1.RRule.SA;
            case 'SU':
                return rrule_1.RRule.SU;
            default:
                throw new Error("Unsupported weekday: ".concat(day));
        }
    };
    /**
     * Generate human-readable description of recurrence rule
     */
    RecurrenceService.prototype.getHumanReadableDescription = function (rruleString) {
        try {
            var rule = (0, rrule_1.rrulestr)(rruleString);
            return rule.toText();
        }
        catch (_a) {
            return 'Invalid recurrence rule';
        }
    };
    /**
     * Optimize RRULE for database storage
     * Remove unnecessary parts and normalize format
     */
    RecurrenceService.prototype.normalizeRRule = function (rruleString) {
        try {
            var rule = (0, rrule_1.rrulestr)(rruleString);
            return rule.toString();
        }
        catch (_a) {
            throw new Error("Cannot normalize invalid RRULE: ".concat(rruleString));
        }
    };
    return RecurrenceService;
}());
exports.RecurrenceService = RecurrenceService;
