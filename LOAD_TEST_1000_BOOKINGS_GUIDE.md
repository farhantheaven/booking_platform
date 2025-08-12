# Load Test Guide: 1000 Bookings over 1 Hour

## 🎯 Overview

This load test simulates realistic booking system usage with the goal of creating **1000+ bookings** over **1 hour** while maintaining system performance and reliability.

## 📊 Test Configuration

### **Load Pattern**
- **Total Duration**: 1 hour (60 minutes)
- **Peak Concurrent Users**: 100
- **Target Bookings**: 1000+
- **Request Rate**: 100+ req/s during peak

### **Test Stages**
1. **Ramp Up** (0-5 min): 0 → 50 users
2. **Build Load** (5-15 min): 50 → 100 users  
3. **Peak Load** (15-45 min): 100 users (30 minutes)
4. **Ramp Down** (45-55 min): 100 → 50 users
5. **Cool Down** (55-60 min): 50 → 0 users

### **Test Scenarios & Weights**
- **Health Check**: 5% (system monitoring)
- **Availability Check**: 35% (most common operation)
- **Create Single Booking**: 25% (core functionality)
- **Create Recurring Booking**: 10% (advanced feature)
- **Get Booking Details**: 15% (read operations)
- **Check Conflicts**: 8% (business logic)
- **Bulk Availability**: 2% (performance testing)

## 🚀 Quick Start

### **Prerequisites**
1. **k6 installed**: [Installation Guide](https://k6.io/docs/getting-started/installation/)
2. **Server running**: Your booking system must be accessible at `localhost:3000`
3. **Database ready**: Ensure your database can handle 1000+ bookings

### **Run the Test**
```bash
# Make script executable (first time only)
chmod +x run-load-test-1000-bookings.sh

# Run the load test
./run-load-test-1000-bookings.sh
```

### **Manual Run (Alternative)**
```bash
# Run directly with k6
k6 run tests/load/load-test-1000-bookings.js
```

## 📈 Performance Thresholds

### **Response Time**
- **95th percentile**: < 1 second
- **99th percentile**: < 2 seconds

### **Success Rates**
- **Booking Creation**: > 95%
- **Availability Checks**: > 98%
- **Overall Error Rate**: < 5%

### **Throughput**
- **Request Rate**: > 100 req/s during peak
- **Total Requests**: 1000+ over the hour

## 🔍 Monitoring During Test

### **Real-time Metrics**
```bash
# Watch server logs
tail -f logs/app.log

# Monitor database connections
# Check your database monitoring tools

# Monitor system resources
htop
iostat -x 1
```

### **Key Metrics to Watch**
- **CPU Usage**: Should stay below 80%
- **Memory Usage**: Watch for memory leaks
- **Database Connections**: Ensure connection pool isn't exhausted
- **Response Times**: Should remain consistent
- **Error Rates**: Should stay below thresholds

## 📊 Understanding Results

### **Output Files**
- **JSON**: Detailed metrics and timestamps
- **CSV**: Request-by-request data for analysis
- **Summary**: Human-readable test summary

### **Key Metrics to Analyze**

#### **Performance Metrics**
- **Response Time Distribution**: P50, P95, P99
- **Throughput**: Requests per second
- **Error Rate**: Percentage of failed requests

#### **Business Metrics**
- **Total Bookings Created**: Should be 1000+
- **Success Rates**: By operation type
- **Conflict Detection**: How well the system handles overlaps

#### **System Health**
- **Resource Utilization**: CPU, Memory, Database
- **Connection Stability**: No connection drops
- **Data Consistency**: Bookings are properly stored

## 🚨 Troubleshooting

### **Common Issues**

#### **Test Fails to Start**
```bash
# Check if server is running
curl http://localhost:3000/api/v1/health

# Check if k6 is installed
k6 version
```

#### **High Error Rates**
- **Database Connection Issues**: Check connection pool settings
- **Memory Issues**: Monitor server memory usage
- **Rate Limiting**: Check if rate limiters are too restrictive

#### **Slow Response Times**
- **Database Queries**: Check for slow queries
- **Indexes**: Ensure proper database indexing
- **Caching**: Implement caching for frequently accessed data

### **Performance Tuning**

#### **Database Optimization**
```sql
-- Check slow queries
SELECT * FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 10;

-- Check index usage
SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch 
FROM pg_stat_user_indexes ORDER BY idx_scan DESC;
```

#### **Application Tuning**
- **Connection Pooling**: Optimize database connection settings
- **Caching**: Implement Redis or in-memory caching
- **Async Processing**: Use background jobs for heavy operations

## 📋 Pre-Test Checklist

- [ ] **Server running** and accessible at localhost:3000
- [ ] **Database** has sufficient capacity and proper indexes
- [ ] **k6 installed** and working (`k6 version`)
- [ ] **Test data** resources exist in database
- [ ] **Monitoring tools** ready (logs, metrics, database)
- [ ] **System resources** available (CPU, memory, disk)
- [ ] **Backup strategy** in place for production data

## 🔄 Post-Test Analysis

### **Immediate Actions**
1. **Check Results**: Review summary and metrics
2. **Verify Data**: Ensure all test bookings were created
3. **Clean Up**: Remove test data if needed
4. **Document**: Record any issues or observations

### **Long-term Analysis**
1. **Performance Trends**: Compare with previous tests
2. **Bottleneck Identification**: Find system limitations
3. **Optimization Planning**: Plan improvements based on results
4. **Capacity Planning**: Understand system limits

## 📚 Additional Resources

- **k6 Documentation**: [https://k6.io/docs/](https://k6.io/docs/)
- **Load Testing Best Practices**: [https://k6.io/docs/testing-guides/](https://k6.io/docs/testing-guides/)
- **Performance Testing**: [https://k6.io/docs/testing-guides/performance-testing/](https://k6.io/docs/testing-guides/performance-testing/)

## 🎯 Success Criteria

The test is considered successful if:
- ✅ **1000+ bookings** are created successfully
- ✅ **95% of requests** complete within 1 second
- ✅ **Error rate** stays below 5%
- ✅ **System remains stable** throughout the test
- ✅ **Database performance** remains consistent
- ✅ **All business logic** works correctly under load

---

**Happy Load Testing! 🚀** 