import http from 'k6/http';
import { check, sleep } from 'k6';
import { BASE_CONFIG, TEST_DATA } from '../../config/base-config.js';
import { makeRequest, validateResponse, generateRandomData, simulateUserBehavior } from '../../utils/helpers.js';
import { defaultMonitor } from '../../utils/performance-monitor.js';

/**
 * REST API Performance Tests
 * Tests various REST endpoints for performance, reliability, and functionality
 */

export const options = {
  thresholds: BASE_CONFIG.THRESHOLDS,
  scenarios: {
    rest_api_load_test: {
      executor: 'ramping-vus',
      startVUs: 1,
      stages: [
        { duration: '30s', target: 5 },
        { duration: '1m', target: 5 },
        { duration: '30s', target: 0 }
      ]
    }
  }
};

export function setup() {
  console.log('Starting REST API Performance Test');
  console.log(`Base URL: ${BASE_CONFIG.BASE_URL}`);
  
  // Verify API is accessible
  const healthCheck = http.get(`${BASE_CONFIG.BASE_URL}/posts/1`);
  check(healthCheck, {
    'API is accessible': (r) => r.status === 200,
    'API responds quickly': (r) => r.timings.duration < 1000
  });

  return {
    baseUrl: BASE_CONFIG.BASE_URL,
    testStartTime: new Date().toISOString()
  };
}

export default function(data) {
  const testStartTime = Date.now();
  
  // Test 1: GET - Retrieve all posts
  testGetAllPosts(data.baseUrl);
  
  // Test 2: GET - Retrieve specific post
  testGetSpecificPost(data.baseUrl);
  
  // Test 3: POST - Create new post
  testCreatePost(data.baseUrl);
  
  // Test 4: PUT - Update existing post
  testUpdatePost(data.baseUrl);
  
  // Test 5: DELETE - Delete post
  testDeletePost(data.baseUrl);
  
  // Test 6: GET - Retrieve user posts
  testGetUserPosts(data.baseUrl);
  
  // Test 7: GET - Retrieve comments for post
  testGetPostComments(data.baseUrl);
  
  // Simulate realistic user behavior
  simulateUserBehavior();
  
  // Track overall test performance
  defaultMonitor.trackRequest(
    { timings: { duration: Date.now() - testStartTime }, status: 200 },
    'complete_rest_api_test',
    testStartTime
  );
}

// Test 1: GET all posts
export function testGetAllPosts(baseUrl) {
  const startTime = Date.now();
  const response = makeRequest('GET', `${baseUrl}/posts`);
  
  const validationChecks = validateResponse(response, 200);
  validationChecks.push(
    check(response, {
      'GET /posts returns array': (r) => {
        try {
          const data = JSON.parse(r.body);
          return Array.isArray(data);
        } catch (e) {
          return false;
        }
      },
      'GET /posts has posts': (r) => {
        try {
          const data = JSON.parse(r.body);
          return data.length > 0;
        } catch (e) {
          return false;
        }
      },
      'GET /posts response time < 500ms': (r) => r.timings.duration < 500
    })
  );

  defaultMonitor.trackRequest(response, 'get_all_posts', startTime);
}

// Test 2: GET specific post
export function testGetSpecificPost(baseUrl) {
  const postId = Math.floor(Math.random() * 100) + 1;
  const startTime = Date.now();
  const response = makeRequest('GET', `${baseUrl}/posts/${postId}`);
  
  const validationChecks = validateResponse(response, 200);
  validationChecks.push(
    check(response, {
      'GET /posts/{id} returns post object': (r) => {
        try {
          const data = JSON.parse(r.body);
          return data.id === postId;
        } catch (e) {
          return false;
        }
      },
      'GET /posts/{id} has required fields': (r) => {
        try {
          const data = JSON.parse(r.body);
          return data.title && data.body && data.userId;
        } catch (e) {
          return false;
        }
      },
      'GET /posts/{id} response time < 300ms': (r) => r.timings.duration < 300
    })
  );

  defaultMonitor.trackRequest(response, 'get_specific_post', startTime);
}

// Test 3: POST create new post
export function testCreatePost(baseUrl) {
  const newPost = generateRandomData();
  const startTime = Date.now();
  const response = makeRequest('POST', `${baseUrl}/posts`, JSON.stringify(newPost));
  
  const validationChecks = validateResponse(response, 201);
  validationChecks.push(
    check(response, {
      'POST /posts creates post': (r) => {
        try {
          const data = JSON.parse(r.body);
          return data.title === newPost.title && data.body === newPost.body;
        } catch (e) {
          return false;
        }
      },
      'POST /posts returns ID': (r) => {
        try {
          const data = JSON.parse(r.body);
          return data.id && data.id > 0;
        } catch (e) {
          return false;
        }
      },
      'POST /posts response time < 600ms': (r) => r.timings.duration < 600
    })
  );

  defaultMonitor.trackRequest(response, 'create_post', startTime);
}

// Test 4: PUT update post
function testUpdatePost(baseUrl) {
  const postId = Math.floor(Math.random() * 100) + 1;
  const updatedPost = generateRandomData();
  const startTime = Date.now();
  const response = makeRequest('PUT', `${baseUrl}/posts/${postId}`, JSON.stringify(updatedPost));
  
  const validationChecks = validateResponse(response, 200);
  validationChecks.push(
    check(response, {
      'PUT /posts/{id} updates post': (r) => {
        try {
          const data = JSON.parse(r.body);
          return data.title === updatedPost.title && data.body === updatedPost.body;
        } catch (e) {
          return false;
        }
      },
      'PUT /posts/{id} response time < 500ms': (r) => r.timings.duration < 500
    })
  );

  defaultMonitor.trackRequest(response, 'update_post', startTime);
}

// Test 5: DELETE post
function testDeletePost(baseUrl) {
  const postId = Math.floor(Math.random() * 100) + 1;
  const startTime = Date.now();
  const response = makeRequest('DELETE', `${baseUrl}/posts/${postId}`);
  
  const validationChecks = validateResponse(response, 200);
  validationChecks.push(
    check(response, {
      'DELETE /posts/{id} succeeds': (r) => r.status === 200,
      'DELETE /posts/{id} response time < 400ms': (r) => r.timings.duration < 400
    })
  );

  defaultMonitor.trackRequest(response, 'delete_post', startTime);
}

// Test 6: GET user posts
function testGetUserPosts(baseUrl) {
  const userId = Math.floor(Math.random() * 10) + 1;
  const startTime = Date.now();
  const response = makeRequest('GET', `${baseUrl}/users/${userId}/posts`);
  
  const validationChecks = validateResponse(response, 200);
  validationChecks.push(
    check(response, {
      'GET /users/{id}/posts returns array': (r) => {
        try {
          const data = JSON.parse(r.body);
          return Array.isArray(data);
        } catch (e) {
          return false;
        }
      },
      'GET /users/{id}/posts response time < 400ms': (r) => r.timings.duration < 400
    })
  );

  defaultMonitor.trackRequest(response, 'get_user_posts', startTime);
}

// Test 7: GET post comments
function testGetPostComments(baseUrl) {
  const postId = Math.floor(Math.random() * 100) + 1;
  const startTime = Date.now();
  const response = makeRequest('GET', `${baseUrl}/posts/${postId}/comments`);
  
  const validationChecks = validateResponse(response, 200);
  validationChecks.push(
    check(response, {
      'GET /posts/{id}/comments returns array': (r) => {
        try {
          const data = JSON.parse(r.body);
          return Array.isArray(data);
        } catch (e) {
          return false;
        }
      },
      'GET /posts/{id}/comments response time < 350ms': (r) => r.timings.duration < 350
    })
  );

  defaultMonitor.trackRequest(response, 'get_post_comments', startTime);
}

export function teardown(data) {
  console.log('REST API Performance Test Completed');
  
  const summary = defaultMonitor.getSummary();
  console.log('Performance Summary:');
  console.log(`Total Requests: ${summary.totalRequests}`);
  console.log(`Average Response Time: ${summary.averageResponseTime}ms`);
  console.log(`Min Response Time: ${summary.minResponseTime}ms`);
  console.log(`Max Response Time: ${summary.maxResponseTime}ms`);
  console.log(`Error Rate: ${summary.errorRate}%`);
  
  // Check thresholds
  const thresholdResults = defaultMonitor.checkThresholds({
    avg_response_time: 500,
    max_response_time: 1000,
    error_rate: 5
  });
  
  console.log('Threshold Results:');
  thresholdResults.forEach(result => {
    const status = result.passed ? 'PASS' : 'FAIL';
    console.log(`${status} ${result.metric}: ${result.actual} (threshold: ${result.threshold})`);
  });
}
