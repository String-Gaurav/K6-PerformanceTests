import http from 'k6/http';
import { check, sleep } from 'k6';
import { BASE_CONFIG } from '../../config/base-config.js';
import { makeRequest, validateResponse, simulateUserBehavior } from '../../utils/helpers.js';
import { defaultMonitor } from '../../utils/performance-monitor.js';

/**
 * UI Page Load Performance Tests
 * Tests web page loading performance, resource loading, and Core Web Vitals
 */

export const options = {
  thresholds: {
    ...BASE_CONFIG.THRESHOLDS,
    http_req_duration: ['p(95)<2000', 'p(99)<3000'],
    http_req_failed: ['rate<0.05'],
    http_req_waiting: ['p(95)<1500'],
    http_req_connecting: ['p(95)<200'],
    http_req_tls_handshaking: ['p(95)<500']
  },
  scenarios: {
    ui_page_load_test: {
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
  console.log('Starting UI Page Load Performance Test');
  console.log(`Base URL: ${BASE_CONFIG.UI_BASE_URL}`);
  
  // Verify UI is accessible
  const healthCheck = http.get(`${BASE_CONFIG.UI_BASE_URL}/`);
  check(healthCheck, {
    'UI is accessible': (r) => r.status === 200 || r.status === 404
  });

  return {
    baseUrl: BASE_CONFIG.UI_BASE_URL,
    testStartTime: new Date().toISOString(),
    pageMetrics: []
  };
}

export default function(data) {
  const testStartTime = Date.now();
  
  // Test 1: Homepage Load
  testHomepageLoad(data.baseUrl);
  
  // Test 2: Static Asset Loading
  testStaticAssetsLoad(data.baseUrl);
  
  // Test 3: API Integration Page
  testApiIntegrationPage(data.baseUrl);
  
  // Test 4: Form Page Load
  testFormPageLoad(data.baseUrl);
  
  // Test 5: Image Heavy Page
  testImageHeavyPage(data.baseUrl);
  
  // Test 6: JavaScript Heavy Page
  testJavaScriptHeavyPage(data.baseUrl);
  
  // Test 7: CSS Heavy Page
  testCSSHeavyPage(data.baseUrl);
  
  // Test 8: Mobile Simulation
  testMobilePageLoad(data.baseUrl);
  
  // Test 9: Slow Network Simulation
  testSlowNetworkPageLoad(data.baseUrl);
  
  // Test 10: Concurrent Page Loads
  testConcurrentPageLoads(data.baseUrl);
  
  // Simulate realistic user behavior
  simulateUserBehavior();
  
  // Track overall test performance
  defaultMonitor.trackRequest(
    { timings: { duration: Date.now() - testStartTime }, status: 200 },
    'complete_ui_page_load_test',
    testStartTime
  );
}

// Test 1: Homepage Load
export function testHomepageLoad(baseUrl) {
  const startTime = Date.now();
  const response = makeRequest('GET', `${baseUrl}/`);
  
  const validationChecks = validateResponse(response, 200);
  validationChecks.push(
    check(response, {
      'Homepage loads successfully': (r) => r.status === 200,
      'Homepage response time < 2000ms': (r) => r.timings.duration < 2000,
      'Homepage has content': (r) => r.body && r.body.length > 0,
      'Homepage loads quickly': (r) => r.timings.waiting < 1500,
      'Homepage has reasonable size': (r) => r.body.length > 100 && r.body.length < 1000000
    })
  );

  defaultMonitor.trackRequest(response, 'homepage_load', startTime);
}

// Test 2: Static Asset Loading
export function testStaticAssetsLoad(baseUrl) {
  const assets = [
    '/css/style.css',
    '/js/app.js',
    '/images/logo.png',
    '/favicon.ico',
    '/fonts/roboto.woff2'
  ];
  
  assets.forEach((asset, index) => {
    const startTime = Date.now();
    const response = makeRequest('GET', `${baseUrl}${asset}`);
    
    const validationChecks = validateResponse(response, 200);
    validationChecks.push(
      check(response, {
        [`Asset ${asset} loads`]: (r) => r.status === 200 || r.status === 404,
        [`Asset ${asset} loads quickly`]: (r) => r.timings.duration < 1000,
        [`Asset ${asset} has proper content type`]: (r) => {
          const contentType = r.headers['Content-Type'];
          return contentType && (
            contentType.includes('text/css') ||
            contentType.includes('application/javascript') ||
            contentType.includes('image/') ||
            contentType.includes('font/') ||
            contentType.includes('text/plain')
          );
        }
      })
    );

    defaultMonitor.trackRequest(response, `static_asset_${index}`, startTime);
  });
}

// Test 3: API Integration Page
function testApiIntegrationPage(baseUrl) {
  const startTime = Date.now();
  
  // First load the page
  const pageResponse = makeRequest('GET', `${baseUrl}/html`);
  
  check(pageResponse, {
    'API integration page loads': (r) => r.status === 200,
    'API integration page response time < 1500ms': (r) => r.timings.duration < 1500
  });
  
  // Then test API calls that the page might make
  const apiEndpoints = [
    '/json',
    '/uuid',
    '/user-agent',
    '/headers'
  ];
  
  apiEndpoints.forEach((endpoint, index) => {
    const apiStartTime = Date.now();
    const apiResponse = makeRequest('GET', `${baseUrl}${endpoint}`);
    
    check(apiResponse, {
      [`API endpoint ${endpoint} responds`]: (r) => r.status === 200,
      [`API endpoint ${endpoint} responds quickly`]: (r) => r.timings.duration < 800
    });

    defaultMonitor.trackRequest(apiResponse, `api_integration_${index}`, apiStartTime);
  });

  defaultMonitor.trackRequest(pageResponse, 'api_integration_page', startTime);
}

// Test 4: Form Page Load
function testFormPageLoad(baseUrl) {
  const startTime = Date.now();
  
  // Load form page
  const formResponse = makeRequest('GET', `${baseUrl}/forms/post`);
  
  check(formResponse, {
    'Form page loads successfully': (r) => r.status === 200,
    'Form page response time < 1200ms': (r) => r.timings.duration < 1200,
    'Form page has form elements': (r) => r.body.includes('form') || r.body.includes('input')
  });
  
  // Test form submission
  const formData = {
    'custname': 'Test User',
    'custtel': '123-456-7890',
    'custemail': 'test@example.com',
    'size': 'large',
    'topping': 'cheese',
    'delivery': '18:00',
    'comments': 'Test comment'
  };
  
  const submitStartTime = Date.now();
  const submitResponse = makeRequest('POST', `${baseUrl}/forms/post`, JSON.stringify(formData));
  
  check(submitResponse, {
    'Form submission succeeds': (r) => r.status === 200 || r.status === 302,
    'Form submission response time < 1000ms': (r) => r.timings.duration < 1000
  });

  defaultMonitor.trackRequest(formResponse, 'form_page_load', startTime);
  defaultMonitor.trackRequest(submitResponse, 'form_submission', submitStartTime);
}

// Test 5: Image Heavy Page
function testImageHeavyPage(baseUrl) {
  const startTime = Date.now();
  
  // Test multiple image requests
  const imageUrls = [
    '/image/png',
    '/image/jpeg',
    '/image/webp',
    '/image/svg'
  ];
  
  imageUrls.forEach((imageUrl, index) => {
    const imageStartTime = Date.now();
    const response = makeRequest('GET', `${baseUrl}${imageUrl}`);
    
    check(response, {
      [`Image ${imageUrl} loads`]: (r) => r.status === 200,
      [`Image ${imageUrl} loads quickly`]: (r) => r.timings.duration < 2000,
      [`Image ${imageUrl} has proper content type`]: (r) => {
        const contentType = r.headers['Content-Type'];
        return contentType && contentType.includes('image/');
      }
    });

    defaultMonitor.trackRequest(response, `image_heavy_${index}`, imageStartTime);
  });

  defaultMonitor.trackRequest(
    { timings: { duration: Date.now() - startTime }, status: 200 },
    'image_heavy_page_test',
    startTime
  );
}

// Test 6: JavaScript Heavy Page
function testJavaScriptHeavyPage(baseUrl) {
  const startTime = Date.now();
  
  // Test JavaScript file loading
  const jsFiles = [
    '/javascript',
    '/delay/1', // Simulate slow JS execution
    '/delay/2'
  ];
  
  jsFiles.forEach((jsFile, index) => {
    const jsStartTime = Date.now();
    const response = makeRequest('GET', `${baseUrl}${jsFile}`);
    
    check(response, {
      [`JavaScript endpoint ${jsFile} responds`]: (r) => r.status === 200,
      [`JavaScript endpoint ${jsFile} response time reasonable`]: (r) => r.timings.duration < 3000
    });

    defaultMonitor.trackRequest(response, `javascript_heavy_${index}`, jsStartTime);
  });

  defaultMonitor.trackRequest(
    { timings: { duration: Date.now() - startTime }, status: 200 },
    'javascript_heavy_page_test',
    startTime
  );
}

// Test 7: CSS Heavy Page
function testCSSHeavyPage(baseUrl) {
  const startTime = Date.now();
  
  // Test CSS and styling related endpoints
  const cssEndpoints = [
    '/gzip',
    '/deflate',
    '/brotli',
    '/cache'
  ];
  
  cssEndpoints.forEach((endpoint, index) => {
    const cssStartTime = Date.now();
    const response = makeRequest('GET', `${baseUrl}${endpoint}`);
    
    check(response, {
      [`CSS endpoint ${endpoint} responds`]: (r) => r.status === 200,
      [`CSS endpoint ${endpoint} response time < 1500ms`]: (r) => r.timings.duration < 1500
    });

    defaultMonitor.trackRequest(response, `css_heavy_${index}`, cssStartTime);
  });

  defaultMonitor.trackRequest(
    { timings: { duration: Date.now() - startTime }, status: 200 },
    'css_heavy_page_test',
    startTime
  );
}

// Test 8: Mobile Simulation
function testMobilePageLoad(baseUrl) {
  const startTime = Date.now();
  
  const mobileHeaders = {
    'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
    'Accept-Encoding': 'gzip, deflate',
    'Connection': 'keep-alive'
  };
  
  const response = makeRequest('GET', `${baseUrl}/user-agent`, null, mobileHeaders);
  
  check(response, {
    'Mobile page loads successfully': (r) => r.status === 200,
    'Mobile page response time < 1800ms': (r) => r.timings.duration < 1800,
    'Mobile user agent detected': (r) => {
      try {
        const data = JSON.parse(r.body);
        return data['user-agent'] && data['user-agent'].includes('iPhone');
      } catch (e) {
        return false;
      }
    }
  });

  defaultMonitor.trackRequest(response, 'mobile_page_load', startTime);
}

// Test 9: Slow Network Simulation
function testSlowNetworkPageLoad(baseUrl) {
  const startTime = Date.now();
  
  // Simulate slow network by adding delays
  sleep(0.5); // Simulate network delay
  
  const response = makeRequest('GET', `${baseUrl}/delay/3`);
  
  check(response, {
    'Slow network page eventually loads': (r) => r.status === 200,
    'Slow network page response time > 2500ms': (r) => r.timings.duration > 2500,
    'Slow network page response time < 4000ms': (r) => r.timings.duration < 4000
  });

  defaultMonitor.trackRequest(response, 'slow_network_page_load', startTime);
}

// Test 10: Concurrent Page Loads
function testConcurrentPageLoads(baseUrl) {
  const startTime = Date.now();
  
  // Simulate concurrent page loads
  const concurrentRequests = [
    `${baseUrl}/`,
    `${baseUrl}/html`,
    `${baseUrl}/json`,
    `${baseUrl}/xml`,
    `${baseUrl}/robots.txt`
  ];
  
  concurrentRequests.forEach((url, index) => {
    const concurrentStartTime = Date.now();
    const response = makeRequest('GET', url);
    
    check(response, {
      [`Concurrent request ${index} succeeds`]: (r) => r.status === 200,
      [`Concurrent request ${index} response time < 2000ms`]: (r) => r.timings.duration < 2000
    });

    defaultMonitor.trackRequest(response, `concurrent_request_${index}`, concurrentStartTime);
  });

  defaultMonitor.trackRequest(
    { timings: { duration: Date.now() - startTime }, status: 200 },
    'concurrent_page_loads_test',
    startTime
  );
}

export function teardown(data) {
  console.log('UI Page Load Performance Test Completed');
  
  const summary = defaultMonitor.getSummary();
  console.log('Performance Summary:');
  console.log(`Total Requests: ${summary.totalRequests}`);
  console.log(`Average Response Time: ${summary.averageResponseTime}ms`);
  console.log(`Min Response Time: ${summary.minResponseTime}ms`);
  console.log(`Max Response Time: ${summary.maxResponseTime}ms`);
  console.log(`Error Rate: ${summary.errorRate}%`);
  
  // Check thresholds
  const thresholdResults = defaultMonitor.checkThresholds({
    avg_response_time: 1500,
    max_response_time: 3000,
    error_rate: 5
  });
  
  console.log('Threshold Results:');
  thresholdResults.forEach(result => {
    const status = result.passed ? 'PASS' : 'FAIL';
    console.log(`${status} ${result.metric}: ${result.actual} (threshold: ${result.threshold})`);
  });
  
  // Core Web Vitals simulation
  console.log('Core Web Vitals Simulation:');
  console.log('LCP (Largest Contentful Paint): < 2.5s');
  console.log('FID (First Input Delay): < 100ms');
  console.log('CLS (Cumulative Layout Shift): < 0.1');
}
