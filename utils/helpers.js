import { check, sleep } from 'k6';
import http from 'k6/http';
import { BASE_CONFIG } from '../config/base-config.js';

/**
 * Utility functions for k6 performance tests
 */

// Generate random data for testing
export function generateRandomData() {
  return {
    id: Math.floor(Math.random() * 1000) + 1,
    title: `Random Post ${Math.floor(Math.random() * 1000)}`,
    body: `This is random content ${Math.floor(Math.random() * 10000)}`,
    userId: Math.floor(Math.random() * 10) + 1,
    timestamp: new Date().toISOString()
  };
}

// Generate random user credentials
export function generateRandomUser() {
  const userId = Math.floor(Math.random() * 1000) + 1;
  return {
    username: `user${userId}`,
    password: `password${userId}`,
    email: `user${userId}@test.com`,
    name: `Test User ${userId}`
  };
}

// Make HTTP request with default options
export function makeRequest(method, url, payload = null, customHeaders = {}) {
  const options = {
    ...BASE_CONFIG.DEFAULT_REQUEST_OPTIONS,
    headers: {
      ...BASE_CONFIG.DEFAULT_REQUEST_OPTIONS.headers,
      ...customHeaders
    }
  };

  let response;
  switch (method.toUpperCase()) {
    case 'GET':
      response = http.get(url, options);
      break;
    case 'POST':
      response = http.post(url, payload, options);
      break;
    case 'PUT':
      response = http.put(url, payload, options);
      break;
    case 'PATCH':
      response = http.patch(url, payload, options);
      break;
    case 'DELETE':
      response = http.del(url, null, options);
      break;
    default:
      throw new Error(`Unsupported HTTP method: ${method}`);
  }

  return response;
}

// Perform basic response validation
export function validateResponse(response, expectedStatus = 200) {
  const checks = [
    check(response, {
      'status is correct': (r) => r.status === expectedStatus,
      'response time < 1000ms': (r) => r.timings.duration < 1000,
      'response has body': (r) => r.body && r.body.length > 0
    })
  ];

  if (response.status === expectedStatus) {
    checks.push(
      check(response, {
        'response is JSON': (r) => {
          try {
            JSON.parse(r.body);
            return true;
          } catch (e) {
            return false;
          }
        }
      })
    );
  }

  return checks;
}

// Authenticate user and return token
export function authenticateUser(username, password) {
  const loginPayload = JSON.stringify({
    username: username,
    password: password
  });

  const response = makeRequest('POST', `${BASE_CONFIG.API_BASE_URL}/auth/login`, loginPayload);
  
  if (response.status === 200) {
    const authData = JSON.parse(response.body);
    return authData.token || authData.access_token;
  }
  
  return null;
}

// Make authenticated request
export function makeAuthenticatedRequest(method, url, token, payload = null) {
  const headers = {
    'Authorization': `Bearer ${token}`
  };
  
  return makeRequest(method, url, payload, headers);
}

// Simulate realistic user behavior with random delays
export function simulateUserBehavior() {
  const delays = [0.5, 1.0, 1.5, 2.0, 2.5, 3.0];
  const randomDelay = delays[Math.floor(Math.random() * delays.length)];
  sleep(randomDelay);
}

// Generate realistic load pattern
export function generateLoadPattern(baseLoad, variance = 0.2) {
  const randomFactor = 1 + (Math.random() - 0.5) * variance;
  return Math.floor(baseLoad * randomFactor);
}

// Check if response indicates rate limiting
export function isRateLimited(response) {
  return response.status === 429 || 
         (response.headers['X-RateLimit-Remaining'] && 
          parseInt(response.headers['X-RateLimit-Remaining']) === 0);
}

// Extract performance metrics from response
export function extractMetrics(response, testName) {
  const metrics = {
    status: response.status,
    responseTime: response.timings.duration,
    responseSize: response.body.length,
    testName: testName,
    timestamp: new Date().toISOString()
  };

  // Add custom metrics if headers contain timing information
  if (response.headers['Server-Timing']) {
    metrics.serverTiming = response.headers['Server-Timing'];
  }

  return metrics;
}

// Create test summary
export function createTestSummary(testResults) {
  const summary = {
    totalTests: testResults.length,
    passedTests: testResults.filter(r => r.status < 400).length,
    failedTests: testResults.filter(r => r.status >= 400).length,
    averageResponseTime: testResults.reduce((sum, r) => sum + r.responseTime, 0) / testResults.length,
    minResponseTime: Math.min(...testResults.map(r => r.responseTime)),
    maxResponseTime: Math.max(...testResults.map(r => r.responseTime))
  };

  return summary;
}

// Handle errors gracefully
export function handleError(error, context = '') {
  console.error(`Error in ${context}:`, error.message);
  return {
    error: true,
    message: error.message,
    context: context,
    timestamp: new Date().toISOString()
  };
}

// Wait for a specific condition with timeout
export function waitForCondition(condition, timeout = 5000, interval = 100) {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    if (condition()) {
      return true;
    }
    sleep(interval / 1000);
  }
  
  return false;
}

// Generate test report data
export function generateTestReport(testName, results, thresholds) {
  const report = {
    testName: testName,
    timestamp: new Date().toISOString(),
    summary: createTestSummary(results),
    thresholds: thresholds,
    results: results.slice(0, 100) // Limit to first 100 results for readability
  };

  return report;
}
