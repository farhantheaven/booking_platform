#!/bin/bash

# Load Test for 1000 Bookings over 1 Hour
# This script runs a comprehensive load test to simulate realistic booking patterns

echo "🚀 Starting Load Test: 1000 Bookings over 1 Hour"
echo "=================================================="

# Create results directory with timestamp
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
RESULTS_DIR="test-results/load-tests/1000-bookings-test-${TIMESTAMP}"
mkdir -p "$RESULTS_DIR"

echo "📁 Results will be saved to: $RESULTS_DIR"

# Check if k6 is installed
if ! command -v k6 &> /dev/null; then
    echo "❌ Error: k6 is not installed. Please install k6 first."
    echo "   Visit: https://k6.io/docs/getting-started/installation/"
    exit 1
fi

# Check if the server is running
echo "🔍 Checking if server is running..."
if ! curl -s http://localhost:3000/api/v1/health > /dev/null; then
    echo "❌ Error: Server is not running on localhost:3000"
    echo "   Please start your server first: npm run dev"
    exit 1
fi

echo "✅ Server is running and accessible"

# Run the load test
echo "🔥 Starting k6 load test..."
echo "⏱️  Expected duration: 1 hour"
echo "👥 Peak concurrent users: 100"
echo "📊 Target: 1000+ bookings with realistic patterns"

k6 run \
    --out json="$RESULTS_DIR/load-test-results.json" \
    --out csv="$RESULTS_DIR/load-test-results.csv" \
    --out influxdb=http://localhost:8086/k6 \
    --env BASE_URL=http://localhost:3000/api/v1 \
    tests/load/load-test-1000-bookings.js

# Check if k6 completed successfully
if [ $? -eq 0 ]; then
    echo "✅ Load test completed successfully!"
    
    # Generate summary report
    echo "📊 Generating summary report..."
    
    # Count total requests from CSV
    if [ -f "$RESULTS_DIR/load-test-results.csv" ]; then
        TOTAL_REQUESTS=$(tail -n +2 "$RESULTS_DIR/load-test-results.csv" | wc -l)
        echo "📈 Total requests processed: $TOTAL_REQUESTS"
    fi
    
    # Create summary file
    cat > "$RESULTS_DIR/summary.txt" << EOF
Load Test Summary: 1000 Bookings over 1 Hour
============================================

Test Configuration:
- Duration: 1 hour (60 minutes)
- Stages: 5 stages with peak at 100 concurrent users
- Target: 1000+ bookings with realistic patterns

Test Scenarios:
- Health Check (5% weight)
- Availability Check (35% weight) 
- Create Single Booking (25% weight)
- Create Recurring Booking (10% weight)
- Get Booking Details (15% weight)
- Check Conflicts (8% weight)
- Bulk Availability Check (2% weight)

Performance Thresholds:
- 95% of requests must complete below 1 second
- 99% of requests must complete below 2 seconds
- Error rate must be below 5%
- Request rate should be above 100 req/s during peak
- 95% booking creation success rate
- 98% availability check success rate

Results Files:
- JSON: load-test-results.json
- CSV: load-test-results.csv
- Summary: summary.txt

Test completed at: $(date)
EOF

    echo "📋 Summary report saved to: $RESULTS_DIR/summary.txt"
    
    # Show key metrics
    echo ""
    echo "📊 Key Metrics:"
    echo "================="
    if [ -f "$RESULTS_DIR/load-test-results.csv" ]; then
        echo "📈 Total requests: $TOTAL_REQUESTS"
        echo "📁 Results directory: $RESULTS_DIR"
        echo "📋 Summary: $RESULTS_DIR/summary.txt"
        echo "📊 Detailed results: $RESULTS_DIR/load-test-results.json"
        echo "📈 CSV data: $RESULTS_DIR/load-test-results.csv"
    fi
    
else
    echo "❌ Load test failed with exit code $?"
    echo "📁 Check logs in: $RESULTS_DIR"
fi

echo ""
echo "🎯 Load test completed!"
echo "📁 All results saved to: $RESULTS_DIR" 