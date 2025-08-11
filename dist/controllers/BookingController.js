"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
exports.BookingController = void 0;
var zod_1 = require("zod");
// Request validation schemas
var CreateBookingSchema = zod_1.z.object({
    resourceId: zod_1.z.string().uuid('Invalid resource ID format'),
    title: zod_1.z.string().min(1, 'Title is required').max(255, 'Title too long'),
    description: zod_1.z.string().max(1000, 'Description too long').optional(),
    startTime: zod_1.z.string().datetime('Invalid start time format'),
    endTime: zod_1.z.string().datetime('Invalid end time format'),
    recurrenceRule: zod_1.z.string().optional(),
    createdBy: zod_1.z.string().max(255, 'Created by field too long').optional()
});
var AvailabilityQuerySchema = zod_1.z.object({
    resourceId: zod_1.z.string().uuid('Invalid resource ID format'),
    startDate: zod_1.z.string().datetime('Invalid start date format'),
    endDate: zod_1.z.string().datetime('Invalid end date format'),
    duration: zod_1.z.string().transform(function (val) { return parseInt(val, 10); }).pipe(zod_1.z.number().min(15, 'Minimum duration is 15 minutes').max(480, 'Maximum duration is 8 hours')).optional()
});
var CancelBookingSchema = zod_1.z.object({
    bookingId: zod_1.z.string().uuid('Invalid booking ID format'),
    cancelType: zod_1.z.enum(['single', 'series', 'instance']),
    instanceDate: zod_1.z.string().datetime('Invalid instance date format').optional()
});
var BookingController = /** @class */ (function () {
    function BookingController(bookingService, availabilityService) {
        this.bookingService = bookingService;
        this.availabilityService = availabilityService;
        // Bind methods to preserve 'this' context
        this.createBooking = this.createBooking.bind(this);
        this.getAvailability = this.getAvailability.bind(this);
        this.cancelBooking = this.cancelBooking.bind(this);
        this.getBooking = this.getBooking.bind(this);
        this.getResourceSummary = this.getResourceSummary.bind(this);
    }
    /**
     * POST /bookings - Create a new booking
     */
    BookingController.prototype.createBooking = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var validationResult, bookingRequest, startTime, endTime, resourceExists, result, statusCode, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        validationResult = CreateBookingSchema.safeParse(req.body);
                        if (!validationResult.success) {
                            res.status(400).json({
                                success: false,
                                error: 'Validation failed',
                                details: validationResult.error.errors
                            });
                            return [2 /*return*/];
                        }
                        bookingRequest = validationResult.data;
                        startTime = new Date(bookingRequest.startTime);
                        endTime = new Date(bookingRequest.endTime);
                        if (startTime >= endTime) {
                            res.status(400).json({
                                success: false,
                                error: 'Start time must be before end time'
                            });
                            return [2 /*return*/];
                        }
                        if (startTime < new Date()) {
                            res.status(400).json({
                                success: false,
                                error: 'Cannot create bookings in the past'
                            });
                            return [2 /*return*/];
                        }
                        return [4 /*yield*/, this.availabilityService.resourceExists(bookingRequest.resourceId)];
                    case 1:
                        resourceExists = _a.sent();
                        if (!resourceExists) {
                            res.status(404).json({
                                success: false,
                                error: 'Resource not found'
                            });
                            return [2 /*return*/];
                        }
                        return [4 /*yield*/, this.bookingService.createBooking(bookingRequest)];
                    case 2:
                        result = _a.sent();
                        if (result.success) {
                            res.status(201).json(result);
                        }
                        else {
                            statusCode = result.conflicts && result.conflicts.length > 0 ? 409 : 400;
                            res.status(statusCode).json(result);
                        }
                        return [3 /*break*/, 4];
                    case 3:
                        error_1 = _a.sent();
                        console.error('Error in createBooking:', error_1);
                        res.status(500).json({
                            success: false,
                            error: 'Internal server error'
                        });
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * GET /availability - Get available time slots
     */
    BookingController.prototype.getAvailability = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var validationResult, availabilityRequest, resourceExists, result, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        validationResult = AvailabilityQuerySchema.safeParse(req.query);
                        if (!validationResult.success) {
                            res.status(400).json({
                                success: false,
                                error: 'Validation failed',
                                details: validationResult.error.errors
                            });
                            return [2 /*return*/];
                        }
                        availabilityRequest = validationResult.data;
                        return [4 /*yield*/, this.availabilityService.resourceExists(availabilityRequest.resourceId)];
                    case 1:
                        resourceExists = _a.sent();
                        if (!resourceExists) {
                            res.status(404).json({
                                success: false,
                                error: 'Resource not found'
                            });
                            return [2 /*return*/];
                        }
                        return [4 /*yield*/, this.availabilityService.getAvailability(availabilityRequest)];
                    case 2:
                        result = _a.sent();
                        res.status(200).json(result);
                        return [3 /*break*/, 4];
                    case 3:
                        error_2 = _a.sent();
                        console.error('Error in getAvailability:', error_2);
                        res.status(500).json({
                            success: false,
                            error: 'Internal server error'
                        });
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * DELETE /bookings/:id - Cancel a booking
     */
    BookingController.prototype.cancelBooking = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var bookingId, requestBody, validationResult, cancelRequest, existingBooking, result, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        bookingId = req.params.id;
                        // Validate booking ID format
                        if (!zod_1.z.string().uuid().safeParse(bookingId).success) {
                            res.status(400).json({
                                success: false,
                                error: 'Invalid booking ID format'
                            });
                            return [2 /*return*/];
                        }
                        requestBody = __assign(__assign({}, req.body), { bookingId: bookingId });
                        validationResult = CancelBookingSchema.safeParse(requestBody);
                        if (!validationResult.success) {
                            res.status(400).json({
                                success: false,
                                error: 'Validation failed',
                                details: validationResult.error.errors
                            });
                            return [2 /*return*/];
                        }
                        cancelRequest = validationResult.data;
                        return [4 /*yield*/, this.bookingService.getBookingById(bookingId)];
                    case 1:
                        existingBooking = _a.sent();
                        if (!existingBooking) {
                            res.status(404).json({
                                success: false,
                                error: 'Booking not found'
                            });
                            return [2 /*return*/];
                        }
                        return [4 /*yield*/, this.bookingService.cancelBooking(cancelRequest)];
                    case 2:
                        result = _a.sent();
                        if (result.success) {
                            res.status(200).json(result);
                        }
                        else {
                            res.status(400).json(result);
                        }
                        return [3 /*break*/, 4];
                    case 3:
                        error_3 = _a.sent();
                        console.error('Error in cancelBooking:', error_3);
                        res.status(500).json({
                            success: false,
                            error: 'Internal server error'
                        });
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * GET /bookings/:id - Get booking details
     */
    BookingController.prototype.getBooking = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var bookingId, booking, error_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        bookingId = req.params.id;
                        // Validate booking ID format
                        if (!zod_1.z.string().uuid().safeParse(bookingId).success) {
                            res.status(400).json({
                                success: false,
                                error: 'Invalid booking ID format'
                            });
                            return [2 /*return*/];
                        }
                        return [4 /*yield*/, this.bookingService.getBookingById(bookingId)];
                    case 1:
                        booking = _a.sent();
                        if (!booking) {
                            res.status(404).json({
                                success: false,
                                error: 'Booking not found'
                            });
                            return [2 /*return*/];
                        }
                        res.status(200).json({
                            success: true,
                            booking: booking
                        });
                        return [3 /*break*/, 3];
                    case 2:
                        error_4 = _a.sent();
                        console.error('Error in getBooking:', error_4);
                        res.status(500).json({
                            success: false,
                            error: 'Internal server error'
                        });
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * GET /resources/:id/summary - Get resource utilization summary
     */
    BookingController.prototype.getResourceSummary = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var resourceId, startDate, endDate, resourceExists, summary, error_5;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        resourceId = req.params.id;
                        // Validate resource ID format
                        if (!zod_1.z.string().uuid().safeParse(resourceId).success) {
                            res.status(400).json({
                                success: false,
                                error: 'Invalid resource ID format'
                            });
                            return [2 /*return*/];
                        }
                        startDate = req.query.startDate
                            ? new Date(req.query.startDate)
                            : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
                        endDate = req.query.endDate
                            ? new Date(req.query.endDate)
                            : new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);
                        return [4 /*yield*/, this.availabilityService.resourceExists(resourceId)];
                    case 1:
                        resourceExists = _a.sent();
                        if (!resourceExists) {
                            res.status(404).json({
                                success: false,
                                error: 'Resource not found'
                            });
                            return [2 /*return*/];
                        }
                        return [4 /*yield*/, this.availabilityService.getAvailabilitySummary(resourceId, startDate, endDate)];
                    case 2:
                        summary = _a.sent();
                        res.status(200).json({
                            success: true,
                            resourceId: resourceId,
                            period: {
                                startDate: startDate,
                                endDate: endDate
                            },
                            summary: summary
                        });
                        return [3 /*break*/, 4];
                    case 3:
                        error_5 = _a.sent();
                        console.error('Error in getResourceSummary:', error_5);
                        res.status(500).json({
                            success: false,
                            error: 'Internal server error'
                        });
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * GET /health - Health check endpoint
     */
    BookingController.prototype.healthCheck = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                try {
                    // You could add database connectivity check here
                    res.status(200).json({
                        status: 'healthy',
                        timestamp: new Date().toISOString(),
                        version: '1.0.0'
                    });
                }
                catch (error) {
                    res.status(500).json({
                        status: 'unhealthy',
                        error: error instanceof Error ? error.message : 'Unknown error'
                    });
                }
                return [2 /*return*/];
            });
        });
    };
    return BookingController;
}());
exports.BookingController = BookingController;
