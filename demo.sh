#!/bin/bash

# k6 Performance Testing Framework Demo Script
# This script demonstrates how to run various performance tests

echo "k6 Performance Testing Framework Demo"
echo "========================================"
echo ""

# Check if k6 is installed
if ! command -v k6 &> /dev/null; then
    echo "k6 is not installed. Please install k6 first:"
    echo "   macOS: brew install k6"
    echo "   Windows: choco install k6"
    echo "   Linux: See https://k6.io/docs/getting-started/installation/"
    exit 1
fi

echo "k6 is installed: $(k6 version)"
echo ""

# Set default URLs for demo
export BASE_URL="https://jsonplaceholder.typicode.com"
export API_BASE_URL="https://jsonplaceholder.typicode.com"
export UI_BASE_URL="https://httpbin.org"

echo "Demo Configuration:"
echo "   API Base URL: $BASE_URL"
echo "   UI Base URL: $UI_BASE_URL"
echo ""

# Function to run a test with description
run_test() {
    local test_name="$1"
    local test_command="$2"
    local description="$3"
    
    echo "Running: $test_name"
    echo "   Description: $description"
    echo "   Command: $test_command"
    echo ""
    
    eval $test_command
    
    echo ""
    echo "Completed: $test_name"
    echo "----------------------------------------"
    echo ""
}

# Demo tests
echo "Starting Demo Tests"
echo "======================"
echo ""

# 1. API Smoke Test
run_test "API Smoke Test" "k6 run scenarios/api-smoke-test.js" "Quick validation of API endpoints"

# 2. UI Smoke Test  
run_test "UI Smoke Test" "k6 run scenarios/ui-smoke-test.js" "Quick validation of UI components"

# 3. REST API Test
run_test "REST API Load Test" "k6 run tests/api/rest-api-test.js" "REST API performance testing"

# 4. Authentication Test
run_test "Authentication Load Test" "k6 run tests/api/auth-test.js" "Authentication system performance"

# 5. GraphQL Test
run_test "GraphQL Load Test" "k6 run tests/api/graphql-test.js" "GraphQL query performance testing"

# 6. UI Page Load Test
run_test "UI Page Load Test" "k6 run tests/ui/page-load-test.js" "UI page loading performance"

# 7. UI User Interaction Test
run_test "UI User Interaction Test" "k6 run tests/ui/user-interaction-test.js" "UI user interaction performance"

# 8. Combined Test (shortened for demo)
echo "Running Combined Test (Demo Version)"
echo "   Description: Comprehensive API and UI testing"
echo "   Note: This is a shortened version for demo purposes"
echo ""

# Create a quick combined test for demo
cat > demo-combined-test.js << 'EOF'
import http from 'k6/http';
import { check } from 'k6';

export const options = {
  vus: 2,
  duration: '15s',
  thresholds: {
    http_req_duration: ['p(95)<2000'],
    http_req_failed: ['rate<0.1']
  }
};

export default function() {
  // Test API endpoint
  const apiResponse = http.get('https://jsonplaceholder.typicode.com/posts/1');
  check(apiResponse, {
    'API responds': (r) => r.status === 200,
    'API is fast': (r) => r.timings.duration < 1000
  });

  // Test UI endpoint
  const uiResponse = http.get('https://httpbin.org/');
  check(uiResponse, {
    'UI responds': (r) => r.status === 200,
    'UI is fast': (r) => r.timings.duration < 2000
  });
}
EOF

run_test "Combined Demo Test" "k6 run demo-combined-test.js" "Combined API and UI testing"

# Cleanup
rm -f demo-combined-test.js

echo "Demo Completed Successfully!"
echo ""
echo "Demo Summary:"
echo "   - API endpoints tested and validated"
echo "   - UI components tested for performance"
echo "   - Authentication flows validated"
echo "   - GraphQL queries tested"
echo "   - User interactions simulated"
echo "   - Combined workload tested"
echo ""
echo "Next Steps:"
echo "   1. Customize the configuration in config/base-config.js"
echo "   2. Update URLs to point to your applications"
echo "   3. Adjust thresholds based on your requirements"
echo "   4. Add custom tests for your specific use cases"
echo "   5. Integrate with your CI/CD pipeline"
echo ""
echo "For more information, see the documentation"
echo "k6 Documentation: https://k6.io/docs/"
