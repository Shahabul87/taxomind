#!/bin/bash

# K6 Load Test Runner Script for Taxomind LMS
# This script runs different types of load tests using k6

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Default values
BASE_URL=${BASE_URL:-"http://localhost:3000"}
TEST_TYPE=${1:-"smoke"}
OUTPUT_DIR="k6-results"

# Create output directory if it doesn't exist
mkdir -p "$OUTPUT_DIR"

# Function to print colored output
print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if k6 is installed
check_k6() {
    if ! command -v k6 &> /dev/null; then
        print_error "k6 is not installed. Please install k6 first."
        echo "Installation instructions:"
        echo "  macOS: brew install k6"
        echo "  Ubuntu/Debian: sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69"
        echo "                 echo 'deb https://dl.k6.io/deb stable main' | sudo tee /etc/apt/sources.list.d/k6.list"
        echo "                 sudo apt-get update && sudo apt-get install k6"
        echo "  Windows: choco install k6"
        echo "  Or download from: https://k6.io/docs/getting-started/installation/"
        exit 1
    fi
    print_info "k6 version: $(k6 version)"
}

# Function to check if the application is running
check_app() {
    print_info "Checking if application is running at $BASE_URL..."
    if ! curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/health" | grep -q "200"; then
        print_warning "Application might not be running at $BASE_URL"
        print_warning "Make sure to run 'npm run dev' before running load tests"
        read -p "Do you want to continue anyway? (y/n) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    else
        print_info "Application is running and healthy!"
    fi
}

# Function to run a specific test type
run_test() {
    local test_type=$1
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local output_file="${OUTPUT_DIR}/${test_type}_${timestamp}.json"
    local html_report="${OUTPUT_DIR}/${test_type}_${timestamp}.html"
    
    print_info "Starting $test_type test..."
    print_info "Results will be saved to: $output_file"
    
    # Run k6 test with output to JSON and console
    k6 run \
        --out json="$output_file" \
        --summary-export="$output_file.summary.json" \
        -e BASE_URL="$BASE_URL" \
        -e TEST_TYPE="$test_type" \
        load-test.js
    
    # Check if test passed
    if [ $? -eq 0 ]; then
        print_info "✅ $test_type test completed successfully!"
    else
        print_error "❌ $test_type test failed!"
        exit 1
    fi
    
    # Generate HTML report if k6-reporter is available
    if command -v k6-reporter &> /dev/null; then
        print_info "Generating HTML report..."
        k6-reporter "$output_file" --output "$html_report"
        print_info "HTML report generated: $html_report"
    fi
    
    print_info "Test results saved to: $output_file"
}

# Function to run all tests
run_all_tests() {
    local test_types=("smoke" "load" "stress" "spike")
    
    print_info "Running all test types sequentially..."
    
    for test in "${test_types[@]}"; do
        print_info "===================="
        print_info "Running $test test"
        print_info "===================="
        run_test "$test"
        
        # Wait between tests (except after the last one)
        if [ "$test" != "${test_types[-1]}" ]; then
            print_info "Waiting 30 seconds before next test..."
            sleep 30
        fi
    done
    
    print_info "All tests completed!"
}

# Function to show test results summary
show_summary() {
    print_info "Recent test results:"
    echo "===================="
    
    if [ -d "$OUTPUT_DIR" ]; then
        # List recent test files
        ls -lt "$OUTPUT_DIR"/*.json 2>/dev/null | head -10 || print_warning "No test results found"
        
        # Show summary of latest test if exists
        latest_summary=$(ls -t "$OUTPUT_DIR"/*.summary.json 2>/dev/null | head -1)
        if [ -f "$latest_summary" ]; then
            echo ""
            print_info "Latest test summary:"
            cat "$latest_summary" | jq '.' 2>/dev/null || cat "$latest_summary"
        fi
    else
        print_warning "No results directory found"
    fi
}

# Main script
main() {
    print_info "Taxomind LMS Load Test Runner"
    print_info "=============================="
    
    # Check prerequisites
    check_k6
    check_app
    
    case "$TEST_TYPE" in
        smoke|load|stress|spike|soak)
            run_test "$TEST_TYPE"
            ;;
        all)
            run_all_tests
            ;;
        summary)
            show_summary
            ;;
        *)
            print_error "Invalid test type: $TEST_TYPE"
            echo "Usage: $0 [smoke|load|stress|spike|soak|all|summary]"
            echo ""
            echo "Test types:"
            echo "  smoke   - Quick test with minimal load (1 user, 1 minute)"
            echo "  load    - Standard load test (ramp to 100 users, 16 minutes)"
            echo "  stress  - Stress test to find breaking point (ramp to 300 users, 26 minutes)"
            echo "  spike   - Test sudden traffic spikes (spike to 500 users, 4 minutes)"
            echo "  soak    - Extended test for memory leaks (100 users, 2+ hours)"
            echo "  all     - Run all tests sequentially"
            echo "  summary - Show recent test results"
            echo ""
            echo "Environment variables:"
            echo "  BASE_URL - Application URL (default: http://localhost:3000)"
            echo ""
            echo "Examples:"
            echo "  $0 smoke                    # Run smoke test"
            echo "  $0 load                     # Run load test"
            echo "  BASE_URL=https://staging.taxomind.com $0 stress  # Run stress test against staging"
            exit 1
            ;;
    esac
    
    # Show summary after test
    if [ "$TEST_TYPE" != "summary" ]; then
        echo ""
        show_summary
    fi
}

# Run main function
main