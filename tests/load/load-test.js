import { check, sleep } from 'k6';
import http from 'k6/http';
import { Rate } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');

// Test configuration
export const options = {
  stages: [
    { duration: '2m', target: 10 },   // Ramp up to 10 users over 2 minutes
    { duration: '5m', target: 10 },   // Stay at 10 users for 5 minutes
    { duration: '3m', target: 20 },   // Ramp up to 20 users over 3 minutes
    { duration: '5m', target: 20 },   // Stay at 20 users for 5 minutes
    { duration: '2m', target: 0 },    // Ramp down to 0 users over 2 minutes
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests must complete below 500ms
    errors: ['rate<0.1'],             // Error rate must be below 10%
    http_reqs: ['rate>50'],           // Request rate should be above 50 req/s during peak
  },
};

const BASE_URL = 'http://localhost:3000/api/v1';

// Sample resource IDs (you may need to update these based on your test data)
const RESOURCE_IDS = [
  '550e8400-e29b-41d4-a716-446655440001',
  '550e8400-e29b-41d4-a716-446655440002',
  '550e8400-e29b-41d4-a716-446655440003'
];

// Generate random booking data
function generateBookingData() {
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const startTime = new Date(tomorrow.getTime() + Math.random() * 8 * 60 * 60 * 1000); // Random time tomorrow
  const endTime = new Date(startTime.getTime() + (30 + Math.random() * 90) * 60 * 1000); // 30-120 min duration
  
  return {
    resourceId: RESOURCE_IDS[Math.floor(Math.random() * RESOURCE_IDS.length)],
    title: `Load Test Meeting ${Math.floor(Math.random() * 10000)}`,
    description: 'Automated load test booking',
    startTime: startTime.toISOString(),
    endTime: endTime.toISOString(),
    createdBy: `load-test-user-${__VU}`
  };
}

export default function () {
  const scenarios = [
    'healthCheck',
    'checkAvailability', 
    'createBooking',
    'getBookingDetails',
    'createRecurringBooking'
  ];
  
  // Randomly choose a scenario (weighted towards common operations)
  const weights = [10, 40, 30, 15, 5]; // Health check, availability, create, get, recurring
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
    case 'getBookingDetails':
      testGetBookingDetails();
      break;
    case 'createRecurringBooking':
      testCreateRecurringBooking();
      break;
  }
  
  sleep(1); // 1 second delay between requests
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
  const resourceId = RESOURCE_IDS[Math.floor(Math.random() * RESOURCE_IDS.length)];
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dayAfter = new Date(tomorrow);
  dayAfter.setDate(dayAfter.getDate() + 1);
  
  const params = {
    resourceId: resourceId,
    startDate: tomorrow.toISOString(),
    endDate: dayAfter.toISOString(),
    duration: '60'
  };
  
  const url = `${BASE_URL}/availability?${Object.keys(params).map(key => `${key}=${encodeURIComponent(params[key])}`).join('&')}`;
  const response = http.get(url);
  
  const isSuccess = check(response, {
    'availability check status is 200': (r) => r.status === 200,
    'availability response time < 300ms': (r) => r.timings.duration < 300,
    'availability response has slots array': (r) => {
      try {
        const data = JSON.parse(r.body);
        return Array.isArray(data.availableSlots);
      } catch {
        return false;
      }
    },
  });
  
  if (!isSuccess) {
    errorRate.add(1);
  }
}

function testCreateBooking() {
  const bookingData = generateBookingData();
  
  const response = http.post(
    `${BASE_URL}/bookings`,
    JSON.stringify(bookingData),
    {
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
  
  const isSuccess = check(response, {
    'booking creation status is 201 or 409': (r) => r.status === 201 || r.status === 409, // 409 for conflicts is acceptable
    'booking response time < 500ms': (r) => r.timings.duration < 500,
    'booking response has success field': (r) => {
      try {
        const data = JSON.parse(r.body);
        return typeof data.success === 'boolean';
      } catch {
        return false;
      }
    },
  });
  
  if (!isSuccess) {
    errorRate.add(1);
  }
  
  // If booking was created successfully, store the ID for later use
  if (response.status === 201) {
    try {
      const data = JSON.parse(response.body);
      if (data.booking && data.booking.id) {
        // Store booking ID in global state for other tests
        if (!global.createdBookings) {
          global.createdBookings = [];
        }
        global.createdBookings.push(data.booking.id);
      }
    } catch (e) {
      // Ignore parsing errors
    }
  }
}

function testGetBookingDetails() {
  // Use a recently created booking ID if available, otherwise use a random UUID
  let bookingId;
  
  if (global.createdBookings && global.createdBookings.length > 0) {
    bookingId = global.createdBookings[Math.floor(Math.random() * global.createdBookings.length)];
  } else {
    // Use a sample booking ID (this might return 404, which is acceptable for load testing)
    bookingId = '550e8400-e29b-41d4-a716-446655440010';
  }
  
  const response = http.get(`${BASE_URL}/bookings/${bookingId}`);
  
  const isSuccess = check(response, {
    'get booking status is 200 or 404': (r) => r.status === 200 || r.status === 404,
    'get booking response time < 200ms': (r) => r.timings.duration < 200,
  });
  
  if (!isSuccess) {
    errorRate.add(1);
  }
}

function testCreateRecurringBooking() {
  const bookingData = generateBookingData();
  
  // Add recurrence rule for weekly meetings
  bookingData.recurrenceRule = 'FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR;COUNT=10';
  bookingData.title = `Recurring Load Test Meeting ${Math.floor(Math.random() * 10000)}`;
  
  const response = http.post(
    `${BASE_URL}/bookings`,
    JSON.stringify(bookingData),
    {
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
  
  const isSuccess = check(response, {
    'recurring booking creation status is 201 or 409': (r) => r.status === 201 || r.status === 409,
    'recurring booking response time < 1000ms': (r) => r.timings.duration < 1000, // Allow more time for recurring bookings
    'recurring booking response has success field': (r) => {
      try {
        const data = JSON.parse(r.body);
        return typeof data.success === 'boolean';
      } catch {
        return false;
      }
    },
  });
  
  if (!isSuccess) {
    errorRate.add(1);
  }
}

// Export function for teardown
export function teardown(data) {
  console.log('Load test completed.');
  console.log(`Created bookings: ${global.createdBookings ? global.createdBookings.length : 0}`);
}