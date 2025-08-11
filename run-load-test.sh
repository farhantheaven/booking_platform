#!/bin/bash

# Load Test Runner with Organized Output
# Usage: ./run-load-test.sh [test-type] [vus] [duration]

# Default values
TEST_TYPE=${1:-"load"}
VUS=${2:-"50"}
DURATION=${3:-"5m"}

# Create timestamp
TIMESTAMP=$(date +%Y%m%d-%H%M%S)

# Set output directory based on test type
if [ "$TEST_TYPE" = "spike" ]; then
    OUTPUT_DIR="test-results/spike-tests"
    TEST_SCRIPT="tests/load/spike-test.js"
    TEST_NAME="spike-test"
else
    OUTPUT_DIR="test-results/load-tests"
    TEST_SCRIPT="tests/load/load-test.js"
    TEST_NAME="load-test"
fi

# Create output directory if it doesn't exist
mkdir -p "$OUTPUT_DIR"

# Set output filenames
JSON_FILE="$OUTPUT_DIR/${TEST_NAME}-${VUS}vus-${DURATION//[^0-9]/}-${TIMESTAMP}.json"
CSV_FILE="$OUTPUT_DIR/${TEST_NAME}-${VUS}vus-${DURATION//[^0-9]/}-${TIMESTAMP}.csv"
SUMMARY_FILE="$OUTPUT_DIR/${TEST_NAME}-${VUS}vus-${DURATION//[^0-9]/}-${TIMESTAMP}-summary.txt"

echo "🚀 Running $TEST_TYPE test with $VUS VUs for $DURATION"
echo "📁 Output files:"
echo "   JSON: $JSON_FILE"
echo "   CSV:  $CSV_FILE"
echo "   Summary: $SUMMARY_FILE"
echo ""

# Run the test with multiple outputs
k6 run \
  --vus "$VUS" \
  --duration "$DURATION" \
  --out json="$JSON_FILE" \
  --out csv="$CSV_FILE" \
  --console-output=stdout \
  "$TEST_SCRIPT" 2>&1 | tee "$SUMMARY_FILE"

echo ""
echo "✅ Test completed! Results saved to:"
echo "   📊 JSON (detailed): $JSON_FILE"
echo "   📈 CSV (spreadsheet): $CSV_FILE"
echo "   📋 Summary (console): $SUMMARY_FILE"
echo ""
echo "📊 To analyze results:"
echo "   - JSON: Use for detailed analysis and automation"
echo "   - CSV: Open in Excel/Google Sheets for charts"
echo "   - Summary: Quick overview of test results" 