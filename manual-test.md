# Manual Testing Guide for Improved Conflict Detection

## 🎯 **Enhanced Exception Handling Test Scenarios**

### **Scenario 1: Single Booking with Cancellation Exception**
```bash
# 1. Create a single booking
curl -X POST "http://localhost:3000/api/v1/bookings" \
  -H "Content-Type: application/json" \
  -d '{
    "resourceId": "550e8400-e29b-41d4-a716-446655440001",
    "title": "Single Meeting",
    "startTime": "2025-08-12T10:00:00Z",
    "endTime": "2025-08-12T11:00:00Z",
    "createdBy": "user@company.com"
  }'

# 2. Add cancellation exception to that booking
curl -X POST "http://localhost:3000/api/v1/bookings/BOOKING_ID_HERE/exceptions" \
  -H "Content-Type: application/json" \
  -d '{
    "exceptionDate": "2025-08-12",
    "exceptionType": "cancelled"
  }'

# 3. Try to book the same time slot (should succeed - no conflict)
curl -X POST "http://localhost:3000/api/v1/bookings" \
  -H "Content-Type: application/json" \
  -d '{
    "resourceId": "550e8400-e29b-41d4-a716-446655440001",
    "title": "New Meeting in Cancelled Slot",
    "startTime": "2025-08-12T10:00:00Z",
    "endTime": "2025-08-12T11:00:00Z",
    "createdBy": "newuser@company.com"
  }'
```

**Expected Result:** ✅ **SUCCESS** - The new booking should be created because the original slot is cancelled.

---

### **Scenario 2: Recurring Booking with Specific Instance Cancellation**
```bash
# 1. Create a recurring weekly meeting
curl -X POST "http://localhost:3000/api/v1/bookings" \
  -H "Content-Type: application/json" \
  -d '{
    "resourceId": "550e8400-e29b-41d4-a716-446655440001",
    "title": "Weekly Team Standup",
    "startTime": "2025-08-12T09:00:00Z",
    "endTime": "2025-08-12T09:30:00Z",
    "recurrenceRule": "RRULE:FREQ=WEEKLY;BYDAY=MO;COUNT=10",
    "createdBy": "team@company.com"
  }'

# 2. Cancel a specific instance (creates exception automatically)
curl -X DELETE "http://localhost:3000/api/v1/bookings/BOOKING_ID_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "cancelType": "instance",
    "instanceDate": "2025-08-19"
  }'

# 3. Try to book the cancelled instance time (should succeed)
curl -X POST "http://localhost:3000/api/v1/bookings" \
  -H "Content-Type: application/json" \
  -d '{
    "resourceId": "550e8400-e29b-41d4-a716-446655440001",
    "title": "Special Meeting in Cancelled Slot",
    "startTime": "2025-08-19T09:00:00Z",
    "endTime": "2025-08-19T09:30:00Z",
    "createdBy": "special@company.com"
  }'
```

**Expected Result:** ✅ **SUCCESS** - The new booking should be created because that specific instance is cancelled.

---

### **Scenario 3: Recurring Booking with Modification Exception**
```bash
# 1. Create a recurring monthly meeting
curl -X POST "http://localhost:3000/api/v1/bookings" \
  -H "Content-Type: application/json" \
  -d '{
    "resourceId": "550e8400-e29b-41d4-a716-446655440001",
    "title": "Monthly Review",
    "startTime": "2025-08-15T14:00:00Z",
    "endTime": "2025-08-15T15:00:00Z",
    "recurrenceRule": "RRULE:FREQ=MONTHLY;BYMONTHDAY=15;COUNT=12",
    "createdBy": "manager@company.com"
  }'

# 2. Modify a specific instance (creates modification exception)
curl -X POST "http://localhost:3000/api/v1/bookings/BOOKING_ID_HERE/exceptions" \
  -H "Content-Type: application/json" \
  -d '{
    "exceptionDate": "2025-08-15",
    "exceptionType": "modified",
    "newStartTime": "2025-08-15T16:00:00Z",
    "newEndTime": "2025-08-15T17:00:00Z",
    "newTitle": "Modified Monthly Review"
  }'

# 3. Try to book the original time slot (should succeed - it's now available)
curl -X POST "http://localhost:3000/api/v1/bookings" \
  -H "Content-Type: application/json" \
  -d '{
    "resourceId": "550e8400-e29b-41d4-a716-446655440001",
    "title": "New Meeting in Original Slot",
    "startTime": "2025-08-15T14:00:00Z",
    "endTime": "2025-08-15T15:00:00Z",
    "createdBy": "newuser@company.com"
  }'
```

**Expected Result:** ✅ **SUCCESS** - The new booking should be created because the original slot is now available (moved to 4-5 PM).

---

### **Scenario 4: Mixed Single and Recurring with Exceptions**
```bash
# 1. Create a single booking
curl -X POST "http://localhost:3000/api/v1/bookings" \
  -H "Content-Type: application/json" \
  -d '{
    "resourceId": "550e8400-e29b-41d4-a716-446655440001",
    "title": "One-time Meeting",
    "startTime": "2025-08-20T13:00:00Z",
    "endTime": "2025-08-20T14:00:00Z",
    "createdBy": "user@company.com"
  }'

# 2. Create a recurring daily meeting
curl -X POST "http://localhost:3000/api/v1/bookings" \
  -H "Content-Type: application/json" \
  -d '{
    "resourceId": "550e8400-e29b-41d4-a716-446655440001",
    "title": "Daily Check-in",
    "startTime": "2025-08-21T09:00:00Z",
    "endTime": "2025-08-21T09:15:00Z",
    "recurrenceRule": "RRULE:FREQ=DAILY;COUNT=30",
    "createdBy": "team@company.com"
  }'

# 3. Cancel the single booking
curl -X POST "http://localhost:3000/api/v1/bookings/FIRST_BOOKING_ID/exceptions" \
  -H "Content-Type: application/json" \
  -d '{
    "exceptionDate": "2025-08-20",
    "exceptionType": "cancelled"
  }'

# 4. Cancel a specific recurring instance
curl -X DELETE "http://localhost:3000/api/v1/bookings/SECOND_BOOKING_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "cancelType": "instance",
    "instanceDate": "2025-08-25"
  }'

# 5. Try to book both cancelled slots (should both succeed)
curl -X POST "http://localhost:3000/api/v1/bookings" \
  -H "Content-Type: application/json" \
  -d '{
    "resourceId": "550e8400-e29b-41d4-a716-446655440001",
    "title": "Replacement Meeting 1",
    "startTime": "2025-08-20T13:00:00Z",
    "endTime": "2025-08-20T14:00:00Z",
    "createdBy": "replacement@company.com"
  }'

curl -X POST "http://localhost:3000/api/v1/bookings" \
  -H "Content-Type: application/json" \
  -d '{
    "resourceId": "550e8400-e29b-41d4-a716-446655440001",
    "title": "Replacement Meeting 2",
    "startTime": "2025-08-25T09:00:00Z",
    "endTime": "2025-08-25T09:15:00Z",
    "createdBy": "replacement@company.com"
  }'
```

**Expected Result:** ✅ **BOTH SUCCESS** - Both new bookings should be created because both slots are cancelled.

---

## 🔍 **What the Improved System Now Handles**

### **✅ Single Bookings:**
- **Cancellation exceptions** - Cancelled single bookings become available
- **No exceptions** - Normal conflict detection works

### **✅ Recurring Bookings:**
- **Instance cancellations** - Specific occurrences become available
- **Series cancellations** - Entire series becomes available
- **Modification exceptions** - Original time becomes available, new time is occupied

### **✅ Mixed Scenarios:**
- **Single + Recurring** - Both types are handled correctly
- **Multiple exceptions** - Complex scenarios work properly
- **Exception dates** - Date-specific conflict resolution

### **✅ Edge Cases:**
- **No exceptions** - Fallback to normal conflict detection
- **Invalid exceptions** - Graceful error handling
- **Database errors** - Robust error handling

---

## 🚀 **Key Improvements Made**

1. **`isTimeSlotCancelled()` method** - Centralized exception checking
2. **Proper exception handling** - Both single and recurring bookings
3. **Date-specific resolution** - Checks exact dates for conflicts
4. **Comprehensive coverage** - All booking types and exception types
5. **Performance optimized** - Batch processing with early exits

---

## 🧪 **Testing Commands**

Run these scenarios in sequence to verify the improved conflict detection:

```bash
# Test all scenarios
./test-exceptions.sh

# Or run individually
curl -X GET "http://localhost:3000/api/v1/health"
```

The system should now properly handle all the complex scenarios you mentioned! 🎯 