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
exports.ConflictDetectionService = void 0;
var date_fns_1 = require("date-fns");
var models_1 = require("../models");
var sequelize_1 = require("sequelize");
var ConflictDetectionService = /** @class */ (function () {
    function ConflictDetectionService(db, recurrenceService) {
        this.db = db;
        this.recurrenceService = recurrenceService;
    }
    /**
     * Detect conflicts for a potential booking
     */
    ConflictDetectionService.prototype.detectConflicts = function (resourceId, startTime, endTime, recurrenceRule) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                if (recurrenceRule) {
                    return [2 /*return*/, this.detectRecurringConflicts(resourceId, startTime, endTime, recurrenceRule)];
                }
                else {
                    return [2 /*return*/, this.detectSingleConflicts(resourceId, startTime, endTime)];
                }
                return [2 /*return*/];
            });
        });
    };
    /**
     * Detect conflicts for a single booking using Sequelize
     */
    ConflictDetectionService.prototype.detectSingleConflicts = function (resourceId, startTime, endTime) {
        return __awaiter(this, void 0, void 0, function () {
            var bookings, conflicts, _i, bookings_1, booking, exceptions, hasCancelledException, recurringConflicts;
            var _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0: return [4 /*yield*/, models_1.Booking.findAll({
                            where: {
                                resource_id: resourceId,
                                start_time: (_a = {}, _a[sequelize_1.Op.lt] = endTime, _a),
                                end_time: (_b = {}, _b[sequelize_1.Op.gt] = startTime, _b)
                            },
                            include: [
                                {
                                    model: models_1.BookingException,
                                    as: 'exceptions',
                                    where: {
                                        exception_date: startTime.toISOString().split('T')[0],
                                        exception_type: 'cancelled'
                                    },
                                    required: false // LEFT JOIN - include bookings even without exceptions
                                }
                            ],
                            order: [['start_time', 'ASC']]
                        })];
                    case 1:
                        bookings = _c.sent();
                        conflicts = [];
                        _i = 0, bookings_1 = bookings;
                        _c.label = 2;
                    case 2:
                        if (!(_i < bookings_1.length)) return [3 /*break*/, 7];
                        booking = bookings_1[_i];
                        return [4 /*yield*/, booking.getExceptions()];
                    case 3:
                        exceptions = _c.sent();
                        hasCancelledException = exceptions === null || exceptions === void 0 ? void 0 : exceptions.some(function (exception) {
                            return exception.exception_type === 'cancelled' &&
                                exception.exception_date === startTime.toISOString().split('T')[0];
                        });
                        if (hasCancelledException) {
                            return [3 /*break*/, 6];
                        }
                        if (!booking.is_recurring) return [3 /*break*/, 5];
                        return [4 /*yield*/, this.checkRecurringBookingConflicts(booking, startTime, endTime)];
                    case 4:
                        recurringConflicts = _c.sent();
                        conflicts.push.apply(conflicts, recurringConflicts);
                        return [3 /*break*/, 6];
                    case 5:
                        // Direct conflict with single booking
                        conflicts.push({
                            id: booking.id,
                            title: booking.title,
                            startTime: booking.start_time,
                            endTime: booking.end_time,
                            bookingType: 'single'
                        });
                        _c.label = 6;
                    case 6:
                        _i++;
                        return [3 /*break*/, 2];
                    case 7: return [2 /*return*/, conflicts];
                }
            });
        });
    };
    /**
     * Detect conflicts for a recurring booking
     */
    ConflictDetectionService.prototype.detectRecurringConflicts = function (resourceId, startTime, endTime, recurrenceRule) {
        return __awaiter(this, void 0, void 0, function () {
            var rangeEnd, occurrences, allConflicts, _loop_1, this_1, _i, _a, occurrence, error_1;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        rangeEnd = (0, date_fns_1.addMonths)(startTime, 24);
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 6, , 7]);
                        occurrences = this.recurrenceService.generateOccurrences(recurrenceRule, startTime, endTime, startTime, rangeEnd);
                        allConflicts = [];
                        _loop_1 = function (occurrence) {
                            var conflicts;
                            return __generator(this, function (_c) {
                                switch (_c.label) {
                                    case 0: return [4 /*yield*/, this_1.detectSingleConflicts(resourceId, occurrence.start, occurrence.end)];
                                    case 1:
                                        conflicts = _c.sent();
                                        // Add occurrence info to conflicts
                                        conflicts.forEach(function (conflict) {
                                            conflict.title = "".concat(conflict.title, " (conflicts with occurrence at ").concat(occurrence.start.toISOString(), ")");
                                        });
                                        allConflicts.push.apply(allConflicts, conflicts);
                                        return [2 /*return*/];
                                }
                            });
                        };
                        this_1 = this;
                        _i = 0, _a = occurrences.slice(0, 100);
                        _b.label = 2;
                    case 2:
                        if (!(_i < _a.length)) return [3 /*break*/, 5];
                        occurrence = _a[_i];
                        return [5 /*yield**/, _loop_1(occurrence)];
                    case 3:
                        _b.sent();
                        _b.label = 4;
                    case 4:
                        _i++;
                        return [3 /*break*/, 2];
                    case 5: return [2 /*return*/, this.deduplicateConflicts(allConflicts)];
                    case 6:
                        error_1 = _b.sent();
                        console.error('Error detecting recurring conflicts:', error_1);
                        throw new Error('Failed to analyze recurring booking conflicts');
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Check if a recurring booking has instances that conflict with the requested time
     */
    ConflictDetectionService.prototype.checkRecurringBookingConflicts = function (recurringBooking, requestedStart, requestedEnd) {
        return __awaiter(this, void 0, void 0, function () {
            var checkStart, checkEnd, occurrences, conflicts, _i, occurrences_1, occurrence, isCancelled, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!recurringBooking.recurrence_rule) {
                            return [2 /*return*/, []];
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 6, , 7]);
                        checkStart = (0, date_fns_1.addDays)(requestedStart, -7);
                        checkEnd = (0, date_fns_1.addDays)(requestedEnd, 7);
                        occurrences = this.recurrenceService.generateOccurrences(recurringBooking.recurrence_rule, new Date(recurringBooking.start_time), new Date(recurringBooking.end_time), checkStart, checkEnd);
                        conflicts = [];
                        _i = 0, occurrences_1 = occurrences;
                        _a.label = 2;
                    case 2:
                        if (!(_i < occurrences_1.length)) return [3 /*break*/, 5];
                        occurrence = occurrences_1[_i];
                        if (!this.doTimeRangesOverlap(occurrence.start, occurrence.end, requestedStart, requestedEnd)) return [3 /*break*/, 4];
                        return [4 /*yield*/, this.isOccurrenceCancelled(recurringBooking.id, occurrence.start)];
                    case 3:
                        isCancelled = _a.sent();
                        if (!isCancelled) {
                            conflicts.push({
                                id: recurringBooking.id,
                                title: recurringBooking.title,
                                startTime: occurrence.start,
                                endTime: occurrence.end,
                                bookingType: 'recurring'
                            });
                        }
                        _a.label = 4;
                    case 4:
                        _i++;
                        return [3 /*break*/, 2];
                    case 5: return [2 /*return*/, conflicts];
                    case 6:
                        error_2 = _a.sent();
                        console.error('Error checking recurring booking conflicts:', error_2);
                        return [2 /*return*/, []];
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Check if a specific occurrence of a recurring booking is cancelled using Sequelize
     */
    ConflictDetectionService.prototype.isOccurrenceCancelled = function (bookingId, occurrenceDate) {
        return __awaiter(this, void 0, void 0, function () {
            var exception;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, models_1.BookingException.findOne({
                            where: {
                                booking_id: bookingId,
                                exception_date: occurrenceDate.toISOString().split('T')[0],
                                exception_type: 'cancelled'
                            }
                        })];
                    case 1:
                        exception = _a.sent();
                        return [2 /*return*/, exception !== null];
                }
            });
        });
    };
    /**
     * Check if two time ranges overlap
     */
    ConflictDetectionService.prototype.doTimeRangesOverlap = function (start1, end1, start2, end2) {
        return start1 < end2 && end1 > start2;
    };
    /**
     * Remove duplicate conflicts (same booking appearing multiple times)
     */
    ConflictDetectionService.prototype.deduplicateConflicts = function (conflicts) {
        var seen = new Set();
        return conflicts.filter(function (conflict) {
            var key = "".concat(conflict.id, "-").concat(conflict.startTime.getTime());
            if (seen.has(key)) {
                return false;
            }
            seen.add(key);
            return true;
        });
    };
    /**
     * Get detailed conflict information including suggestions
     */
    ConflictDetectionService.prototype.getDetailedConflictInfo = function (resourceId, startTime, endTime) {
        return __awaiter(this, void 0, void 0, function () {
            var conflicts, conflictingSeries, conflictingInstances;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.detectSingleConflicts(resourceId, startTime, endTime)];
                    case 1:
                        conflicts = _a.sent();
                        conflictingSeries = new Set(conflicts
                            .filter(function (c) { return c.bookingType === 'recurring'; })
                            .map(function (c) { return c.id; })).size;
                        conflictingInstances = conflicts.filter(function (c) { return c.bookingType === 'single'; }).length;
                        return [2 /*return*/, {
                                conflicts: conflicts,
                                totalConflicts: conflicts.length,
                                conflictingSeries: conflictingSeries,
                                conflictingInstances: conflictingInstances
                            }];
                }
            });
        });
    };
    /**
     * Check resource availability for a specific time slot
     */
    ConflictDetectionService.prototype.isTimeSlotAvailable = function (resourceId, startTime, endTime) {
        return __awaiter(this, void 0, void 0, function () {
            var conflicts;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.detectSingleConflicts(resourceId, startTime, endTime)];
                    case 1:
                        conflicts = _a.sent();
                        return [2 /*return*/, conflicts.length === 0];
                }
            });
        });
    };
    /**
     * Bulk check availability for multiple time slots
     */
    ConflictDetectionService.prototype.checkMultipleTimeSlots = function (resourceId, timeSlots) {
        return __awaiter(this, void 0, void 0, function () {
            var results, _i, timeSlots_1, slot, key, isAvailable;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        results = new Map();
                        _i = 0, timeSlots_1 = timeSlots;
                        _a.label = 1;
                    case 1:
                        if (!(_i < timeSlots_1.length)) return [3 /*break*/, 4];
                        slot = timeSlots_1[_i];
                        key = "".concat(slot.start.getTime(), "-").concat(slot.end.getTime());
                        return [4 /*yield*/, this.isTimeSlotAvailable(resourceId, slot.start, slot.end)];
                    case 2:
                        isAvailable = _a.sent();
                        results.set(key, isAvailable);
                        _a.label = 3;
                    case 3:
                        _i++;
                        return [3 /*break*/, 1];
                    case 4: return [2 /*return*/, results];
                }
            });
        });
    };
    return ConflictDetectionService;
}());
exports.ConflictDetectionService = ConflictDetectionService;
