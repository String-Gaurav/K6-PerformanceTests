import { BASE_CONFIG, SCENARIOS } from '../config/base-config.js';
import { testGetAllPosts, testGetSpecificPost, testCreatePost } from '../tests/api/rest-api-test.js';
import { testUserLogin, testTokenValidation } from '../tests/api/auth-test.js';
import { testGetPostsQuery, testIntrospectionQuery } from '../tests/api/graphql-test.js';

/**
 * API Smoke Test Scenario
 * Quick validation that all major API endpoints are working
 */

export const options = {
  thresholds: {
    http_req_duration: ['p(95)<1000'],
    http_req_failed: ['rate<0.05'],
    checks: ['rate>0.95']
  },
  scenarios: {
    api_smoke_test: {
      executor: 'constant-vus',
      vus: 1,
      duration: '30s',
      tags: { test_type: 'smoke' }
    }
  }
};

export function setup() {
  console.log('Starting API Smoke Test');
  console.log(`Base URL: ${BASE_CONFIG.BASE_URL}`);
  return {
    baseUrl: BASE_CONFIG.BASE_URL,
    testStartTime: new Date().toISOString()
  };
}

export default function(data) {
  console.log('Running API smoke test iteration');
  
  // REST API Smoke Tests
  testGetAllPosts(data.baseUrl);
  testGetSpecificPost(data.baseUrl);
  testCreatePost(data.baseUrl);
  
  // Authentication Smoke Tests
  const token = testUserLogin(data.baseUrl);
  if (token) {
    testTokenValidation(data.baseUrl, token);
  }
  
  // GraphQL Smoke Tests
  testIntrospectionQuery(`${data.baseUrl}/graphql`);
  testGetPostsQuery(`${data.baseUrl}/graphql`);
}

export function teardown(data) {
  console.log('API Smoke Test Completed Successfully');
}
