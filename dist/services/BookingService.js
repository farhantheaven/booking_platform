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
exports.BookingService = void 0;
var sequelize_1 = require("sequelize");
var uuid_1 = require("uuid");
var models_1 = require("../models");
var BookingService = /** @class */ (function () {
    function BookingService(db, recurrenceService, conflictService, availabilityService) {
        this.db = db;
        this.recurrenceService = recurrenceService;
        this.conflictService = conflictService;
        this.availabilityService = availabilityService;
    }
    /**
     * Create a new booking (single or recurring)
     */
    BookingService.prototype.createBooking = function (request) {
        return __awaiter(this, void 0, void 0, function () {
            var validationError, startTime, endTime, conflicts, suggestions, booking, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 5, , 6]);
                        validationError = this.validateBookingRequest(request);
                        if (validationError) {
                            return [2 /*return*/, {
                                    success: false,
                                    error: validationError
                                }];
                        }
                        startTime = new Date(request.startTime);
                        endTime = new Date(request.endTime);
                        return [4 /*yield*/, this.conflictService.detectConflicts(request.resourceId, startTime, endTime, request.recurrenceRule)];
                    case 1:
                        conflicts = _a.sent();
                        if (!(conflicts.length > 0)) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.availabilityService.findNextAvailableSlots(request.resourceId, startTime, endTime, 3 // Get 3 suggestions
                            )];
                    case 2:
                        suggestions = _a.sent();
                        return [2 /*return*/, {
                                success: false,
                                conflicts: conflicts,
                                suggestions: suggestions,
                                error: 'Time slot conflicts with existing bookings'
                            }];
                    case 3: return [4 /*yield*/, this.insertBooking(request)];
                    case 4:
                        booking = _a.sent();
                        return [2 /*return*/, {
                                success: true,
                                booking: booking
                            }];
                    case 5:
                        error_1 = _a.sent();
                        console.error('Error creating booking:', error_1);
                        return [2 /*return*/, {
                                success: false,
                                error: 'Internal server error while creating booking'
                            }];
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Insert booking into database using Sequelize
     */
    BookingService.prototype.insertBooking = function (request) {
        return __awaiter(this, void 0, void 0, function () {
            var seriesId, booking;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        seriesId = request.recurrenceRule ? (0, uuid_1.v4)() : undefined;
                        return [4 /*yield*/, models_1.Booking.create({
                                resource_id: request.resourceId,
                                title: request.title,
                                description: request.description,
                                start_time: new Date(request.startTime),
                                end_time: new Date(request.endTime),
                                is_recurring: !!request.recurrenceRule,
                                recurrence_rule: request.recurrenceRule,
                                series_id: seriesId,
                                created_by: request.createdBy || 'unknown',
                            })];
                    case 1:
                        booking = _a.sent();
                        return [2 /*return*/, booking];
                }
            });
        });
    };
    /**
     * Cancel booking(s)
     */
    BookingService.prototype.cancelBooking = function (request) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, error_2;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 9, , 10]);
                        _a = request.cancelType;
                        switch (_a) {
                            case 'single': return [3 /*break*/, 1];
                            case 'series': return [3 /*break*/, 3];
                            case 'instance': return [3 /*break*/, 5];
                        }
                        return [3 /*break*/, 7];
                    case 1: return [4 /*yield*/, this.cancelSingleBooking(request.bookingId)];
                    case 2: return [2 /*return*/, _b.sent()];
                    case 3: return [4 /*yield*/, this.cancelEntireSeries(request.bookingId)];
                    case 4: return [2 /*return*/, _b.sent()];
                    case 5:
                        if (!request.instanceDate) {
                            return [2 /*return*/, {
                                    success: false,
                                    message: 'Instance date is required for instance cancellation',
                                    error: 'Missing instanceDate parameter'
                                }];
                        }
                        return [4 /*yield*/, this.cancelSeriesInstance(request.bookingId, new Date(request.instanceDate))];
                    case 6: return [2 /*return*/, _b.sent()];
                    case 7: return [2 /*return*/, {
                            success: false,
                            message: 'Invalid cancel type',
                            error: 'cancelType must be one of: single, series, instance'
                        }];
                    case 8: return [3 /*break*/, 10];
                    case 9:
                        error_2 = _b.sent();
                        console.error('Error cancelling booking:', error_2);
                        return [2 /*return*/, {
                                success: false,
                                message: 'Internal server error while cancelling booking',
                                error: error_2 instanceof Error ? error_2.message : 'Unknown error'
                            }];
                    case 10: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Cancel a single (non-recurring) booking using Sequelize
     */
    BookingService.prototype.cancelSingleBooking = function (bookingId) {
        return __awaiter(this, void 0, void 0, function () {
            var deletedCount;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, models_1.Booking.destroy({
                            where: {
                                id: bookingId,
                                is_recurring: false,
                            },
                        })];
                    case 1:
                        deletedCount = _a.sent();
                        if (deletedCount === 0) {
                            return [2 /*return*/, {
                                    success: false,
                                    message: 'Booking not found or is part of a recurring series',
                                    error: 'BOOKING_NOT_FOUND'
                                }];
                        }
                        return [2 /*return*/, {
                                success: true,
                                message: 'Booking cancelled successfully',
                                affectedInstances: deletedCount
                            }];
                }
            });
        });
    };
    /**
     * Cancel entire recurring series using Sequelize
     */
    BookingService.prototype.cancelEntireSeries = function (bookingId) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, (0, models_1.withTransaction)(function (transaction) { return __awaiter(_this, void 0, void 0, function () {
                        var booking, seriesId, deletedCount;
                        var _a;
                        return __generator(this, function (_b) {
                            switch (_b.label) {
                                case 0: return [4 /*yield*/, models_1.Booking.findByPk(bookingId, { transaction: transaction })];
                                case 1:
                                    booking = _b.sent();
                                    if (!booking) {
                                        return [2 /*return*/, {
                                                success: false,
                                                message: 'Booking not found',
                                                error: 'BOOKING_NOT_FOUND'
                                            }];
                                    }
                                    seriesId = booking.series_id || booking.id;
                                    return [4 /*yield*/, models_1.Booking.destroy({
                                            where: (_a = {},
                                                _a[sequelize_1.Op.or] = [
                                                    { id: bookingId },
                                                    { series_id: seriesId }
                                                ],
                                                _a),
                                            transaction: transaction
                                        })];
                                case 2:
                                    deletedCount = _b.sent();
                                    if (deletedCount === 0) {
                                        return [2 /*return*/, {
                                                success: false,
                                                message: 'Booking series not found',
                                                error: 'SERIES_NOT_FOUND'
                                            }];
                                    }
                                    return [2 /*return*/, {
                                            success: true,
                                            message: "Recurring series cancelled successfully",
                                            affectedInstances: deletedCount
                                        }];
                            }
                        });
                    }); })];
            });
        });
    };
    /**
     * Cancel specific instance of recurring series using Sequelize
     */
    BookingService.prototype.cancelSeriesInstance = function (bookingId, instanceDate) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, (0, models_1.withTransaction)(function (transaction) { return __awaiter(_this, void 0, void 0, function () {
                        var booking;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, models_1.Booking.findOne({
                                        where: {
                                            id: bookingId,
                                            is_recurring: true,
                                        },
                                        transaction: transaction
                                    })];
                                case 1:
                                    booking = _a.sent();
                                    if (!booking) {
                                        return [2 /*return*/, {
                                                success: false,
                                                message: 'Recurring booking not found',
                                                error: 'RECURRING_BOOKING_NOT_FOUND'
                                            }];
                                    }
                                    // Add exception for this instance
                                    return [4 /*yield*/, models_1.BookingException.upsert({
                                            booking_id: bookingId,
                                            exception_date: instanceDate,
                                            exception_type: 'cancelled',
                                        }, { transaction: transaction })];
                                case 2:
                                    // Add exception for this instance
                                    _a.sent();
                                    return [2 /*return*/, {
                                            success: true,
                                            message: 'Booking instance cancelled successfully',
                                            affectedInstances: 1
                                        }];
                            }
                        });
                    }); })];
            });
        });
    };
    /**
     * Get booking by ID using Sequelize
     */
    BookingService.prototype.getBookingById = function (bookingId) {
        return __awaiter(this, void 0, void 0, function () {
            var booking;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, models_1.Booking.findByPk(bookingId, {
                            include: [
                                {
                                    model: models_1.Resource,
                                    as: 'resource',
                                },
                                {
                                    model: models_1.BookingException,
                                    as: 'exceptions',
                                }
                            ]
                        })];
                    case 1:
                        booking = _a.sent();
                        return [2 /*return*/, booking];
                }
            });
        });
    };
    /**
     * Get bookings for a resource in a date range using Sequelize
     */
    BookingService.prototype.getBookingsForResource = function (resourceId, startDate, endDate) {
        return __awaiter(this, void 0, void 0, function () {
            var bookings;
            var _a, _b, _c, _d;
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0: return [4 /*yield*/, models_1.Booking.findAll({
                            where: (_a = {
                                    resource_id: resourceId
                                },
                                _a[sequelize_1.Op.or] = [
                                    // Regular bookings in range
                                    {
                                        start_time: (_b = {}, _b[sequelize_1.Op.lte] = endDate, _b),
                                        end_time: (_c = {}, _c[sequelize_1.Op.gte] = startDate, _c)
                                    },
                                    // Recurring bookings that might have instances in range
                                    {
                                        is_recurring: true,
                                        start_time: (_d = {}, _d[sequelize_1.Op.lte] = endDate, _d)
                                    }
                                ],
                                _a),
                            include: [
                                {
                                    model: models_1.Resource,
                                    as: 'resource',
                                },
                                {
                                    model: models_1.BookingException,
                                    as: 'exceptions',
                                }
                            ],
                            order: [['start_time', 'ASC']]
                        })];
                    case 1:
                        bookings = _e.sent();
                        return [2 /*return*/, bookings];
                }
            });
        });
    };
    /**
     * Validate booking request
     */
    BookingService.prototype.validateBookingRequest = function (request) {
        if (!request.resourceId || !request.title || !request.startTime || !request.endTime) {
            return 'Missing required fields: resourceId, title, startTime, endTime';
        }
        var startTime = new Date(request.startTime);
        var endTime = new Date(request.endTime);
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
    };
    return BookingService;
}());
exports.BookingService = BookingService;
