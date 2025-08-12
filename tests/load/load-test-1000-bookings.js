import { check, sleep } from 'k6';
import http from 'k6/http';
import { Counter, Rate, Trend } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const bookingCreationRate = new Rate('booking_creation_success');
const availabilityCheckRate = new Rate('availability_check_success');
const conflictDetectionRate = new Rate('conflict_detection_success');

// Performance trends
const bookingCreationTime = new Trend('booking_creation_time');
const availabilityCheckTime = new Trend('availability_check_time');
const conflictDetectionTime = new Trend('conflict_detection_time');

// Counters
const totalBookingsCreated = new Counter('total_bookings_created');
const totalAvailabilityChecks = new Counter('total_availability_checks');
const totalConflictChecks = new Counter('total_conflict_checks');

// Test configuration for 1000 bookings over 1 hour
export const options = {
  stages: [
    { duration: '5m', target: 50 },    // Ramp up to 50 users over 5 minutes
    { duration: '10m', target: 100 },  // Ramp up to 100 users over 10 minutes
    { duration: '30m', target: 100 },  // Stay at 100 users for 30 minutes (peak load)
    { duration: '10m', target: 50 },   // Ramp down to 50 users over 10 minutes
    { duration: '5m', target: 0 },     // Ramp down to 0 users over 5 minutes
  ],
  thresholds: {
    http_req_duration: ['p(95)<1000'],     // 95% of requests must complete below 1 second
    http_req_duration: ['p(99)<2000'],     // 99% of requests must complete below 2 seconds
    errors: ['rate<0.05'],                 // Error rate must be below 5%
    http_reqs: ['rate>100'],               // Request rate should be above 100 req/s during peak
    'booking_creation_success': ['rate>0.95'], // 95% booking creation success rate
    'availability_check_success': ['rate>0.98'], // 98% availability check success rate
  },
};

const BASE_URL = 'http://localhost:3000/api/v1';

// Sample resource IDs (you may need to update these based on your test data)
const RESOURCE_IDS = [
  '550e8400-e29b-41d4-a716-446655440001',
  '550e8400-e29b-41d4-a716-446655440002',
  '550e8400-e716-446655440003',
  '550e8400-e29b-41d4-a716-446655440004',
  '550e8400-e29b-41d4-a716-446655440005'
];

// Generate realistic booking data for different time slots
function generateBookingData() {
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  
  // Generate bookings for the next 7 days
  const daysOffset = Math.floor(Math.random() * 7);
  const targetDate = new Date(tomorrow.getTime() + (daysOffset * 24 * 60 * 60 * 1000));
  
  // Business hours: 9 AM to 6 PM
  const startHour = 9 + Math.floor(Math.random() * 8); // 9 AM to 5 PM
  const startMinute = Math.floor(Math.random() * 4) * 15; // 0, 15, 30, 45 minutes
  
  const startTime = new Date(targetDate);
  startTime.setHours(startHour, startMinute, 0, 0);
  
  // Duration: 30 minutes to 2 hours
  const durationMinutes = [30, 45, 60, 90, 120][Math.floor(Math.random() * 5)];
  const endTime = new Date(startTime.getTime() + (durationMinutes * 60 * 1000));
  
  // Ensure end time doesn't exceed 6 PM
  if (endTime.getHours() > 18) {
    endTime.setHours(18, 0, 0, 0);
    startTime.setTime(endTime.getTime() - (durationMinutes * 60 * 1000));
  }
  
  return {
    resourceId: RESOURCE_IDS[Math.floor(Math.random() * RESOURCE_IDS.length)],
    title: `Load Test Meeting ${Math.floor(Math.random() * 10000)}`,
    description: `Automated load test booking - ${durationMinutes} min meeting`,
    startTime: startTime.toISOString(),
    endTime: endTime.toISOString(),
    createdBy: `load-test-user-${__VU}-${Math.floor(Math.random() * 1000)}`
  };
}

// Generate recurring booking data
function generateRecurringBookingData() {
  const baseData = generateBookingData();
  const recurrenceTypes = ['DAILY', 'WEEKLY', 'MONTHLY'];
  const recurrenceType = recurrenceTypes[Math.floor(Math.random() * recurrenceTypes.length)];
  
  let recurrenceRule = '';
  switch (recurrenceType) {
    case 'DAILY':
      recurrenceRule = 'FREQ=DAILY;COUNT=5'; // 5 daily occurrences
      break;
    case 'WEEKLY':
      recurrenceRule = 'FREQ=WEEKLY;COUNT=4;BYDAY=MO,WE,FR'; // 4 weekly occurrences on Mon, Wed, Fri
      break;
    case 'MONTHLY':
      recurrenceRule = 'FREQ=MONTHLY;COUNT=3'; // 3 monthly occurrences
      break;
  }
  
  return {
    ...baseData,
    recurrenceRule,
    isRecurring: true
  };
}

// Main test function
export default function () {
  const scenarios = [
    'healthCheck',
    'checkAvailability', 
    'createBooking',
    'createRecurringBooking',
    'getBookingDetails',
    'checkConflicts',
    'bulkAvailabilityCheck'
  ];
  
  // Weighted scenario selection for realistic load
  const weights = [5, 35, 25, 10, 15, 8, 2]; // Health, availability, create, recurring, get, conflicts, bulk
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
  const random = Math.random() * totalWeight;
  
  let selectedScenario = scenarios[0];
  let currentWeight = 0;
  
  for (let i = 0; i < scenarios.length; i++) {
    currentWeight += weights[i];
    if (random <= currentWeight) {
      selectedScenario = scenarios[i];
      break;
    }
  }
  
  switch (selectedScenario) {
    case 'healthCheck':
      testHealthCheck();
      break;
    case 'checkAvailability':
      testCheckAvailability();
      break;
    case 'createBooking':
      testCreateBooking();
      break;
    case 'createRecurringBooking':
      testCreateRecurringBooking();
      break;
    case 'getBookingDetails':
      testGetBookingDetails();
      break;
    case 'checkConflicts':
      testCheckConflicts();
      break;
    case 'bulkAvailabilityCheck':
      testBulkAvailabilityCheck();
      break;
  }
  
  // Random delay between requests (0.5 to 2 seconds)
  sleep(0.5 + Math.random() * 1.5);
}

function testHealthCheck() {
  const response = http.get(`${BASE_URL}/health`);
  const isSuccess = check(response, {
    'health check status is 200': (r) => r.status === 200,
    'health check response time < 100ms': (r) => r.timings.duration < 100,
  });
  
  if (!isSuccess) {
    errorRate.add(1);
  }
}

function testCheckAvailability() {
  const bookingData = generateBookingData();
  const params = {
    resourceId: bookingData.resourceId,
    startTime: bookingData.startTime,
    endTime: bookingData.endTime,
  };
  
  const startTime = Date.now();
  const response = http.get(`${BASE_URL}/availability`, { params });
  const duration = Date.now() - startTime;
  
  const isSuccess = check(response, {
    'availability check status is 200': (r) => r.status === 200,
    'availability check response time < 500ms': (r) => r.timings.duration < 500,
    'availability response has correct structure': (r) => {
      try {
        const data = JSON.parse(r.body);
        return data.hasOwnProperty('available') && data.hasOwnProperty('conflicts');
      } catch {
        return false;
      }
    },
  });
  
  if (isSuccess) {
    availabilityCheckRate.add(1);
    totalAvailabilityChecks.add(1);
    availabilityCheckTime.add(duration);
  } else {
    errorRate.add(1);
  }
}

function testCreateBooking() {
  const bookingData = generateBookingData();
  
  const startTime = Date.now();
  const response = http.post(`${BASE_URL}/bookings`, JSON.stringify(bookingData), {
    headers: {
      'Content-Type': 'application/json',
    },
  });
  const duration = Date.now() - startTime;
  
  const isSuccess = check(response, {
    'booking creation status is 201': (r) => r.status === 201,
    'booking creation response time < 1000ms': (r) => r.timings.duration < 1000,
    'booking response has correct structure': (r) => {
      try {
        const data = JSON.parse(r.body);
        return data.hasOwnProperty('id') && data.hasOwnProperty('startTime');
      } catch {
        return false;
      }
    },
  });
  
  if (isSuccess) {
    bookingCreationRate.add(1);
    totalBookingsCreated.add(1);
    bookingCreationTime.add(duration);
  } else {
    errorRate.add(1);
  }
}

function testCreateRecurringBooking() {
  const bookingData = generateRecurringBookingData();
  
  const startTime = Date.now();
  const response = http.post(`${BASE_URL}/bookings/recurring`, JSON.stringify(bookingData), {
    headers: {
      'Content-Type': 'application/json',
    },
  });
  const duration = Date.now() - startTime;
  
  const isSuccess = check(response, {
    'recurring booking creation status is 201': (r) => r.status === 201,
    'recurring booking creation response time < 1500ms': (r) => r.timings.duration < 1500,
    'recurring booking response has correct structure': (r) => {
      try {
        const data = JSON.parse(r.body);
        return data.hasOwnProperty('id') && data.hasOwnProperty('recurrenceRule');
      } catch {
        return false;
      }
    },
  });
  
  if (isSuccess) {
    bookingCreationRate.add(1);
    totalBookingsCreated.add(1);
    bookingCreationTime.add(duration);
  } else {
    errorRate.add(1);
  }
}

function testGetBookingDetails() {
  // For this test, we'll use a mock ID since we don't have real booking IDs
  const mockBookingId = '550e8400-e29b-41d4-a716-446655440000';
  
  const response = http.get(`${BASE_URL}/bookings/${mockBookingId}`);
  
  check(response, {
    'get booking status is 200 or 404': (r) => r.status === 200 || r.status === 404,
    'get booking response time < 300ms': (r) => r.timings.duration < 300,
  });
}

function testCheckConflicts() {
  const bookingData = generateBookingData();
  const params = {
    resourceId: bookingData.resourceId,
    startTime: bookingData.startTime,
    endTime: bookingData.endTime,
  };
  
  const startTime = Date.now();
  const response = http.get(`${BASE_URL}/conflicts`, { params });
  const duration = Date.now() - startTime;
  
  const isSuccess = check(response, {
    'conflict check status is 200': (r) => r.status === 200,
    'conflict check response time < 800ms': (r) => r.timings.duration < 800,
    'conflict response has correct structure': (r) => {
      try {
        const data = JSON.parse(r.body);
        return Array.isArray(data);
      } catch {
        return false;
      }
    },
  });
  
  if (isSuccess) {
    conflictDetectionRate.add(1);
    totalConflictChecks.add(1);
    conflictDetectionTime.add(duration);
  } else {
    errorRate.add(1);
  }
}

function testBulkAvailabilityCheck() {
  // Check availability for multiple time slots
  const resourceId = RESOURCE_IDS[Math.floor(Math.random() * RESOURCE_IDS.length)];
  const timeSlots = [];
  
  // Generate 3-5 time slots for bulk check
  const numSlots = 3 + Math.floor(Math.random() * 3);
  for (let i = 0; i < numSlots; i++) {
    const slot = generateBookingData();
    timeSlots.push({
      startTime: slot.startTime,
      endTime: slot.endTime
    });
  }
  
  const payload = {
    resourceId,
    timeSlots
  };
  
  const response = http.post(`${BASE_URL}/availability/bulk`, JSON.stringify(payload), {
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  check(response, {
    'bulk availability check status is 200': (r) => r.status === 200,
    'bulk availability check response time < 2000ms': (r) => r.timings.duration < 2000,
    'bulk availability response has correct structure': (r) => {
      try {
        const data = JSON.parse(r.body);
        return Array.isArray(data) && data.length === numSlots;
      } catch {
        return false;
      }
    },
  });
}

// Setup function to run before the test
export function setup() {
  console.log('🚀 Starting load test for 1000 bookings over 1 hour');
  console.log('📊 Target: 1000 bookings with realistic patterns');
  console.log('⏱️  Duration: 1 hour with peak load at 100 concurrent users');
  console.log('🎯 Scenarios: Health, Availability, Booking Creation, Recurring, Conflicts');
}

// Teardown function to run after the test
export function teardown(data) {
  console.log('✅ Load test completed');
  console.log(`📈 Total bookings created: ${totalBookingsCreated.name}`);
  console.log(`🔍 Total availability checks: ${totalAvailabilityChecks.name}`);
  console.log(`⚠️  Total conflict checks: ${totalConflictChecks.name}`);
} 