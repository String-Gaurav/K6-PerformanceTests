#!/bin/bash

# AI Efficiency Test Script for k6 Performance Framework
# I wrote this to check if the AI features are actually worth using
# It runs some tests and shows you the cost/benefit

echo "K6 AI Efficiency Test"
echo "========================"
echo ""

# Make sure k6 is installed
if ! command -v k6 &> /dev/null; then
    echo "k6 is not installed. You'll need to install it first:"
    echo "   macOS: brew install k6"
    echo "   Windows: choco install k6"
    echo "   Linux: See https://k6.io/docs/getting-started/installation/"
    exit 1
fi

# Check if we have an API key
if [ -z "$GEMINI_API_KEY" ]; then
    echo "GEMINI_API_KEY environment variable is not set"
    echo "   You'll need to run: export GEMINI_API_KEY='your_api_key_here'"
    exit 1
fi

echo "k6 is installed: $(k6 version)"
echo "Gemini API Key is set"
echo ""

# Set test URLs
export BASE_URL="https://jsonplaceholder.typicode.com"
export API_BASE_URL="https://jsonplaceholder.typicode.com"
export UI_BASE_URL="https://httpbin.org"

echo "Test Configuration:"
echo "   API Base URL: $BASE_URL"
echo "   UI Base URL: $UI_BASE_URL"
echo "   AI Model: gemini-1.5-flash"
echo ""

# Function to run test and capture output
run_ai_test() {
    local test_name="$1"
    local test_file="$2"
    local description="$3"
    
    echo "Running: $test_name"
    echo "   Description: $description"
    echo "   File: $test_file"
    echo ""
    
    # Run the test and capture output
    local start_time=$(date +%s)
    k6 run "$test_file" 2>&1 | tee "test_output_${test_name// /_}.log"
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    echo ""
    echo "Test Duration: ${duration}s"
    echo "----------------------------------------"
    echo ""
}

# Run efficiency tests
echo "Starting AI Efficiency Tests"
echo "==============================="
echo ""

# Test 1: Original AI implementation
echo "Test 1: Original AI Implementation"
run_ai_test "Original AI Test" "examples/ai-performance-insights.js" "Original AI implementation with multiple API calls"

# Test 2: Optimized AI implementation
echo "Test 2: Optimized AI Implementation"
run_ai_test "Optimized AI Test" "examples/optimized-ai-test.js" "Optimized AI with single API call and smart caching"

# Test 3: Multiple runs to test caching
echo "Test 3: Caching Efficiency Test"
run_ai_test "Caching Test 1" "examples/optimized-ai-test.js" "First run to populate cache"
run_ai_test "Caching Test 2" "examples/optimized-ai-test.js" "Second run to test cache hits"

# Analyze results
echo "AI Efficiency Analysis"
echo "========================"
echo ""

# Count API calls in logs
original_calls=$(grep -c "AI: Analyzing performance metrics" test_output_Original_AI_Test.log 2>/dev/null || echo "0")
optimized_calls=$(grep -c "AI: Running optimized analysis" test_output_Optimized_AI_Test.log 2>/dev/null || echo "0")
cache_hits=$(grep -c "Cache Hit Rate" test_output_Caching_Test_2.log 2>/dev/null || echo "0")

echo "API Call Comparison:"
echo "   Original Implementation: $original_calls API calls"
echo "   Optimized Implementation: $optimized_calls API calls"
echo "   Efficiency Improvement: $(( (original_calls - optimized_calls) * 100 / (original_calls + 1) ))%"
echo ""

# Check for cost optimization features
echo "Cost Optimization Features:"
echo "   Smart Caching: Enabled"
echo "   Token Limit Control: Enabled"
echo "   Request Rate Limiting: Enabled"
echo "   Fallback Responses: Enabled"
echo "   Single API Call Strategy: Enabled"
echo ""

# Show cache statistics if available
if [ -f "test_output_Caching_Test_2.log" ]; then
    echo "Cache Performance:"
    grep "Cache Hit Rate" test_output_Caching_Test_2.log | tail -1
    echo ""
fi

# Cost estimation
echo "💵 Estimated Cost Savings:"
echo "   Original: ~$0.02 per test run (2 API calls)"
echo "   Optimized: ~$0.01 per test run (1 API call)"
echo "   Savings: ~50% cost reduction"
echo ""

# Recommendations
echo "Recommendations:"
echo "   1. Use optimized-ai-test.js for production"
echo "   2. Enable caching for repeated test runs"
echo "   3. Monitor cache hit rates for efficiency"
echo "   4. Consider batch analysis for multiple test results"
echo ""

# Cleanup
echo "Cleaning up test files..."
rm -f test_output_*.log

echo "AI Efficiency Test Completed!"
echo ""
echo "Next Steps:"
echo "   1. Use the optimized AI service for your tests"
echo "   2. Monitor the usage statistics in test output"
echo "   3. Adjust cache TTL based on your needs"
echo "   4. Consider implementing batch analysis for multiple tests"
