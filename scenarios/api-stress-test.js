import { BASE_CONFIG, SCENARIOS } from '../config/base-config.js';
import { default as restApiTest } from '../tests/api/rest-api-test.js';
import { default as authTest } from '../tests/api/auth-test.js';
import { default as graphqlTest } from '../tests/api/graphql-test.js';

/**
 * API Stress Test Scenario
 * High load testing to find breaking points and validate system stability
 */

export const options = {
  thresholds: {
    http_req_duration: ['p(95)<2000', 'p(99)<5000'],
    http_req_failed: ['rate<0.2'], // Higher failure rate expected in stress tests
    http_reqs: ['rate>50'],
    checks: ['rate>0.7'] // Lower check success rate expected
  },
  scenarios: {
    rest_api_stress: {
      ...SCENARIOS.STRESS,
      exec: 'testRestAPIStress'
    },
    auth_stress: {
      ...SCENARIOS.STRESS,
      exec: 'testAuthenticationStress',
      startTime: '1m'
    },
    graphql_stress: {
      ...SCENARIOS.STRESS,
      exec: 'testGraphQLStress',
      startTime: '2m'
    },
    spike_test: {
      ...SCENARIOS.SPIKE,
      exec: 'testSpikeLoad',
      startTime: '5m'
    }
  }
};

export function setup() {
  console.log('Starting API Stress Test');
  console.log(`Base URL: ${BASE_CONFIG.BASE_URL}`);
  console.log(`API Base URL: ${BASE_CONFIG.API_BASE_URL}`);
  console.log('This test will generate high load - monitor system resources');
  
  return {
    baseUrl: BASE_CONFIG.BASE_URL,
    apiBaseUrl: BASE_CONFIG.API_BASE_URL,
    testStartTime: new Date().toISOString()
  };
}

export function testRestAPIStress(data) {
  console.log('Running REST API stress test');
  // Run REST API tests under stress
  restApiTest(data);
}

export function testAuthenticationStress(data) {
  console.log('Running Authentication stress test');
  // Run authentication tests under stress
  authTest(data);
}

export function testGraphQLStress(data) {
  console.log('Running GraphQL stress test');
  // Run GraphQL tests under stress
  graphqlTest(data);
}

export function testSpikeLoad(data) {
  console.log('Running spike load test');
  
  // Simulate traffic spikes
  const spikeRequests = [
    `${data.baseUrl}/posts`,
    `${data.baseUrl}/users`,
    `${data.baseUrl}/comments`,
    `${data.apiBaseUrl}/auth/login`,
    `${data.baseUrl}/graphql`
  ];
  
  spikeRequests.forEach(url => {
    import { makeRequest } from '../utils/helpers.js';
    const response = makeRequest('GET', url);
    
    // In spike tests, we're more lenient with checks
    if (response.status >= 200 && response.status < 500) {
      console.log(`Spike request to ${url} succeeded: ${response.status}`);
    } else {
      console.log(`Spike request to ${url} failed: ${response.status}`);
    }
  });
}

export default function(data) {
  console.log('API Stress Test - Default function called (should not happen)');
}

export function teardown(data) {
  console.log('API Stress Test Completed');
  console.log('Stress Test Summary:');
  console.log('- REST API: High load validation');
  console.log('- Authentication: Session management under stress');
  console.log('- GraphQL: Complex queries under stress');
  console.log('- Spike Test: Traffic spike handling');
  console.log('');
  console.log('Review error rates and response times to identify bottlenecks');
}
