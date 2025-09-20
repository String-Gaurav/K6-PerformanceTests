import http from 'k6/http';
import { check, sleep } from 'k6';
import { BASE_CONFIG, USER_CREDENTIALS } from '../../config/base-config.js';
import { makeRequest, validateResponse, generateRandomUser, simulateUserBehavior, authenticateUser, makeAuthenticatedRequest } from '../../utils/helpers.js';
import { defaultMonitor } from '../../utils/performance-monitor.js';

/**
 * Authentication API Performance Tests
 * Tests authentication endpoints, token management, and protected resource access
 */

export const options = {
  thresholds: {
    ...BASE_CONFIG.THRESHOLDS,
    http_req_duration: ['p(95)<800', 'p(99)<1500'],
    http_req_failed: ['rate<0.05']
  },
  scenarios: {
    auth_load_test: {
      executor: 'ramping-vus',
      startVUs: 1,
      stages: [
        { duration: '30s', target: 3 },
        { duration: '1m', target: 3 },
        { duration: '30s', target: 0 }
      ]
    }
  }
};

export function setup() {
  console.log('Starting Authentication Performance Test');
  console.log(`Base URL: ${BASE_CONFIG.BASE_URL}`);
  
  // Verify auth endpoint is accessible
  const healthCheck = http.get(`${BASE_CONFIG.BASE_URL}/auth/status`);
  check(healthCheck, {
    'Auth endpoint is accessible': (r) => r.status === 200 || r.status === 404
  });

  return {
    baseUrl: BASE_CONFIG.BASE_URL,
    testStartTime: new Date().toISOString(),
    validTokens: []
  };
}

export default function(data) {
  const testStartTime = Date.now();
  
  // Test 1: User Registration
  testUserRegistration(data.baseUrl);
  
  // Test 2: User Login
  const token = testUserLogin(data.baseUrl);
  
  // Test 3: Token Validation
  if (token) {
    testTokenValidation(data.baseUrl, token);
    
    // Test 4: Access Protected Resources
    testProtectedResourceAccess(data.baseUrl, token);
    
    // Test 5: Token Refresh
    testTokenRefresh(data.baseUrl, token);
    
    // Test 6: Logout
    testUserLogout(data.baseUrl, token);
  }
  
  // Test 7: Invalid Authentication Attempts
  testInvalidAuthAttempts(data.baseUrl);
  
  // Test 8: Rate Limiting on Auth Endpoints
  testAuthRateLimiting(data.baseUrl);
  
  // Simulate realistic user behavior
  simulateUserBehavior();
  
  // Track overall test performance
  defaultMonitor.trackRequest(
    { timings: { duration: Date.now() - testStartTime }, status: 200 },
    'complete_auth_test',
    testStartTime
  );
}

// Test 1: User Registration
function testUserRegistration(baseUrl) {
  const newUser = generateRandomUser();
  const startTime = Date.now();
  
  const registrationPayload = JSON.stringify({
    username: newUser.username,
    email: newUser.email,
    password: newUser.password,
    name: newUser.name
  });
  
  const response = makeRequest('POST', `${baseUrl}/auth/register`, registrationPayload);
  
  const validationChecks = validateResponse(response, 201);
  validationChecks.push(
    check(response, {
      'Registration creates user': (r) => {
        try {
          const data = JSON.parse(r.body);
          return data.username === newUser.username;
        } catch (e) {
          return false;
        }
      },
      'Registration response time < 800ms': (r) => r.timings.duration < 800,
      'Registration returns user data': (r) => {
        try {
          const data = JSON.parse(r.body);
          return data.id && data.username;
        } catch (e) {
          return false;
        }
      }
    })
  );

  defaultMonitor.trackRequest(response, 'user_registration', startTime);
}

// Test 2: User Login
export function testUserLogin(baseUrl) {
  const credentials = USER_CREDENTIALS[Math.floor(Math.random() * USER_CREDENTIALS.length)];
  const startTime = Date.now();
  
  const loginPayload = JSON.stringify({
    username: credentials.username,
    password: credentials.password
  });
  
  const response = makeRequest('POST', `${baseUrl}/auth/login`, loginPayload);
  
  const validationChecks = validateResponse(response, 200);
  let token = null;
  
  validationChecks.push(
    check(response, {
      'Login returns token': (r) => {
        try {
          const data = JSON.parse(r.body);
          token = data.token || data.access_token;
          return token !== null;
        } catch (e) {
          return false;
        }
      },
      'Login response time < 600ms': (r) => r.timings.duration < 600,
      'Login returns user info': (r) => {
        try {
          const data = JSON.parse(r.body);
          return data.user || data.username;
        } catch (e) {
          return false;
        }
      }
    })
  );

  defaultMonitor.trackRequest(response, 'user_login', startTime);
  return token;
}

// Test 3: Token Validation
export function testTokenValidation(baseUrl, token) {
  const startTime = Date.now();
  
  const response = makeRequest('GET', `${baseUrl}/auth/validate`, null, {
    'Authorization': `Bearer ${token}`
  });
  
  const validationChecks = validateResponse(response, 200);
  validationChecks.push(
    check(response, {
      'Token validation succeeds': (r) => r.status === 200,
      'Token validation response time < 300ms': (r) => r.timings.duration < 300,
      'Token validation returns user data': (r) => {
        try {
          const data = JSON.parse(r.body);
          return data.valid === true;
        } catch (e) {
          return false;
        }
      }
    })
  );

  defaultMonitor.trackRequest(response, 'token_validation', startTime);
}

// Test 4: Access Protected Resources
function testProtectedResourceAccess(baseUrl, token) {
  const startTime = Date.now();
  
  const response = makeAuthenticatedRequest('GET', `${baseUrl}/users/profile`, token);
  
  const validationChecks = validateResponse(response, 200);
  validationChecks.push(
    check(response, {
      'Protected resource access succeeds': (r) => r.status === 200,
      'Protected resource response time < 400ms': (r) => r.timings.duration < 400,
      'Protected resource returns data': (r) => {
        try {
          const data = JSON.parse(r.body);
          return data.id || data.username;
        } catch (e) {
          return false;
        }
      }
    })
  );

  defaultMonitor.trackRequest(response, 'protected_resource_access', startTime);
}

// Test 5: Token Refresh
function testTokenRefresh(baseUrl, token) {
  const startTime = Date.now();
  
  const refreshPayload = JSON.stringify({
    refresh_token: token
  });
  
  const response = makeRequest('POST', `${baseUrl}/auth/refresh`, refreshPayload);
  
  const validationChecks = validateResponse(response, 200);
  validationChecks.push(
    check(response, {
      'Token refresh succeeds': (r) => r.status === 200,
      'Token refresh response time < 500ms': (r) => r.timings.duration < 500,
      'Token refresh returns new token': (r) => {
        try {
          const data = JSON.parse(r.body);
          return data.token || data.access_token;
        } catch (e) {
          return false;
        }
      }
    })
  );

  defaultMonitor.trackRequest(response, 'token_refresh', startTime);
}

// Test 6: User Logout
function testUserLogout(baseUrl, token) {
  const startTime = Date.now();
  
  const response = makeAuthenticatedRequest('POST', `${baseUrl}/auth/logout`, token);
  
  const validationChecks = validateResponse(response, 200);
  validationChecks.push(
    check(response, {
      'Logout succeeds': (r) => r.status === 200,
      'Logout response time < 300ms': (r) => r.timings.duration < 300
    })
  );

  defaultMonitor.trackRequest(response, 'user_logout', startTime);
}

// Test 7: Invalid Authentication Attempts
function testInvalidAuthAttempts(baseUrl) {
  const invalidCredentials = [
    { username: 'invalid', password: 'invalid' },
    { username: '', password: '' },
    { username: 'user@test.com', password: 'wrongpassword' }
  ];
  
  invalidCredentials.forEach((creds, index) => {
    const startTime = Date.now();
    
    const loginPayload = JSON.stringify({
      username: creds.username,
      password: creds.password
    });
    
    const response = makeRequest('POST', `${baseUrl}/auth/login`, loginPayload);
    
    const validationChecks = validateResponse(response, 401);
    validationChecks.push(
      check(response, {
        'Invalid login returns 401': (r) => r.status === 401,
        'Invalid login response time < 400ms': (r) => r.timings.duration < 400
      })
    );

    defaultMonitor.trackRequest(response, `invalid_auth_attempt_${index}`, startTime);
  });
}

// Test 8: Rate Limiting on Auth Endpoints
function testAuthRateLimiting(baseUrl) {
  const startTime = Date.now();
  
  // Simulate multiple rapid login attempts
  for (let i = 0; i < 5; i++) {
    const loginPayload = JSON.stringify({
      username: `rate_limit_test_${i}`,
      password: 'password123'
    });
    
    const response = makeRequest('POST', `${baseUrl}/auth/login`, loginPayload);
    
    check(response, {
      'Rate limiting test response': (r) => r.status === 200 || r.status === 429 || r.status === 401,
      'Rate limiting response time reasonable': (r) => r.timings.duration < 1000
    });

    defaultMonitor.trackRequest(response, `rate_limit_test_${i}`, startTime);
    
    // Small delay between requests
    sleep(0.1);
  }
}

export function teardown(data) {
  console.log('Authentication Performance Test Completed');
  
  const summary = defaultMonitor.getSummary();
  console.log('Performance Summary:');
  console.log(`Total Requests: ${summary.totalRequests}`);
  console.log(`Average Response Time: ${summary.averageResponseTime}ms`);
  console.log(`Min Response Time: ${summary.minResponseTime}ms`);
  console.log(`Max Response Time: ${summary.maxResponseTime}ms`);
  console.log(`Error Rate: ${summary.errorRate}%`);
  
  // Check thresholds
  const thresholdResults = defaultMonitor.checkThresholds({
    avg_response_time: 600,
    max_response_time: 1500,
    error_rate: 10 // Auth endpoints may have higher error rates due to invalid attempts
  });
  
  console.log('Threshold Results:');
  thresholdResults.forEach(result => {
    const status = result.passed ? 'PASS' : 'FAIL';
    console.log(`${status} ${result.metric}: ${result.actual} (threshold: ${result.threshold})`);
  });
}
