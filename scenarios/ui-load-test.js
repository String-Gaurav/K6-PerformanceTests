import { BASE_CONFIG, SCENARIOS } from '../config/base-config.js';
import { default as pageLoadTest } from '../tests/ui/page-load-test.js';
import { default as userInteractionTest } from '../tests/ui/user-interaction-test.js';

/**
 * UI Load Test Scenario
 * Moderate load testing to validate UI performance under normal usage
 */

export const options = {
  thresholds: {
    ...BASE_CONFIG.THRESHOLDS,
    http_req_duration: ['p(95)<2000', 'p(99)<3000'],
    http_req_failed: ['rate<0.1'],
    http_req_waiting: ['p(95)<1500'],
    http_req_connecting: ['p(95)<200'],
    http_req_tls_handshaking: ['p(95)<500']
  },
  scenarios: {
    page_load_test: {
      ...SCENARIOS.LOAD,
      exec: 'testPageLoads'
    },
    user_interaction_test: {
      ...SCENARIOS.LOAD,
      exec: 'testUserInteractions',
      startTime: '30s' // Start user interaction tests 30s after page load tests
    },
    mobile_simulation: {
      executor: 'constant-vus',
      vus: 2,
      duration: '3m',
      exec: 'testMobileSimulation',
      startTime: '1m'
    }
  }
};

export function setup() {
  console.log('Starting UI Load Test');
  console.log(`Base URL: ${BASE_CONFIG.UI_BASE_URL}`);
  
  return {
    baseUrl: BASE_CONFIG.UI_BASE_URL,
    testStartTime: new Date().toISOString()
  };
}

export function testPageLoads(data) {
  console.log('Running page load tests');
  // Run page load tests with load
  pageLoadTest(data);
}

export function testUserInteractions(data) {
  console.log('Running user interaction tests');
  // Run user interaction tests with load
  userInteractionTest(data);
}

export function testMobileSimulation(data) {
  console.log('Running mobile simulation tests');
  
  // Simulate mobile user behavior
  const mobileHeaders = {
    'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
    'Accept-Encoding': 'gzip, deflate'
  };
  
  // Test mobile-specific endpoints
  const mobileEndpoints = [
    '/mobile',
    '/responsive',
    '/touch'
  ];
  
  mobileEndpoints.forEach(endpoint => {
    import { makeRequest } from '../utils/helpers.js';
    const response = makeRequest('GET', `${data.baseUrl}${endpoint}`, null, mobileHeaders);
    
    if (response.status === 200) {
      console.log(`Mobile endpoint ${endpoint} accessible`);
    } else {
      console.log(`Mobile endpoint ${endpoint} returned: ${response.status}`);
    }
  });
}

export default function(data) {
  console.log('UI Load Test - Default function called (should not happen)');
}

export function teardown(data) {
  console.log('UI Load Test Completed');
  console.log('UI Load Test Summary:');
  console.log('- Page loads: Performance under normal load');
  console.log('- User interactions: Responsiveness under load');
  console.log('- Mobile simulation: Mobile user experience');
  console.log('');
  console.log('Core Web Vitals should be monitored during this test');
}
