"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AvailabilityService = void 0;
var date_fns_1 = require("date-fns");
var models_1 = require("../models");
var sequelize_1 = require("sequelize");
var AvailabilityService = /** @class */ (function () {
    function AvailabilityService(db, conflictService, recurrenceService) {
        this.db = db;
        this.conflictService = conflictService;
        this.recurrenceService = recurrenceService;
    }
    /**
     * Get available time slots for a resource in a date range
     */
    AvailabilityService.prototype.getAvailability = function (request) {
        return __awaiter(this, void 0, void 0, function () {
            var startDate, endDate, duration, potentialSlots, availableSlots, _i, potentialSlots_1, slot, isAvailable, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 5, , 6]);
                        startDate = new Date(request.startDate);
                        endDate = new Date(request.endDate);
                        duration = request.duration || 60;
                        // Validate input
                        if (startDate >= endDate) {
                            return [2 /*return*/, {
                                    success: false,
                                    resourceId: request.resourceId,
                                    requestedRange: { startDate: startDate, endDate: endDate },
                                    availableSlots: [],
                                    totalSlots: 0,
                                    error: 'Start date must be before end date'
                                }];
                        }
                        potentialSlots = this.generateTimeSlots(startDate, endDate, duration);
                        availableSlots = [];
                        _i = 0, potentialSlots_1 = potentialSlots;
                        _a.label = 1;
                    case 1:
                        if (!(_i < potentialSlots_1.length)) return [3 /*break*/, 4];
                        slot = potentialSlots_1[_i];
                        return [4 /*yield*/, this.conflictService.isTimeSlotAvailable(request.resourceId, slot.start, slot.end)];
                    case 2:
                        isAvailable = _a.sent();
                        if (isAvailable) {
                            availableSlots.push({
                                startTime: slot.start,
                                endTime: slot.end,
                                duration: duration
                            });
                        }
                        _a.label = 3;
                    case 3:
                        _i++;
                        return [3 /*break*/, 1];
                    case 4: return [2 /*return*/, {
                            success: true,
                            resourceId: request.resourceId,
                            requestedRange: { startDate: startDate, endDate: endDate },
                            availableSlots: availableSlots,
                            totalSlots: availableSlots.length
                        }];
                    case 5:
                        error_1 = _a.sent();
                        console.error('Error getting availability:', error_1);
                        return [2 /*return*/, {
                                success: false,
                                resourceId: request.resourceId,
                                requestedRange: {
                                    startDate: new Date(request.startDate),
                                    endDate: new Date(request.endDate)
                                },
                                availableSlots: [],
                                totalSlots: 0,
                                error: 'Internal server error while checking availability'
                            }];
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Find next available time slots after a conflict
     */
    AvailabilityService.prototype.findNextAvailableSlots = function (resourceId_1, preferredStart_1, preferredEnd_1) {
        return __awaiter(this, arguments, void 0, function (resourceId, preferredStart, preferredEnd, count) {
            var duration, suggestions, searchStart, maxSearchDays, searchEnd, slotEnd, isAvailable;
            if (count === void 0) { count = 3; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        duration = preferredEnd.getTime() - preferredStart.getTime();
                        suggestions = [];
                        searchStart = preferredStart;
                        maxSearchDays = 14;
                        searchEnd = (0, date_fns_1.addDays)(preferredStart, maxSearchDays);
                        _a.label = 1;
                    case 1:
                        if (!(searchStart < searchEnd && suggestions.length < count)) return [3 /*break*/, 4];
                        slotEnd = new Date(searchStart.getTime() + duration);
                        if (!this.isWithinBusinessHours(searchStart, slotEnd)) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.conflictService.isTimeSlotAvailable(resourceId, searchStart, slotEnd)];
                    case 2:
                        isAvailable = _a.sent();
                        if (isAvailable) {
                            suggestions.push({
                                startTime: searchStart,
                                endTime: slotEnd,
                                duration: Math.floor(duration / (1000 * 60)) // Convert to minutes
                            });
                        }
                        _a.label = 3;
                    case 3:
                        // Move to next 30-minute slot
                        searchStart = (0, date_fns_1.addMinutes)(searchStart, 30);
                        // Skip weekends (Saturday and Sunday)
                        if ((0, date_fns_1.isWeekend)(searchStart)) {
                            searchStart = this.getNextBusinessDay(searchStart);
                        }
                        return [3 /*break*/, 1];
                    case 4: return [2 /*return*/, suggestions];
                }
            });
        });
    };
    /**
     * Generate time slots for business hours
     */
    AvailabilityService.prototype.generateTimeSlots = function (startDate, endDate, durationMinutes) {
        var slots = [];
        var days = (0, date_fns_1.eachDayOfInterval)({ start: startDate, end: endDate });
        for (var _i = 0, days_1 = days; _i < days_1.length; _i++) {
            var day = days_1[_i];
            // Skip weekends
            if ((0, date_fns_1.isWeekend)(day)) {
                continue;
            }
            // Generate slots from 9 AM to 5 PM
            var businessStart = (0, date_fns_1.setMinutes)((0, date_fns_1.setHours)(day, 9), 0);
            var businessEnd = (0, date_fns_1.setMinutes)((0, date_fns_1.setHours)(day, 17), 0);
            var slotStart = businessStart;
            while (slotStart < businessEnd) {
                var slotEnd = (0, date_fns_1.addMinutes)(slotStart, durationMinutes);
                // Ensure slot doesn't exceed business hours
                if (slotEnd <= businessEnd) {
                    slots.push({
                        start: new Date(slotStart),
                        end: new Date(slotEnd)
                    });
                }
                // Move to next slot (30-minute increments)
                slotStart = (0, date_fns_1.addMinutes)(slotStart, 30);
            }
        }
        return slots;
    };
    /**
     * Check if a time slot is within business hours
     */
    AvailabilityService.prototype.isWithinBusinessHours = function (startTime, endTime) {
        var startHour = startTime.getHours();
        var endHour = endTime.getHours();
        var endMinutes = endTime.getMinutes();
        // Business hours: 9 AM to 5 PM, Monday to Friday
        var isWeekday = !(0, date_fns_1.isWeekend)(startTime);
        var startsAfter9AM = startHour >= 9;
        var endsBefore5PM = endHour < 17 || (endHour === 17 && endMinutes === 0);
        return isWeekday && startsAfter9AM && endsBefore5PM;
    };
    /**
     * Get the next business day (skip weekends)
     */
    AvailabilityService.prototype.getNextBusinessDay = function (date) {
        var nextDay = (0, date_fns_1.addDays)(date, 1);
        while ((0, date_fns_1.isWeekend)(nextDay)) {
            nextDay = (0, date_fns_1.addDays)(nextDay, 1);
        }
        return (0, date_fns_1.setMinutes)((0, date_fns_1.setHours)(nextDay, 9), 0); // Start at 9 AM
    };
    /**
     * Get availability summary for a resource
     */
    AvailabilityService.prototype.getAvailabilitySummary = function (resourceId, startDate, endDate) {
        return __awaiter(this, void 0, void 0, function () {
            var businessDays, totalBusinessHours, bookings, bookedMinutes, busyDays, _i, bookings_1, booking, occurrences, _a, occurrences_1, occurrence, duration, duration, bookedHours, availableHours, utilizationRate, availableDays;
            var _b, _c;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        businessDays = (0, date_fns_1.eachDayOfInterval)({ start: startDate, end: endDate })
                            .filter(function (day) { return !(0, date_fns_1.isWeekend)(day); });
                        totalBusinessHours = businessDays.length * 8;
                        return [4 /*yield*/, models_1.Booking.findAll({
                                where: {
                                    resource_id: resourceId,
                                    start_time: (_b = {}, _b[sequelize_1.Op.lte] = endDate, _b),
                                    end_time: (_c = {}, _c[sequelize_1.Op.gte] = startDate, _c)
                                },
                                attributes: ['start_time', 'end_time', 'is_recurring', 'recurrence_rule']
                            })];
                    case 1:
                        bookings = _d.sent();
                        bookedMinutes = 0;
                        busyDays = new Set();
                        for (_i = 0, bookings_1 = bookings; _i < bookings_1.length; _i++) {
                            booking = bookings_1[_i];
                            if (booking.is_recurring && booking.recurrence_rule) {
                                occurrences = this.recurrenceService.generateOccurrences(booking.recurrence_rule, booking.start_time, booking.end_time, startDate, endDate);
                                for (_a = 0, occurrences_1 = occurrences; _a < occurrences_1.length; _a++) {
                                    occurrence = occurrences_1[_a];
                                    duration = occurrence.end.getTime() - occurrence.start.getTime();
                                    bookedMinutes += duration / (1000 * 60);
                                    busyDays.add((0, date_fns_1.format)(occurrence.start, 'yyyy-MM-dd'));
                                }
                            }
                            else {
                                duration = booking.end_time.getTime() - booking.start_time.getTime();
                                bookedMinutes += duration / (1000 * 60);
                                busyDays.add((0, date_fns_1.format)(booking.start_time, 'yyyy-MM-dd'));
                            }
                        }
                        bookedHours = bookedMinutes / 60;
                        availableHours = totalBusinessHours - bookedHours;
                        utilizationRate = totalBusinessHours > 0 ? (bookedHours / totalBusinessHours) * 100 : 0;
                        availableDays = businessDays
                            .filter(function (day) { return !busyDays.has((0, date_fns_1.format)(day, 'yyyy-MM-dd')); })
                            .map(function (day) { return (0, date_fns_1.format)(day, 'yyyy-MM-dd'); });
                        return [2 /*return*/, {
                                totalBusinessHours: totalBusinessHours,
                                bookedHours: Math.max(0, bookedHours),
                                availableHours: Math.max(0, availableHours),
                                utilizationRate: Math.min(100, Math.max(0, utilizationRate)),
                                busyDays: Array.from(busyDays),
                                availableDays: availableDays
                            }];
                }
            });
        });
    };
    /**
     * Find optimal meeting time for multiple resources
     */
    AvailabilityService.prototype.findOptimalMeetingTime = function (resourceIds, duration, preferredStart, preferredEnd) {
        return __awaiter(this, void 0, void 0, function () {
            var potentialSlots, commonAvailableSlots, _i, potentialSlots_2, slot, allResourcesAvailable, _a, resourceIds_1, resourceId, isAvailable;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        potentialSlots = this.generateTimeSlots(preferredStart, preferredEnd, duration);
                        commonAvailableSlots = [];
                        _i = 0, potentialSlots_2 = potentialSlots;
                        _b.label = 1;
                    case 1:
                        if (!(_i < potentialSlots_2.length)) return [3 /*break*/, 7];
                        slot = potentialSlots_2[_i];
                        allResourcesAvailable = true;
                        _a = 0, resourceIds_1 = resourceIds;
                        _b.label = 2;
                    case 2:
                        if (!(_a < resourceIds_1.length)) return [3 /*break*/, 5];
                        resourceId = resourceIds_1[_a];
                        return [4 /*yield*/, this.conflictService.isTimeSlotAvailable(resourceId, slot.start, slot.end)];
                    case 3:
                        isAvailable = _b.sent();
                        if (!isAvailable) {
                            allResourcesAvailable = false;
                            return [3 /*break*/, 5];
                        }
                        _b.label = 4;
                    case 4:
                        _a++;
                        return [3 /*break*/, 2];
                    case 5:
                        if (allResourcesAvailable) {
                            commonAvailableSlots.push({
                                startTime: slot.start,
                                endTime: slot.end,
                                duration: duration
                            });
                        }
                        _b.label = 6;
                    case 6:
                        _i++;
                        return [3 /*break*/, 1];
                    case 7: return [2 /*return*/, commonAvailableSlots.slice(0, 10)]; // Return top 10 options
                }
            });
        });
    };
    /**
     * Check if resource exists using Sequelize
     */
    AvailabilityService.prototype.resourceExists = function (resourceId) {
        return __awaiter(this, void 0, void 0, function () {
            var resource;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, models_1.Resource.findByPk(resourceId)];
                    case 1:
                        resource = _a.sent();
                        return [2 /*return*/, resource !== null];
                }
            });
        });
    };
    return AvailabilityService;
}());
exports.AvailabilityService = AvailabilityService;
