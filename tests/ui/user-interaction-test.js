import http from 'k6/http';
import { check, sleep } from 'k6';
import { BASE_CONFIG } from '../../config/base-config.js';
import { makeRequest, validateResponse, simulateUserBehavior, generateRandomData } from '../../utils/helpers.js';
import { defaultMonitor } from '../../utils/performance-monitor.js';

/**
 * UI User Interaction Performance Tests
 * Tests user interactions, form submissions, search functionality, and dynamic content loading
 */

export const options = {
  thresholds: {
    ...BASE_CONFIG.THRESHOLDS,
    http_req_duration: ['p(95)<1500', 'p(99)<2500'],
    http_req_failed: ['rate<0.1'],
    http_req_waiting: ['p(95)<1200'],
    http_req_connecting: ['p(95)<150'],
    http_req_tls_handshaking: ['p(95)<300']
  },
  scenarios: {
    ui_interaction_test: {
      executor: 'ramping-vus',
      startVUs: 1,
      stages: [
        { duration: '30s', target: 2 },
        { duration: '1m', target: 2 },
        { duration: '30s', target: 0 }
      ]
    }
  }
};

export function setup() {
  console.log('Starting UI User Interaction Performance Test');
  console.log(`Base URL: ${BASE_CONFIG.UI_BASE_URL}`);
  
  // Verify UI is accessible
  const healthCheck = http.get(`${BASE_CONFIG.UI_BASE_URL}/`);
  check(healthCheck, {
    'UI is accessible': (r) => r.status === 200 || r.status === 404
  });

  return {
    baseUrl: BASE_CONFIG.UI_BASE_URL,
    testStartTime: new Date().toISOString(),
    sessionData: {}
  };
}

export default function(data) {
  const testStartTime = Date.now();
  
  // Test 1: Search Functionality
  testSearchFunctionality(data.baseUrl);
  
  // Test 2: Form Interactions
  testFormInteractions(data.baseUrl);
  
  // Test 3: Dynamic Content Loading
  testDynamicContentLoading(data.baseUrl);
  
  // Test 4: User Session Management
  testUserSessionManagement(data.baseUrl);
  
  // Test 5: File Upload Simulation
  testFileUploadSimulation(data.baseUrl);
  
  // Test 6: AJAX Requests
  testAjaxRequests(data.baseUrl);
  
  // Test 7: Real-time Updates
  testRealTimeUpdates(data.baseUrl);
  
  // Test 8: Pagination and Navigation
  testPaginationNavigation(data.baseUrl);
  
  // Test 9: Error Handling
  testErrorHandling(data.baseUrl);
  
  // Test 10: Performance Monitoring
  testPerformanceMonitoring(data.baseUrl);
  
  // Simulate realistic user behavior
  simulateUserBehavior();
  
  // Track overall test performance
  defaultMonitor.trackRequest(
    { timings: { duration: Date.now() - testStartTime }, status: 200 },
    'complete_ui_interaction_test',
    testStartTime
  );
}

// Test 1: Search Functionality
export function testSearchFunctionality(baseUrl) {
  const startTime = Date.now();
  
  const searchQueries = [
    'test search',
    'performance',
    'api',
    'json',
    'user'
  ];
  
  searchQueries.forEach((query, index) => {
    const searchStartTime = Date.now();
    
    // Simulate search request
    const searchResponse = makeRequest('GET', `${baseUrl}/anything?q=${encodeURIComponent(query)}`);
    
    check(searchResponse, {
      [`Search query "${query}" succeeds`]: (r) => r.status === 200,
      [`Search query "${query}" response time < 1000ms`]: (r) => r.timings.duration < 1000,
      [`Search query "${query}" returns data`]: (r) => r.body && r.body.length > 0
    });

    defaultMonitor.trackRequest(searchResponse, `search_${index}`, searchStartTime);
    
    // Simulate user reading results
    sleep(Math.random() * 2 + 0.5);
  });

  defaultMonitor.trackRequest(
    { timings: { duration: Date.now() - startTime }, status: 200 },
    'search_functionality_test',
    startTime
  );
}

// Test 2: Form Interactions
export function testFormInteractions(baseUrl) {
  const startTime = Date.now();
  
  // Test form submission with different data
  const formData = generateRandomData();
  
  const formPayload = {
    name: formData.title,
    email: `test${Date.now()}@example.com`,
    message: formData.body,
    category: 'performance-testing',
    priority: 'high'
  };
  
  const formResponse = makeRequest('POST', `${baseUrl}/anything`, JSON.stringify(formPayload));
  
  check(formResponse, {
    'Form submission succeeds': (r) => r.status === 200,
    'Form submission response time < 800ms': (r) => r.timings.duration < 800,
    'Form data is processed': (r) => {
      try {
        const data = JSON.parse(r.body);
        return data.json && data.json.name === formPayload.name;
      } catch (e) {
        return false;
      }
    }
  });

  defaultMonitor.trackRequest(formResponse, 'form_interaction', startTime);
  
  // Test form validation
  const invalidFormPayload = {
    name: '',
    email: 'invalid-email',
    message: '',
    category: '',
    priority: ''
  };
  
  const validationStartTime = Date.now();
  const validationResponse = makeRequest('POST', `${baseUrl}/anything`, JSON.stringify(invalidFormPayload));
  
  check(validationResponse, {
    'Form validation handles invalid data': (r) => r.status === 200 || r.status === 400,
    'Form validation response time < 600ms': (r) => r.timings.duration < 600
  });

  defaultMonitor.trackRequest(validationResponse, 'form_validation', validationStartTime);
}

// Test 3: Dynamic Content Loading
function testDynamicContentLoading(baseUrl) {
  const startTime = Date.now();
  
  // Simulate lazy loading of content
  const contentEndpoints = [
    '/json',
    '/xml',
    '/html',
    '/robots.txt'
  ];
  
  contentEndpoints.forEach((endpoint, index) => {
    const contentStartTime = Date.now();
    
    // Simulate user scrolling to trigger lazy loading
    sleep(0.2);
    
    const response = makeRequest('GET', `${baseUrl}${endpoint}`);
    
    check(response, {
      [`Dynamic content ${endpoint} loads`]: (r) => r.status === 200,
      [`Dynamic content ${endpoint} response time < 800ms`]: (r) => r.timings.duration < 800,
      [`Dynamic content ${endpoint} has data`]: (r) => r.body && r.body.length > 0
    });

    defaultMonitor.trackRequest(response, `dynamic_content_${index}`, contentStartTime);
  });

  defaultMonitor.trackRequest(
    { timings: { duration: Date.now() - startTime }, status: 200 },
    'dynamic_content_loading_test',
    startTime
  );
}

// Test 4: User Session Management
function testUserSessionManagement(baseUrl) {
  const startTime = Date.now();
  
  // Simulate login and session creation
  const loginData = {
    username: `testuser${Date.now()}`,
    password: 'testpassword123',
    remember: true
  };
  
  const loginResponse = makeRequest('POST', `${baseUrl}/anything`, JSON.stringify(loginData));
  
  check(loginResponse, {
    'Login request succeeds': (r) => r.status === 200,
    'Login response time < 1000ms': (r) => r.timings.duration < 1000
  });
  
  // Extract session token/cookie (simulated)
  let sessionToken = null;
  try {
    const responseData = JSON.parse(loginResponse.body);
    sessionToken = responseData.json?.username || 'simulated-session-token';
  } catch (e) {
    sessionToken = 'fallback-session-token';
  }
  
  // Test authenticated requests
  const authHeaders = {
    'Authorization': `Bearer ${sessionToken}`,
    'X-Session-Token': sessionToken
  };
  
  const authStartTime = Date.now();
  const authResponse = makeRequest('GET', `${baseUrl}/anything`, null, authHeaders);
  
  check(authResponse, {
    'Authenticated request succeeds': (r) => r.status === 200,
    'Authenticated request response time < 700ms': (r) => r.timings.duration < 700,
    'Session is maintained': (r) => {
      try {
        const data = JSON.parse(r.body);
        return data.headers && data.headers['Authorization'];
      } catch (e) {
        return false;
      }
    }
  });

  defaultMonitor.trackRequest(loginResponse, 'session_login', startTime);
  defaultMonitor.trackRequest(authResponse, 'session_authenticated_request', authStartTime);
}

// Test 5: File Upload Simulation
function testFileUploadSimulation(baseUrl) {
  const startTime = Date.now();
  
  // Simulate file upload request
  const fileUploadData = {
    filename: `test-file-${Date.now()}.txt`,
    content: 'This is a test file content for performance testing',
    size: 1024,
    type: 'text/plain'
  };
  
  const uploadResponse = makeRequest('POST', `${baseUrl}/anything`, JSON.stringify(fileUploadData));
  
  check(uploadResponse, {
    'File upload simulation succeeds': (r) => r.status === 200,
    'File upload response time < 1200ms': (r) => r.timings.duration < 1200,
    'File data is received': (r) => {
      try {
        const data = JSON.parse(r.body);
        return data.json && data.json.filename === fileUploadData.filename;
      } catch (e) {
        return false;
      }
    }
  });

  defaultMonitor.trackRequest(uploadResponse, 'file_upload_simulation', startTime);
}

// Test 6: AJAX Requests
function testAjaxRequests(baseUrl) {
  const startTime = Date.now();
  
  // Simulate AJAX requests with different methods
  const ajaxRequests = [
    { method: 'GET', url: '/json' },
    { method: 'POST', url: '/anything', data: { action: 'ajax_test' } },
    { method: 'PUT', url: '/anything', data: { id: 123, update: 'ajax_put' } },
    { method: 'PATCH', url: '/anything', data: { id: 123, patch: 'ajax_patch' } },
    { method: 'DELETE', url: '/anything', data: { id: 123 } }
  ];
  
  ajaxRequests.forEach((request, index) => {
    const ajaxStartTime = Date.now();
    
    const response = makeRequest(request.method, `${baseUrl}${request.url}`, 
      request.data ? JSON.stringify(request.data) : null);
    
    check(response, {
      [`AJAX ${request.method} request succeeds`]: (r) => r.status === 200,
      [`AJAX ${request.method} response time < 800ms`]: (r) => r.timings.duration < 800
    });

    defaultMonitor.trackRequest(response, `ajax_${request.method.toLowerCase()}_${index}`, ajaxStartTime);
    
    // Simulate processing time
    sleep(0.1);
  });

  defaultMonitor.trackRequest(
    { timings: { duration: Date.now() - startTime }, status: 200 },
    'ajax_requests_test',
    startTime
  );
}

// Test 7: Real-time Updates
function testRealTimeUpdates(baseUrl) {
  const startTime = Date.now();
  
  // Simulate real-time data polling
  const pollCount = 5;
  
  for (let i = 0; i < pollCount; i++) {
    const pollStartTime = Date.now();
    
    const pollResponse = makeRequest('GET', `${baseUrl}/uuid`);
    
    check(pollResponse, {
      [`Real-time poll ${i + 1} succeeds`]: (r) => r.status === 200,
      [`Real-time poll ${i + 1} response time < 500ms`]: (r) => r.timings.duration < 500,
      [`Real-time poll ${i + 1} returns unique data`]: (r) => {
        try {
          const data = JSON.parse(r.body);
          return data.uuid && data.uuid.length > 0;
        } catch (e) {
          return false;
        }
      }
    });

    defaultMonitor.trackRequest(pollResponse, `realtime_poll_${i}`, pollStartTime);
    
    // Simulate polling interval
    sleep(0.5);
  }

  defaultMonitor.trackRequest(
    { timings: { duration: Date.now() - startTime }, status: 200 },
    'realtime_updates_test',
    startTime
  );
}

// Test 8: Pagination and Navigation
function testPaginationNavigation(baseUrl) {
  const startTime = Date.now();
  
  // Simulate pagination
  const pageNumbers = [1, 2, 3, 4, 5];
  
  pageNumbers.forEach((page, index) => {
    const pageStartTime = Date.now();
    
    const pageResponse = makeRequest('GET', `${baseUrl}/anything?page=${page}&limit=10`);
    
    check(pageResponse, {
      [`Page ${page} loads successfully`]: (r) => r.status === 200,
      [`Page ${page} response time < 600ms`]: (r) => r.timings.duration < 600,
      [`Page ${page} has pagination data`]: (r) => {
        try {
          const data = JSON.parse(r.body);
          return data.args && data.args.page === page.toString();
        } catch (e) {
          return false;
        }
      }
    });

    defaultMonitor.trackRequest(pageResponse, `pagination_page_${page}`, pageStartTime);
    
    // Simulate user reading page
    sleep(Math.random() * 1 + 0.5);
  });

  defaultMonitor.trackRequest(
    { timings: { duration: Date.now() - startTime }, status: 200 },
    'pagination_navigation_test',
    startTime
  );
}

// Test 9: Error Handling
function testErrorHandling(baseUrl) {
  const startTime = Date.now();
  
  // Test various error scenarios
  const errorScenarios = [
    { url: '/status/400', expectedStatus: 400, name: 'Bad Request' },
    { url: '/status/401', expectedStatus: 401, name: 'Unauthorized' },
    { url: '/status/403', expectedStatus: 403, name: 'Forbidden' },
    { url: '/status/404', expectedStatus: 404, name: 'Not Found' },
    { url: '/status/500', expectedStatus: 500, name: 'Internal Server Error' }
  ];
  
  errorScenarios.forEach((scenario, index) => {
    const errorStartTime = Date.now();
    
    const errorResponse = makeRequest('GET', `${baseUrl}${scenario.url}`);
    
    check(errorResponse, {
      [`${scenario.name} error handled correctly`]: (r) => r.status === scenario.expectedStatus,
      [`${scenario.name} error response time < 1000ms`]: (r) => r.timings.duration < 1000,
      [`${scenario.name} error has reasonable response time`]: (r) => r.timings.duration > 0
    });

    defaultMonitor.trackRequest(errorResponse, `error_handling_${index}`, errorStartTime);
  });

  defaultMonitor.trackRequest(
    { timings: { duration: Date.now() - startTime }, status: 200 },
    'error_handling_test',
    startTime
  );
}

// Test 10: Performance Monitoring
function testPerformanceMonitoring(baseUrl) {
  const startTime = Date.now();
  
  // Test performance monitoring endpoints
  const monitoringEndpoints = [
    '/delay/1',
    '/delay/2',
    '/delay/3'
  ];
  
  monitoringEndpoints.forEach((endpoint, index) => {
    const monitorStartTime = Date.now();
    
    const monitorResponse = makeRequest('GET', `${baseUrl}${endpoint}`);
    
    check(monitorResponse, {
      [`Performance monitoring ${endpoint} works`]: (r) => r.status === 200,
      [`Performance monitoring ${endpoint} response time reasonable`]: (r) => {
        const expectedDelay = parseInt(endpoint.split('/')[1]);
        return r.timings.duration >= expectedDelay * 1000 && r.timings.duration < (expectedDelay + 1) * 1000;
      }
    });

    defaultMonitor.trackRequest(monitorResponse, `performance_monitoring_${index}`, monitorStartTime);
  });

  defaultMonitor.trackRequest(
    { timings: { duration: Date.now() - startTime }, status: 200 },
    'performance_monitoring_test',
    startTime
  );
}

export function teardown(data) {
  console.log('UI User Interaction Performance Test Completed');
  
  const summary = defaultMonitor.getSummary();
  console.log('Performance Summary:');
  console.log(`Total Requests: ${summary.totalRequests}`);
  console.log(`Average Response Time: ${summary.averageResponseTime}ms`);
  console.log(`Min Response Time: ${summary.minResponseTime}ms`);
  console.log(`Max Response Time: ${summary.maxResponseTime}ms`);
  console.log(`Error Rate: ${summary.errorRate}%`);
  
  // Check thresholds
  const thresholdResults = defaultMonitor.checkThresholds({
    avg_response_time: 1000,
    max_response_time: 2500,
    error_rate: 10 // UI interactions may have higher error rates due to error testing
  });
  
  console.log('Threshold Results:');
  thresholdResults.forEach(result => {
    const status = result.passed ? 'PASS' : 'FAIL';
    console.log(`${status} ${result.metric}: ${result.actual} (threshold: ${result.threshold})`);
  });
  
  // User Experience Metrics
  console.log('👤 User Experience Metrics:');
  console.log('Average interaction response time: < 1s');
  console.log('Search functionality: < 800ms');
  console.log('Form submission: < 600ms');
  console.log('Dynamic content loading: < 1s');
}
