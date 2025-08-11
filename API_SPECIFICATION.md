# HighLevel Booking Platform API Specification

## Overview
RESTful API for managing single and recurring appointments with advanced conflict detection and availability optimization.

**Base URL:** `http://localhost:3000/api/v1`  
**Version:** 1.0.0  
**Content-Type:** `application/json`

## Authentication
Currently uses basic request validation. Production deployment should implement JWT or API key authentication.

## Core Endpoints

### 1. Create Booking
**Endpoint:** `POST /bookings`

**Description:** Create a single booking or recurring series with automatic conflict detection.

**Request Body:**
```json
{
  "resourceId": "string (UUID, required)",
  "title": "string (required, max 255 chars)",
  "description": "string (optional, max 1000 chars)",
  "startTime": "string (ISO 8601 datetime, required)",
  "endTime": "string (ISO 8601 datetime, required)",
  "recurrenceRule": "string (RRULE format, optional)",
  "createdBy": "string (optional, max 255 chars)"
}
```

**Responses:**

**201 Created - Success:**
```json
{
  "success": true,
  "booking": {
    "id": "uuid",
    "resourceId": "uuid",
    "title": "Meeting Title",
    "description": "Meeting Description",
    "startTime": "2025-01-20T09:00:00Z",
    "endTime": "2025-01-20T10:00:00Z",
    "isRecurring": false,
    "recurrenceRule": null,
    "seriesId": null,
    "createdBy": "user@example.com",
    "createdAt": "2025-01-15T10:30:00Z",
    "updatedAt": "2025-01-15T10:30:00Z"
  }
}
```

**409 Conflict - Time slot conflicts:**
```json
{
  "success": false,
  "error": "Time slot conflicts with existing bookings",
  "conflicts": [
    {
      "id": "uuid",
      "title": "Existing Meeting",
      "startTime": "2025-01-20T09:00:00Z",
      "endTime": "2025-01-20T10:00:00Z",
      "bookingType": "single"
    }
  ],
  "suggestions": [
    {
      "startTime": "2025-01-20T10:00:00Z",
      "endTime": "2025-01-20T11:00:00Z",
      "duration": 60
    },
    {
      "startTime": "2025-01-20T11:00:00Z",
      "endTime": "2025-01-20T12:00:00Z",
      "duration": 60
    }
  ]
}
```

### 2. Check Availability
**Endpoint:** `GET /availability`

**Description:** Get available time slots for a resource within a date range.

**Query Parameters:**
- `resourceId` (required): UUID of the resource
- `startDate` (required): ISO 8601 datetime for range start
- `endDate` (required): ISO 8601 datetime for range end
- `duration` (optional): Duration in minutes (default: 60)

**Example Request:**
```
GET /availability?resourceId=550e8400-e29b-41d4-a716-446655440001&startDate=2025-01-20T00:00:00Z&endDate=2025-01-21T23:59:59Z&duration=60
```

**Response:**
```json
{
  "success": true,
  "resourceId": "550e8400-e29b-41d4-a716-446655440001",
  "requestedRange": {
    "startDate": "2025-01-20T00:00:00Z",
    "endDate": "2025-01-21T23:59:59Z"
  },
  "availableSlots": [
    {
      "startTime": "2025-01-20T09:00:00Z",
      "endTime": "2025-01-20T10:00:00Z",
      "duration": 60
    },
    {
      "startTime": "2025-01-20T10:30:00Z",
      "endTime": "2025-01-20T11:30:00Z",
      "duration": 60
    }
  ],
  "totalSlots": 2
}
```

### 3. Get Booking Details
**Endpoint:** `GET /bookings/{id}`

**Description:** Retrieve detailed information about a specific booking.

**Path Parameters:**
- `id` (required): UUID of the booking

**Response:**
```json
{
  "success": true,
  "booking": {
    "id": "uuid",
    "resourceId": "uuid",
    "title": "Weekly Team Standup",
    "description": "Daily development team meeting",
    "startTime": "2025-01-20T09:00:00Z",
    "endTime": "2025-01-20T09:30:00Z",
    "isRecurring": true,
    "recurrenceRule": "FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR;COUNT=50",
    "seriesId": "uuid",
    "createdBy": "team.lead",
    "createdAt": "2025-01-15T10:30:00Z",
    "updatedAt": "2025-01-15T10:30:00Z"
  }
}
```

### 4. Cancel Booking
**Endpoint:** `DELETE /bookings/{id}`

**Description:** Cancel a booking (single, entire series, or specific instance).

**Path Parameters:**
- `id` (required): UUID of the booking

**Request Body:**
```json
{
  "cancelType": "single|series|instance",
  "instanceDate": "string (ISO 8601 date, required for instance type)"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Booking cancelled successfully",
  "affectedInstances": 1
}
```

### 5. Resource Utilization Summary
**Endpoint:** `GET /resources/{id}/summary`

**Description:** Get resource utilization metrics for a time period.

**Path Parameters:**
- `id` (required): UUID of the resource

**Query Parameters:**
- `startDate` (optional): ISO 8601 date (default: current month start)
- `endDate` (optional): ISO 8601 date (default: current month end)

**Response:**
```json
{
  "success": true,
  "resourceId": "uuid",
  "period": {
    "startDate": "2025-01-01T00:00:00Z",
    "endDate": "2025-01-31T23:59:59Z"
  },
  "summary": {
    "totalBusinessHours": 168,
    "bookedHours": 42.5,
    "availableHours": 125.5,
    "utilizationRate": 25.3,
    "busyDays": ["2025-01-15", "2025-01-16"],
    "availableDays": ["2025-01-17", "2025-01-18"]
  }
}
```

## Recurrence Rules (RRULE)

The API supports RFC 5545 compliant recurrence rules:

### Common Examples

```javascript
// Daily for 10 days
"FREQ=DAILY;COUNT=10"

// Weekdays only (Mon-Fri) for 4 weeks  
"FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR;COUNT=20"

// Every 2 weeks on Monday and Wednesday for 10 occurrences
"FREQ=WEEKLY;INTERVAL=2;BYDAY=MO,WE;COUNT=10"

// Monthly on the 15th until end of year
"FREQ=MONTHLY;BYMONTHDAY=15;UNTIL=20251231T235959Z"

// Infinite weekly meetings (use with caution)
"FREQ=WEEKLY;BYDAY=MO"
```

### Supported Parameters
- `FREQ`: DAILY, WEEKLY, MONTHLY, YEARLY
- `INTERVAL`: Every N periods (default: 1)
- `COUNT`: Number of occurrences
- `UNTIL`: End date (ISO 8601 format)
- `BYDAY`: Days of week (MO, TU, WE, TH, FR, SA, SU)
- `BYMONTHDAY`: Day of month (1-31)
- `BYMONTH`: Month (1-12)

## Error Responses

### Standard Error Format
```json
{
  "success": false,
  "error": "Error message",
  "details": "Additional error details (development only)"
}
```

### HTTP Status Codes
- `200 OK` - Successful operation
- `201 Created` - Resource created successfully
- `400 Bad Request` - Invalid input or validation error
- `404 Not Found` - Resource not found
- `409 Conflict` - Booking conflicts with existing reservations
- `500 Internal Server Error` - Server error

### Validation Errors
```json
{
  "success": false,
  "error": "Validation failed",
  "details": [
    {
      "field": "startTime",
      "message": "Invalid start time format",
      "code": "invalid_type"
    }
  ]
}
```

## Rate Limiting

**Current Limits:**
- 1000 requests per hour per IP
- 100 booking creations per hour per IP

**Headers:**
- `X-RateLimit-Limit`: Request limit
- `X-RateLimit-Remaining`: Remaining requests
- `X-RateLimit-Reset`: Reset time (Unix timestamp)

## Performance Characteristics

### Response Time Targets
- Health check: < 100ms
- Availability queries: < 300ms
- Single booking creation: < 500ms
- Recurring booking creation: < 1000ms

### Load Testing Results
- **Normal Load**: 50+ req/s sustained, P95 < 500ms
- **Spike Load**: 200+ req/s peak, P95 < 2s during spike
- **Error Rate**: < 10% under normal load, < 20% during spikes

## Business Rules

### Booking Constraints
- Bookings cannot be created in the past
- Start time must be before end time
- Minimum booking duration: 15 minutes
- Maximum booking duration: 8 hours
- Business hours: 9 AM - 5 PM, Monday-Friday

### Conflict Resolution
- Overlapping bookings are rejected
- Alternative time slots are suggested
- Recurring series conflicts are detected across all instances
- Cancelled instances of recurring series are excluded from conflicts

### Availability Logic
- 30-minute time slot granularity
- Business hours only (weekdays 9 AM - 5 PM)
- Considers both single and recurring bookings
- Excludes cancelled instances

## Development & Testing

### Local Development
```bash
npm run dev  # Start development server with hot reload
npm test     # Run unit tests
npm run load-test  # Run load testing
npm run spike-test # Run spike testing
```

### Environment Variables
```bash
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=booking_platform
DB_USER=username
DB_PASSWORD=password
NODE_ENV=development
```

---

**API Version**: 1.0.0  
**Last Updated**: January 2025  
**Contact**: Development Team