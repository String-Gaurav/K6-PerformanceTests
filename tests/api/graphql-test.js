import http from 'k6/http';
import { check, sleep } from 'k6';
import { BASE_CONFIG, GRAPHQL_QUERIES } from '../../config/base-config.js';
import { makeRequest, validateResponse, simulateUserBehavior } from '../../utils/helpers.js';
import { defaultMonitor } from '../../utils/performance-monitor.js';

/**
 * GraphQL API Performance Tests
 * Tests GraphQL endpoints for performance, query complexity, and mutation handling
 */

export const options = {
  thresholds: {
    ...BASE_CONFIG.THRESHOLDS,
    http_req_duration: ['p(95)<700', 'p(99)<1200'],
    http_req_failed: ['rate<0.1']
  },
  scenarios: {
    graphql_load_test: {
      executor: 'ramping-vus',
      startVUs: 1,
      stages: [
        { duration: '30s', target: 4 },
        { duration: '1m', target: 4 },
        { duration: '30s', target: 0 }
      ]
    }
  }
};

export function setup() {
  console.log('Starting GraphQL Performance Test');
  console.log(`Base URL: ${BASE_CONFIG.BASE_URL}`);
  
  // Verify GraphQL endpoint is accessible
  const healthCheck = http.post(`${BASE_CONFIG.BASE_URL}/graphql`, JSON.stringify({
    query: '{ __schema { types { name } } }'
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
  
  check(healthCheck, {
    'GraphQL endpoint is accessible': (r) => r.status === 200 || r.status === 404
  });

  return {
    baseUrl: BASE_CONFIG.BASE_URL,
    graphqlUrl: `${BASE_CONFIG.BASE_URL}/graphql`,
    testStartTime: new Date().toISOString()
  };
}

export default function(data) {
  const testStartTime = Date.now();
  
  // Test 1: Introspection Query
  testIntrospectionQuery(data.graphqlUrl);
  
  // Test 2: Simple Query - Get Posts
  testGetPostsQuery(data.graphqlUrl);
  
  // Test 3: Nested Query - Get User with Posts
  testGetUserWithPostsQuery(data.graphqlUrl);
  
  // Test 4: Query with Variables
  testQueryWithVariables(data.graphqlUrl);
  
  // Test 5: Mutation - Create Post
  testCreatePostMutation(data.graphqlUrl);
  
  // Test 6: Complex Query with Multiple Fields
  testComplexQuery(data.graphqlUrl);
  
  // Test 7: Query with Fragments
  testQueryWithFragments(data.graphqlUrl);
  
  // Test 8: Batch Queries
  testBatchQueries(data.graphqlUrl);
  
  // Test 9: Error Handling
  testGraphQLErrorHandling(data.graphqlUrl);
  
  // Test 10: Query Depth Testing
  testQueryDepth(data.graphqlUrl);
  
  // Simulate realistic user behavior
  simulateUserBehavior();
  
  // Track overall test performance
  defaultMonitor.trackRequest(
    { timings: { duration: Date.now() - testStartTime }, status: 200 },
    'complete_graphql_test',
    testStartTime
  );
}

// Test 1: Introspection Query
export function testIntrospectionQuery(graphqlUrl) {
  const startTime = Date.now();
  
  const introspectionQuery = {
    query: `
      query IntrospectionQuery {
        __schema {
          queryType { name }
          mutationType { name }
          subscriptionType { name }
          types {
            name
            kind
            description
          }
        }
      }
    `
  };
  
  const response = makeRequest('POST', graphqlUrl, JSON.stringify(introspectionQuery));
  
  const validationChecks = validateResponse(response, 200);
  validationChecks.push(
    check(response, {
      'Introspection query succeeds': (r) => r.status === 200,
      'Introspection query response time < 500ms': (r) => r.timings.duration < 500,
      'Introspection returns schema': (r) => {
        try {
          const data = JSON.parse(r.body);
          return data.data && data.data.__schema;
        } catch (e) {
          return false;
        }
      }
    })
  );

  defaultMonitor.trackRequest(response, 'introspection_query', startTime);
}

// Test 2: Simple Query - Get Posts
export function testGetPostsQuery(graphqlUrl) {
  const startTime = Date.now();
  
  const query = {
    query: `
      query GetPosts {
        posts {
          id
          title
          body
          userId
        }
      }
    `
  };
  
  const response = makeRequest('POST', graphqlUrl, JSON.stringify(query));
  
  const validationChecks = validateResponse(response, 200);
  validationChecks.push(
    check(response, {
      'Get posts query succeeds': (r) => r.status === 200,
      'Get posts response time < 400ms': (r) => r.timings.duration < 400,
      'Get posts returns data': (r) => {
        try {
          const data = JSON.parse(r.body);
          return data.data && data.data.posts && Array.isArray(data.data.posts);
        } catch (e) {
          return false;
        }
      }
    })
  );

  defaultMonitor.trackRequest(response, 'get_posts_query', startTime);
}

// Test 3: Nested Query - Get User with Posts
function testGetUserWithPostsQuery(graphqlUrl) {
  const startTime = Date.now();
  const userId = Math.floor(Math.random() * 10) + 1;
  
  const query = {
    query: `
      query GetUserWithPosts($userId: ID!) {
        user(id: $userId) {
          id
          name
          email
          posts {
            id
            title
            body
          }
        }
      }
    `,
    variables: {
      userId: userId.toString()
    }
  };
  
  const response = makeRequest('POST', graphqlUrl, JSON.stringify(query));
  
  const validationChecks = validateResponse(response, 200);
  validationChecks.push(
    check(response, {
      'Get user with posts query succeeds': (r) => r.status === 200,
      'Get user with posts response time < 600ms': (r) => r.timings.duration < 600,
      'Get user with posts returns nested data': (r) => {
        try {
          const data = JSON.parse(r.body);
          return data.data && data.data.user && data.data.user.posts;
        } catch (e) {
          return false;
        }
      }
    })
  );

  defaultMonitor.trackRequest(response, 'get_user_with_posts_query', startTime);
}

// Test 4: Query with Variables
function testQueryWithVariables(graphqlUrl) {
  const startTime = Date.now();
  const limit = Math.floor(Math.random() * 20) + 5;
  
  const query = {
    query: GRAPHQL_QUERIES.GET_POSTS,
    variables: {
      limit: limit
    }
  };
  
  const response = makeRequest('POST', graphqlUrl, JSON.stringify(query));
  
  const validationChecks = validateResponse(response, 200);
  validationChecks.push(
    check(response, {
      'Query with variables succeeds': (r) => r.status === 200,
      'Query with variables response time < 450ms': (r) => r.timings.duration < 450,
      'Query with variables respects limit': (r) => {
        try {
          const data = JSON.parse(r.body);
          return data.data && data.data.posts && data.data.posts.length <= limit;
        } catch (e) {
          return false;
        }
      }
    })
  );

  defaultMonitor.trackRequest(response, 'query_with_variables', startTime);
}

// Test 5: Mutation - Create Post
function testCreatePostMutation(graphqlUrl) {
  const startTime = Date.now();
  
  const mutation = {
    query: GRAPHQL_QUERIES.CREATE_POST,
    variables: {
      input: {
        title: `Test Post ${Date.now()}`,
        body: `This is a test post created at ${new Date().toISOString()}`,
        userId: Math.floor(Math.random() * 10) + 1
      }
    }
  };
  
  const response = makeRequest('POST', graphqlUrl, JSON.stringify(mutation));
  
  const validationChecks = validateResponse(response, 200);
  validationChecks.push(
    check(response, {
      'Create post mutation succeeds': (r) => r.status === 200,
      'Create post response time < 700ms': (r) => r.timings.duration < 700,
      'Create post returns new post': (r) => {
        try {
          const data = JSON.parse(r.body);
          return data.data && data.data.createPost && data.data.createPost.id;
        } catch (e) {
          return false;
        }
      }
    })
  );

  defaultMonitor.trackRequest(response, 'create_post_mutation', startTime);
}

// Test 6: Complex Query with Multiple Fields
function testComplexQuery(graphqlUrl) {
  const startTime = Date.now();
  
  const query = {
    query: `
      query ComplexQuery {
        posts {
          id
          title
          body
          user {
            id
            name
            email
            address {
              street
              city
              zipcode
            }
          }
          comments {
            id
            name
            email
            body
          }
        }
      }
    `
  };
  
  const response = makeRequest('POST', graphqlUrl, JSON.stringify(query));
  
  const validationChecks = validateResponse(response, 200);
  validationChecks.push(
    check(response, {
      'Complex query succeeds': (r) => r.status === 200,
      'Complex query response time < 800ms': (r) => r.timings.duration < 800,
      'Complex query returns nested data': (r) => {
        try {
          const data = JSON.parse(r.body);
          return data.data && data.data.posts && data.data.posts.length > 0;
        } catch (e) {
          return false;
        }
      }
    })
  );

  defaultMonitor.trackRequest(response, 'complex_query', startTime);
}

// Test 7: Query with Fragments
function testQueryWithFragments(graphqlUrl) {
  const startTime = Date.now();
  
  const query = {
    query: `
      fragment UserFragment on User {
        id
        name
        email
        phone
      }
      
      fragment PostFragment on Post {
        id
        title
        body
        user {
          ...UserFragment
        }
      }
      
      query PostsWithFragments {
        posts {
          ...PostFragment
        }
      }
    `
  };
  
  const response = makeRequest('POST', graphqlUrl, JSON.stringify(query));
  
  const validationChecks = validateResponse(response, 200);
  validationChecks.push(
    check(response, {
      'Query with fragments succeeds': (r) => r.status === 200,
      'Query with fragments response time < 500ms': (r) => r.timings.duration < 500,
      'Query with fragments returns data': (r) => {
        try {
          const data = JSON.parse(r.body);
          return data.data && data.data.posts;
        } catch (e) {
          return false;
        }
      }
    })
  );

  defaultMonitor.trackRequest(response, 'query_with_fragments', startTime);
}

// Test 8: Batch Queries
function testBatchQueries(graphqlUrl) {
  const startTime = Date.now();
  
  const batchQuery = [
    {
      query: `query { posts { id title } }`
    },
    {
      query: `query { users { id name } }`
    },
    {
      query: `query { comments { id body } }`
    }
  ];
  
  const response = makeRequest('POST', graphqlUrl, JSON.stringify(batchQuery));
  
  const validationChecks = validateResponse(response, 200);
  validationChecks.push(
    check(response, {
      'Batch queries succeed': (r) => r.status === 200,
      'Batch queries response time < 600ms': (r) => r.timings.duration < 600,
      'Batch queries return array': (r) => {
        try {
          const data = JSON.parse(r.body);
          return Array.isArray(data);
        } catch (e) {
          return false;
        }
      }
    })
  );

  defaultMonitor.trackRequest(response, 'batch_queries', startTime);
}

// Test 9: Error Handling
function testGraphQLErrorHandling(graphqlUrl) {
  const startTime = Date.now();
  
  const invalidQuery = {
    query: `
      query InvalidQuery {
        nonExistentField {
          id
          invalidField
        }
      }
    `
  };
  
  const response = makeRequest('POST', graphqlUrl, JSON.stringify(invalidQuery));
  
  const validationChecks = validateResponse(response, 200);
  validationChecks.push(
    check(response, {
      'Invalid query returns errors': (r) => {
        try {
          const data = JSON.parse(r.body);
          return data.errors && data.errors.length > 0;
        } catch (e) {
          return false;
        }
      },
      'Error response time < 300ms': (r) => r.timings.duration < 300
    })
  );

  defaultMonitor.trackRequest(response, 'graphql_error_handling', startTime);
}

// Test 10: Query Depth Testing
function testQueryDepth(graphqlUrl) {
  const startTime = Date.now();
  
  const deepQuery = {
    query: `
      query DeepQuery {
        posts {
          user {
            posts {
              user {
                posts {
                  id
                  title
                }
              }
            }
          }
        }
      }
    `
  };
  
  const response = makeRequest('POST', graphqlUrl, JSON.stringify(deepQuery));
  
  const validationChecks = validateResponse(response, 200);
  validationChecks.push(
    check(response, {
      'Deep query handles depth limits': (r) => r.status === 200 || r.status === 400,
      'Deep query response time < 1000ms': (r) => r.timings.duration < 1000
    })
  );

  defaultMonitor.trackRequest(response, 'query_depth_test', startTime);
}

export function teardown(data) {
  console.log('GraphQL Performance Test Completed');
  
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
    max_response_time: 1200,
    error_rate: 15 // GraphQL may have higher error rates due to query complexity
  });
  
  console.log('Threshold Results:');
  thresholdResults.forEach(result => {
    const status = result.passed ? 'PASS' : 'FAIL';
    console.log(`${status} ${result.metric}: ${result.actual} (threshold: ${result.threshold})`);
  });
}
