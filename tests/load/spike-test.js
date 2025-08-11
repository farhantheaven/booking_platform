import { check, sleep } from 'k6';
import http from 'k6/http';
import { Rate } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');

// Spike test configuration - sudden burst of traffic
export const options = {
  stages: [
    { duration: '10s', target: 10 },    // Normal load
    { duration: '1m', target: 10 },     // Stay at normal load
    { duration: '10s', target: 100 },   // Spike to 100 users in 10 seconds
    { duration: '30s', target: 100 },   // Maintain spike for 30 seconds
    { duration: '10s', target: 10 },    // Quick recovery to normal load
    { duration: '1m', target: 10 },     // Maintain normal load
    { duration: '10s', target: 0 },     // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'],  // 95% of requests must complete below 2s during spike
    errors: ['rate<0.2'],               // Error rate must be below 20% during spike
    http_reqs: ['rate>200'],            // Request rate should be above 200 req/s during spike
  },
};

const BASE_URL = 'http://localhost:3000/api/v1';

// Sample resource IDs
const RESOURCE_IDS = [
  '550e8400-e29b-41d4-a716-446655440001',
  '550e8400-e29b-41d4-a716-446655440002',
  '550e8400-e29b-41d4-a716-446655440003'
];

// Simplified booking data generation for spike test
function generateSpikeBookingData() {
  const now = new Date();
  const startTime = new Date(now.getTime() + (Math.random() * 7 * 24 * 60 * 60 * 1000)); // Random time in next 7 days
  const endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // 1 hour duration
  
  return {
    resourceId: RESOURCE_IDS[Math.floor(Math.random() * RESOURCE_IDS.length)],
    title: `Spike Test ${__VU}-${__ITER}`,
    startTime: startTime.toISOString(),
    endTime: endTime.toISOString(),
    createdBy: `spike-user-${__VU}`
  };
}

export default function () {
  const testType = Math.random();
  
  if (testType < 0.1) {
    // 10% - Health checks (should always be fast)
    testHealthCheck();
  } else if (testType < 0.6) {
    // 50% - Availability checks (most common operation)
    testQuickAvailability();
  } else if (testType < 0.9) {
    // 30% - Create bookings (resource intensive)
    testSpikeBookingCreation();
  } else {
    // 10% - Get booking details
    testGetBookingQuick();
  }
  
  // Reduced sleep time to increase request rate during spike
  sleep(0.1 + Math.random() * 0.4); // 0.1-0.5 seconds
}

function testHealthCheck() {
  const response = http.get(`${BASE_URL}/health`, {
    timeout: '5s',
  });
  
  const isSuccess = check(response, {
    'health check status is 200': (r) => r.status === 200,
    'health check response time < 500ms': (r) => r.timings.duration < 500,
  });
  
  if (!isSuccess) {
    errorRate.add(1);
  }
}

function testQuickAvailability() {
  const resourceId = RESOURCE_IDS[Math.floor(Math.random() * RESOURCE_IDS.length)];
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const url = `${BASE_URL}/availability?resourceId=${resourceId}&startDate=${today.toISOString()}&endDate=${tomorrow.toISOString()}&duration=60`;
  
  const response = http.get(url, {
    timeout: '10s',
  });
  
  const isSuccess = check(response, {
    'availability status is 200': (r) => r.status === 200,
    'availability response time < 1s': (r) => r.timings.duration < 1000,
    'availability has valid response': (r) => {
      try {
        const data = JSON.parse(r.body);
        return data.success !== undefined;
      } catch {
        return false;
      }
    },
  });
  
  if (!isSuccess) {
    errorRate.add(1);
  }
}

function testSpikeBookingCreation() {
  const bookingData = generateSpikeBookingData();
  
  const response = http.post(
    `${BASE_URL}/bookings`,
    JSON.stringify(bookingData),
    {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: '15s',
    }
  );
  
  const isSuccess = check(response, {
    'booking creation status is 2xx or 409': (r) => (r.status >= 200 && r.status < 300) || r.status === 409,
    'booking creation response time < 2s': (r) => r.timings.duration < 2000,
    'booking creation has response': (r) => r.body && r.body.length > 0,
  });
  
  if (!isSuccess) {
    errorRate.add(1);
  }
  
  // Track successful bookings for cleanup
  if (response.status === 201) {
    try {
      const data = JSON.parse(response.body);
      if (data.booking && data.booking.id) {
        if (!global.spikeBookings) {
          global.spikeBookings = [];
        }
        global.spikeBookings.push(data.booking.id);
      }
    } catch (e) {
      // Ignore parsing errors during spike
    }
  }
}

function testGetBookingQuick() {
  // Use a sample booking ID that might exist
  const sampleBookingId = '550e8400-e29b-41d4-a716-446655440010';
  
  const response = http.get(`${BASE_URL}/bookings/${sampleBookingId}`, {
    timeout: '5s',
  });
  
  const isSuccess = check(response, {
    'get booking status is 200 or 404': (r) => r.status === 200 || r.status === 404,
    'get booking response time < 500ms': (r) => r.timings.duration < 500,
  });
  
  if (!isSuccess) {
    errorRate.add(1);
  }
}

// Setup function to prepare for spike test
export function setup() {
  console.log('Starting spike test - simulating sudden traffic burst');
  
  // Verify server is running
  const healthResponse = http.get(`${BASE_URL}/health`);
  if (healthResponse.status !== 200) {
    throw new Error('Server health check failed before spike test');
  }
  
  return { startTime: new Date().toISOString() };
}

// Teardown function with detailed metrics
export function teardown(data) {
  console.log('\n=== SPIKE TEST RESULTS ===');
  console.log(`Test started at: ${data.startTime}`);
  console.log(`Test completed at: ${new Date().toISOString()}`);
  console.log(`Created bookings during spike: ${global.spikeBookings ? global.spikeBookings.length : 0}`);
  
  // Performance recommendations
  console.log('\n=== PERFORMANCE ANALYSIS ===');
  console.log('📊 Key Metrics to Review:');
  console.log('  • Response times during 100-user spike');
  console.log('  • Error rates when load increases 10x');
  console.log('  • Database connection pool utilization');
  console.log('  • Memory usage during peak load');
  console.log('  • Recovery time after spike ends');
  
  console.log('\n🔧 Potential Optimizations:');
  console.log('  • Add database connection pooling');
  console.log('  • Implement request rate limiting');
  console.log('  • Add caching for availability queries');
  console.log('  • Optimize conflict detection queries');
  console.log('  • Consider read replicas for availability checks');
  
  console.log('\n✅ Success Criteria:');
  console.log('  • <20% error rate during spike');
  console.log('  • <2s response time for 95% of requests');
  console.log('  • Quick recovery to normal performance');
  console.log('  • No database connection exhaustion');
}