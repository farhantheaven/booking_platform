#!/bin/bash

# Test Results Viewer
# Usage: ./view-results.sh [test-type]

TEST_TYPE=${1:-"load"}

if [ "$TEST_TYPE" = "spike" ]; then
    RESULTS_DIR="test-results/spike-tests"
    TEST_NAME="Spike Tests"
else
    RESULTS_DIR="test-results/load-tests"
    TEST_NAME="Load Tests"
fi

echo "📊 $TEST_NAME - Available Results"
echo "=================================="

if [ ! -d "$RESULTS_DIR" ] || [ -z "$(ls -A "$RESULTS_DIR" 2>/dev/null)" ]; then
    echo "❌ No test results found in $RESULTS_DIR"
    echo ""
    echo "💡 Run a test first:"
    echo "   ./run-load-test.sh $TEST_TYPE 50 5m"
    exit 1
fi

# List all test results
echo ""
echo "📁 Test Results:"
echo ""

for file in "$RESULTS_DIR"/*.json; do
    if [ -f "$file" ]; then
        filename=$(basename "$file" .json)
        echo "📊 $filename"
        
        # Extract test parameters from filename
        if [[ $filename =~ ([0-9]+)vus-([0-9]+)-([0-9]{8}-[0-9]{6}) ]]; then
            vus="${BASH_REMATCH[1]}"
            duration="${BASH_REMATCH[2]}"
            timestamp="${BASH_REMATCH[3]}"
            echo "   👥 VUs: $vus"
            echo "   ⏱️  Duration: ${duration} minutes"
            echo "   🕐 Timestamp: $timestamp"
        fi
        
        # Check if corresponding CSV exists
        csv_file="${file%.json}.csv"
        if [ -f "$csv_file" ]; then
            echo "   📈 CSV: Available"
        fi
        
        # Check if summary exists
        summary_file="${file%.json}-summary.txt"
        if [ -f "$summary_file" ]; then
            echo "   📋 Summary: Available"
        fi
        
        echo ""
    fi
done

echo "🔍 To view specific results:"
echo "   📊 JSON (detailed): cat $RESULTS_DIR/filename.json"
echo "   📈 CSV (spreadsheet): open $RESULTS_DIR/filename.csv"
echo "   📋 Summary: cat $RESULTS_DIR/filename-summary.txt"
echo ""
echo "📊 Quick analysis commands:"
echo "   # Count total tests run"
echo "   ls $RESULTS_DIR/*.json | wc -l"
echo ""
echo "   # Find tests with specific VU count"
echo "   ls $RESULTS_DIR/*50vus*.json"
echo ""
echo "   # View latest test summary"
echo "   ls -t $RESULTS_DIR/*summary.txt | head -1 | xargs cat" 