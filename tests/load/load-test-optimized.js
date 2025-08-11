import { check, sleep } from 'k6';
import http from 'k6/http';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics for better monitoring
const errorRate = new Rate('errors');
const bookingSuccessRate = new Rate('booking_success_rate');
const availabilityResponseTime = new Trend('availability_response_time');

// OPTIMIZED Test configuration for better performance
export const options = {
  stages: [
    { duration: '1m', target: 10 },   // Quick ramp up to 10 users
    { duration: '3m', target: 10 },   // Sustain 10 users for 3 minutes
    { duration: '2m', target: 25 },   // Ramp up to 25 users over 2 minutes
    { duration: '3m', target: 25 },   // Sustain 25 users for 3 minutes
    { duration: '1m', target: 0 },    // Quick ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<1000'], // 95% of requests must complete below 1s
    errors: ['rate<0.15'],             // Error rate must be below 15%
    http_reqs: ['rate>30'],            // Request rate should be above 30 req/s
    'availability_response_time': ['p(95)<500'], // Availability checks should be fast
    'booking_success_rate': ['rate>0.8'],       // 80% of bookings should succeed
  },
};

const BASE_URL = 'http://localhost:3000/api/v1';

// OPTIMIZED: Use a smaller set of resource IDs for better performance
const RESOURCE_IDS = [
  '550e8400-e29b-41d4-a716-446655440001', // Main Conference Room
  '550e8400-e29b-41d4-a716-446655440002', // Small Meeting Room
];

// OPTIMIZED: Generate booking data more efficiently
function generateOptimizedBookingData() {
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  
  // OPTIMIZATION: Use fixed time slots instead of random times
  const timeSlots = [
    { start: 9, end: 10 },   // 9:00 AM - 10:00 AM
    { start: 10, end: 11 },  // 10:00 AM - 11:00 AM
    { start: 14, end: 15 },  // 2:00 PM - 3:00 PM
    { start: 15, end: 16 },  // 3:00 PM - 4:00 PM
  ];
  
  const slot = timeSlots[Math.floor(Math.random() * timeSlots.length)];
  const startTime = new Date(tomorrow);
  startTime.setHours(slot.start, 0, 0, 0);
  const endTime = new Date(tomorrow);
  endTime.setHours(slot.end, 0, 0, 0);
  
  return {
    resourceId: RESOURCE_IDS[Math.floor(Math.random() * RESOURCE_IDS.length)],
    title: `Load Test Meeting ${__VU}-${__ITER}`,
    description: 'Optimized load test booking',
    startTime: startTime.toISOString(),
    endTime: endTime.toISOString(),
    createdBy: `load-test-user-${__VU}`
  };
}

export default function () {
  // OPTIMIZATION: Use weighted scenarios for more realistic load
  const scenarios = [
    'healthCheck',
    'checkAvailability', 
    'createBooking',
    'getBookingDetails'
  ];
  
  // OPTIMIZATION: Weighted towards availability checks (most common)
  const weights = [5, 60, 25, 10]; // Health: 5%, Availability: 60%, Create: 25%, Get: 10%
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
  }
  
  // OPTIMIZATION: Reduced sleep time for higher throughput
  sleep(0.5 + Math.random() * 0.5); // 0.5-1 second delay
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
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const url = `${BASE_URL}/availability?resourceId=${resourceId}&startDate=${today.toISOString()}&endDate=${tomorrow.toISOString()}&duration=60`;
  
  const response = http.get(url);
  
  const isSuccess = check(response, {
    'availability status is 200': (r) => r.status === 200,
    'availability response time < 300ms': (r) => r.timings.duration < 300,
    'availability response has slots array': (r) => {
      try {
        const data = JSON.parse(r.body);
        return data.availableSlots && Array.isArray(data.availableSlots);
      } catch {
        return false;
      }
    }
  });
  
  // Track availability response time
  availabilityResponseTime.add(response.timings.duration);
  
  if (!isSuccess) {
    errorRate.add(1);
  }
}

function testCreateBooking() {
  const bookingData = generateOptimizedBookingData();
  
  const response = http.post(`${BASE_URL}/bookings`, JSON.stringify(bookingData), {
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  const isSuccess = check(response, {
    'booking creation status is 201 or 409': (r) => r.status === 201 || r.status === 409,
    'booking response time < 500ms': (r) => r.timings.duration < 500,
    'booking response has success field': (r) => {
      try {
        const data = JSON.parse(r.body);
        return data.hasOwnProperty('success');
      } catch {
        return false;
      }
    }
  });
  
  // Track booking success rate
  if (response.status === 201) {
    bookingSuccessRate.add(1);
  } else if (response.status === 409) {
    // Conflict is expected and acceptable
    bookingSuccessRate.add(0.5); // Partial success
  } else {
    bookingSuccessRate.add(0);
  }
  
  if (!isSuccess) {
    errorRate.add(1);
  }
}

function testGetBookingDetails() {
  // OPTIMIZATION: Use a smaller range of booking IDs for better performance
  const bookingId = `550e8400-e29b-41d4-a716-44665544000${Math.floor(Math.random() * 5) + 1}`;
  
  const response = http.get(`${BASE_URL}/bookings/${bookingId}`);
  
  const isSuccess = check(response, {
    'get booking status is 200 or 404': (r) => r.status === 200 || r.status === 404,
    'get booking response time < 200ms': (r) => r.timings.duration < 200,
  });
  
  if (!isSuccess) {
    errorRate.add(1);
  }
}

// OPTIMIZED: Simplified teardown
export function teardown(data) {
  console.log('Load test completed');
  console.log(`Total requests: ${data.metrics.http_reqs?.count || 0}`);
  console.log(`Error rate: ${((data.metrics.errors?.rate || 0) * 100).toFixed(2)}%`);
  console.log(`Average response time: ${(data.metrics.http_req_duration?.avg || 0).toFixed(2)}ms`);
} 