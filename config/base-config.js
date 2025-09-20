import { SharedArray } from 'k6/data';

// Base configuration for all tests
export const BASE_CONFIG = {
  // Test data
  BASE_URL: __ENV.BASE_URL || 'https://jsonplaceholder.typicode.com',
  API_BASE_URL: __ENV.API_BASE_URL || 'https://jsonplaceholder.typicode.com',
  UI_BASE_URL: __ENV.UI_BASE_URL || 'https://httpbin.org',
  
  // Authentication
  API_KEY: __ENV.API_KEY || 'your-api-key-here',
  USERNAME: __ENV.USERNAME || 'testuser',
  PASSWORD: __ENV.PASSWORD || 'testpass',
  
  // Performance thresholds
  THRESHOLDS: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'],
    http_req_failed: ['rate<0.1'],
    http_reqs: ['rate>10'],
    checks: ['rate>0.9']
  },
  
  // Request options
  DEFAULT_REQUEST_OPTIONS: {
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'User-Agent': 'k6-performance-framework/1.0.0'
    },
    timeout: '30s'
  }
};

// Test data sets
export const TEST_DATA = new SharedArray('test-data', function () {
  return [
    { id: 1, title: 'Test Post 1', body: 'This is test content 1', userId: 1 },
    { id: 2, title: 'Test Post 2', body: 'This is test content 2', userId: 2 },
    { id: 3, title: 'Test Post 3', body: 'This is test content 3', userId: 3 },
    { id: 4, title: 'Test Post 4', body: 'This is test content 4', userId: 4 },
    { id: 5, title: 'Test Post 5', body: 'This is test content 5', userId: 5 }
  ];
});

// User credentials for authentication tests
export const USER_CREDENTIALS = new SharedArray('user-credentials', function () {
  return [
    { username: 'user1', password: 'password1', email: 'user1@test.com' },
    { username: 'user2', password: 'password2', email: 'user2@test.com' },
    { username: 'user3', password: 'password3', email: 'user3@test.com' }
  ];
});

// GraphQL queries
export const GRAPHQL_QUERIES = {
  GET_POSTS: `
    query GetPosts($limit: Int) {
      posts(limit: $limit) {
        id
        title
        body
        user {
          id
          name
          email
        }
      }
    }
  `,
  GET_USER: `
    query GetUser($id: ID!) {
      user(id: $id) {
        id
        name
        email
        posts {
          id
          title
        }
      }
    }
  `,
  CREATE_POST: `
    mutation CreatePost($input: PostInput!) {
      createPost(input: $input) {
        id
        title
        body
        userId
      }
    }
  `
};

// Performance test scenarios
export const SCENARIOS = {
  SMOKE: {
    executor: 'constant-vus',
    vus: 1,
    duration: '30s',
    tags: { test_type: 'smoke' }
  },
  LOAD: {
    executor: 'ramping-vus',
    startVUs: 1,
    stages: [
      { duration: '30s', target: 5 },
      { duration: '1m', target: 5 },
      { duration: '30s', target: 0 }
    ],
    tags: { test_type: 'load' }
  },
  STRESS: {
    executor: 'ramping-vus',
    startVUs: 1,
    stages: [
      { duration: '1m', target: 5 },
      { duration: '2m', target: 20 },
      { duration: '1m', target: 50 },
      { duration: '2m', target: 50 },
      { duration: '1m', target: 0 }
    ],
    tags: { test_type: 'stress' }
  },
  SPIKE: {
    executor: 'ramping-vus',
    startVUs: 1,
    stages: [
      { duration: '30s', target: 5 },
      { duration: '30s', target: 50 },
      { duration: '30s', target: 5 },
      { duration: '30s', target: 0 }
    ],
    tags: { test_type: 'spike' }
  }
};
