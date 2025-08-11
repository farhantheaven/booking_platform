"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRoutes = void 0;
var express_1 = require("express");
var BookingController_1 = require("../controllers/BookingController");
var BookingService_1 = require("../services/BookingService");
var RecurrenceService_1 = require("../services/RecurrenceService");
var ConflictDetectionService_1 = require("../services/ConflictDetectionService");
var AvailabilityService_1 = require("../services/AvailabilityService");
var createRoutes = function (db) {
    var router = (0, express_1.Router)();
    // Initialize services
    var recurrenceService = new RecurrenceService_1.RecurrenceService();
    var conflictService = new ConflictDetectionService_1.ConflictDetectionService(db, recurrenceService);
    var availabilityService = new AvailabilityService_1.AvailabilityService(db, conflictService, recurrenceService);
    var bookingService = new BookingService_1.BookingService(db, recurrenceService, conflictService, availabilityService);
    // Initialize controller
    var bookingController = new BookingController_1.BookingController(bookingService, availabilityService);
    // Health check
    router.get('/health', bookingController.healthCheck);
    // Booking routes
    router.post('/bookings', bookingController.createBooking);
    router.get('/bookings/:id', bookingController.getBooking);
    router.delete('/bookings/:id', bookingController.cancelBooking);
    // Availability routes
    router.get('/availability', bookingController.getAvailability);
    // Resource summary
    router.get('/resources/:id/summary', bookingController.getResourceSummary);
    // API documentation endpoint
    router.get('/api-docs', function (req, res) {
        res.json({
            title: 'HighLevel Booking Platform API',
            version: '1.0.0',
            description: 'APIs for booking single or recurring appointments',
            endpoints: {
                'POST /bookings': {
                    description: 'Create a new booking (single or recurring)',
                    body: {
                        resourceId: 'string (UUID) - Required',
                        title: 'string - Required',
                        description: 'string - Optional',
                        startTime: 'string (ISO datetime) - Required',
                        endTime: 'string (ISO datetime) - Required',
                        recurrenceRule: 'string (RRULE) - Optional',
                        createdBy: 'string - Optional'
                    },
                    responses: {
                        201: 'Booking created successfully',
                        400: 'Validation error',
                        404: 'Resource not found',
                        409: 'Conflict with existing bookings'
                    }
                },
                'GET /availability': {
                    description: 'Get available time slots for a resource',
                    query: {
                        resourceId: 'string (UUID) - Required',
                        startDate: 'string (ISO datetime) - Required',
                        endDate: 'string (ISO datetime) - Required',
                        duration: 'number (minutes) - Optional, default 60'
                    },
                    responses: {
                        200: 'Available slots returned',
                        400: 'Validation error',
                        404: 'Resource not found'
                    }
                },
                'DELETE /bookings/:id': {
                    description: 'Cancel a booking',
                    body: {
                        cancelType: 'enum [single, series, instance] - Required',
                        instanceDate: 'string (ISO datetime) - Required for instance type'
                    },
                    responses: {
                        200: 'Booking cancelled successfully',
                        400: 'Validation error',
                        404: 'Booking not found'
                    }
                },
                'GET /bookings/:id': {
                    description: 'Get booking details',
                    responses: {
                        200: 'Booking details returned',
                        400: 'Invalid booking ID',
                        404: 'Booking not found'
                    }
                },
                'GET /resources/:id/summary': {
                    description: 'Get resource utilization summary',
                    query: {
                        startDate: 'string (ISO date) - Optional',
                        endDate: 'string (ISO date) - Optional'
                    },
                    responses: {
                        200: 'Summary returned',
                        404: 'Resource not found'
                    }
                },
                'GET /health': {
                    description: 'Health check endpoint',
                    responses: {
                        200: 'Service is healthy',
                        500: 'Service is unhealthy'
                    }
                }
            },
            examples: {
                createSingleBooking: {
                    resourceId: '550e8400-e29b-41d4-a716-446655440001',
                    title: 'Project Meeting',
                    description: 'Weekly project sync meeting',
                    startTime: '2025-01-20T14:00:00Z',
                    endTime: '2025-01-20T15:00:00Z',
                    createdBy: 'john.doe'
                },
                createRecurringBooking: {
                    resourceId: '550e8400-e29b-41d4-a716-446655440001',
                    title: 'Weekly Standup',
                    description: 'Daily team standup meeting',
                    startTime: '2025-01-20T09:00:00Z',
                    endTime: '2025-01-20T09:30:00Z',
                    recurrenceRule: 'FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR;COUNT=50',
                    createdBy: 'team.lead'
                },
                rruleExamples: {
                    daily: 'FREQ=DAILY;COUNT=10',
                    weekdays: 'FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR;COUNT=20',
                    weekly: 'FREQ=WEEKLY;COUNT=10',
                    monthly: 'FREQ=MONTHLY;BYMONTHDAY=15;COUNT=12',
                    infinite: 'FREQ=WEEKLY;BYDAY=MO'
                }
            }
        });
    });
    return router;
};
exports.createRoutes = createRoutes;
