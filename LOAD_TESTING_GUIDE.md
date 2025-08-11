# 🚀 Load Testing & Spike Testing Guide

## Overview
This guide shows you how to run and monitor load testing and spike testing for the HighLevel Booking Platform using K6.

## 📋 Prerequisites
- ✅ K6 installed (`brew install k6`)
- ✅ Server running on `http://localhost:3000`
- ✅ Database populated with test data

## 🧪 **1. Basic Load Test (Normal Load)**

### **Run the Test:**
```bash
k6 run tests/load/load-test.js
```

### **What It Does:**
- **Ramp up:** 0 → 10 users over 2 minutes
- **Sustain:** 10 users for 5 minutes  
- **Scale up:** 10 → 20 users over 3 minutes
- **Sustain:** 20 users for 5 minutes
- **Ramp down:** 20 → 0 users over 2 minutes

### **Test Scenarios:**
- 🏥 **Health Check** (10% weight) - Fast endpoint
- 📅 **Check Availability** (40% weight) - Most common operation
- ➕ **Create Booking** (30% weight) - Resource intensive
- 📖 **Get Booking Details** (15% weight) - Database read
- 🔄 **Create Recurring Booking** (5% weight) - Complex operation

### **Performance Thresholds:**
- ✅ **Response Time:** 95% of requests < 500ms
- ✅ **Error Rate:** < 10%
- ✅ **Request Rate:** > 50 req/s during peak

---

## ⚡ **2. Spike Test (Traffic Burst)**

### **Run the Test:**
```bash
k6 run tests/load/spike-test.js
```

### **What It Does:**
- **Normal:** 10 users for 1 minute 10 seconds
- **🚀 SPIKE:** 10 → 100 users in 10 seconds
- **Sustain Spike:** 100 users for 30 seconds
- **Recovery:** 100 → 10 users in 10 seconds
- **Normal:** 10 users for 1 minute
- **Ramp down:** 10 → 0 users

### **Test Scenarios:**
- 🏥 **Health Check** (10% weight) - Always fast
- 📅 **Availability Check** (50% weight) - Most common
- ➕ **Create Booking** (30% weight) - Resource intensive
- 📖 **Get Booking** (10% weight) - Quick read

### **Performance Thresholds:**
- ✅ **Response Time:** 95% of requests < 2s during spike
- ✅ **Error Rate:** < 20% during spike
- ✅ **Request Rate:** > 200 req/s during spike

---

## 📊 **3. Real-Time Monitoring Options**

### **Option A: K6 Built-in Metrics (Recommended for Quick Tests)**
```bash
# Run with detailed output
k6 run --out json=results.json tests/load/load-test.js

# Run with console output
k6 run --console-output=stdout tests/load/load-test.js
```

### **Option B: Grafana + InfluxDB (Professional Monitoring)**
```bash
# Start InfluxDB
docker run -d --name influxdb -p 8086:8086 influxdb:1.8

# Start Grafana
docker run -d --name grafana -p 3001:3000 grafana/grafana

# Run test with InfluxDB output
k6 run --out influxdb=http://localhost:8086/k6 tests/load/load-test.js
```

### **Option C: Real-Time Console Output**
```bash
# Run with live metrics
k6 run --console-output=stdout --no-usage-report tests/load/load-test.js
```

---

## 🔍 **4. What to Monitor During Tests**

### **Key Metrics:**
- 📈 **HTTP Request Rate** - Requests per second
- ⏱️ **Response Time** - P50, P90, P95, P99 percentiles
- ❌ **Error Rate** - Percentage of failed requests
- 🚀 **Virtual Users** - Active concurrent users
- 💾 **Data Transfer** - Bytes sent/received

### **Performance Indicators:**
- ✅ **Response Time:** Should stay within thresholds
- ✅ **Error Rate:** Should remain low
- ✅ **Throughput:** Should scale with user load
- ✅ **Resource Usage:** CPU, memory, database connections

---

## 🛠️ **5. Customizing Tests**

### **Adjust Load Levels:**
```javascript
// In load-test.js or spike-test.js
export const options = {
  stages: [
    { duration: '1m', target: 5 },    // Start with 5 users
    { duration: '2m', target: 50 },   // Ramp to 50 users
    { duration: '5m', target: 50 },   // Sustain 50 users
    { duration: '2m', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<1000'], // Adjust response time threshold
    errors: ['rate<0.05'],             // Adjust error rate threshold
  },
};
```

### **Add Custom Metrics:**
```javascript
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const bookingSuccessRate = new Rate('booking_success_rate');
const availabilityResponseTime = new Trend('availability_response_time');

// Use in tests
const response = http.get('/availability');
availabilityResponseTime.add(response.timings.duration);
```

---

## 📈 **6. Analyzing Results**

### **K6 Output Summary:**
```
     http_req_duration........: avg=45.23ms  min=12.45ms  med=38.12ms  max=234.56ms  p(90)=89.12ms  p(95)=156.78ms
     http_reqs................: 1250.123456/s
     http_req_failed..........: 0.00%
     vus......................: 20
     vus_max..................: 20
```

### **Key Insights:**
- **Response Time:** P95 should be within acceptable range
- **Throughput:** Should scale linearly with user load
- **Error Rate:** Should remain very low (< 5%)
- **Resource Utilization:** Monitor server resources during tests

---

## 🚨 **7. Troubleshooting Common Issues**

### **Server Overload:**
- ❌ **High Error Rate:** Reduce user load or increase server resources
- ❌ **Slow Response Times:** Check database performance, add caching
- ❌ **Connection Refused:** Server not running or port blocked

### **Test Configuration:**
- ❌ **Invalid Thresholds:** Check metric names in K6 options
- ❌ **Resource Not Found:** Ensure test data exists in database
- ❌ **Timeout Errors:** Increase timeout values for slow endpoints

---

## 🎯 **8. Quick Start Commands**

### **Run Basic Load Test:**
```bash
k6 run tests/load/load-test.js
```

### **Run Spike Test:**
```bash
k6 run tests/load/spike-test.js
```

### **Run with Custom Duration:**
```bash
k6 run --duration 5m tests/load/load-test.js
```

### **Run with Specific User Count:**
```bash
k6 run --vus 50 --duration 2m tests/load/load-test.js
```

### **Save Results to File:**
```bash
k6 run --out json=load-test-results.json tests/load/load-test.js
```

---

## 📊 **9. Expected Results**

### **Load Test (Normal Load):**
- ✅ **Response Time:** P95 < 500ms
- ✅ **Error Rate:** < 10%
- ✅ **Throughput:** > 50 req/s

### **Spike Test (Traffic Burst):**
- ✅ **Response Time:** P95 < 2s during spike
- ✅ **Error Rate:** < 20% during spike
- ✅ **Throughput:** > 200 req/s during spike
- ✅ **Recovery:** Should return to normal performance after spike

---

## 🔄 **10. Continuous Monitoring**

### **Automated Testing:**
```bash
# Run tests every hour
*/60 * * * * cd /path/to/project && k6 run tests/load/load-test.js

# Run spike test daily
0 9 * * * cd /path/to/project && k6 run tests/load/spike-test.js
```

### **Performance Regression Testing:**
- 📊 **Baseline:** Establish performance baselines
- 📈 **Trends:** Monitor performance over time
- 🚨 **Alerts:** Set up alerts for performance degradation
- 📋 **Reports:** Generate regular performance reports

---

## 🎉 **Ready to Test!**

Your load testing setup is complete! Start with the basic load test to establish baselines, then run the spike test to see how your system handles traffic bursts.

**Happy Testing! 🚀** 