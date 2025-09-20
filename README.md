# K6 Performance Testing Framework

A comprehensive, production-ready performance testing framework built with k6 for testing both API and UI applications. This framework provides a solid foundation for load testing, stress testing, and performance validation across different scenarios.

## What This Framework Includes

This framework covers the essential aspects of performance testing:

- **API Testing**: REST endpoints, GraphQL queries, and authentication flows
- **UI Testing**: Page load performance and user interaction simulations
- **Multiple Test Scenarios**: Smoke tests, load tests, stress tests, and spike tests
- **Real-world Simulation**: Combined workloads that mimic actual user behavior
- **Performance Monitoring**: Built-in metrics tracking and threshold validation
- **Easy Configuration**: Centralized settings for different environments

## Prerequisites

Before you start, make sure you have k6 installed on your system:

### Installing k6

**macOS:**
```bash
brew install k6
```

**Windows:**
```bash
choco install k6
```

**Linux (Ubuntu/Debian):**
```bash
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6
```

**Verify Installation:**
```bash
k6 version
```

## Quick Start

1. **Clone the repository:**
```bash
git clone https://github.com/String-Gaurav/K6-PerformanceTests.git
cd K6-PerformanceTests
```

2. **Run the demo to see it in action:**
```bash
chmod +x demo.sh
./demo.sh
```

3. **Try a quick smoke test:**
```bash
k6 run scenarios/api-smoke-test.js
```

That's it! The demo will run through various test scenarios and show you how everything works.

## Project Structure

Understanding the project layout helps you customize the tests for your needs:

```
K6-PerformanceTests/
├── config/
│   └── base-config.js          # Main configuration file
├── tests/
│   ├── api/                    # API performance tests
│   │   ├── rest-api-test.js    # REST endpoint testing
│   │   ├── auth-test.js        # Authentication testing
│   │   └── graphql-test.js     # GraphQL query testing
│   └── ui/                     # UI performance tests
│       ├── page-load-test.js   # Page loading performance
│       └── user-interaction-test.js # User interaction testing
├── scenarios/                  # Test scenarios
│   ├── api-smoke-test.js       # Quick API validation
│   ├── api-load-test.js        # Moderate API load testing
│   ├── api-stress-test.js      # High-load API testing
│   ├── ui-smoke-test.js        # Quick UI validation
│   ├── ui-load-test.js         # Moderate UI load testing
│   └── combined-test.js        # Comprehensive testing
├── utils/                      # Utility functions
│   ├── helpers.js              # Common helper functions
│   └── performance-monitor.js  # Performance monitoring
├── demo.sh                     # Demo script
├── package.json                # Project dependencies
└── k6.config.js               # Global k6 configuration
```

## Configuration

The main configuration is in `config/base-config.js`. Here's what you need to update for your application:

### Basic Settings

```javascript
export const BASE_CONFIG = {
  // Your API base URL
  BASE_URL: 'https://your-api.com',
  
  // Your UI application URL
  UI_BASE_URL: 'https://your-app.com',
  
  // Performance thresholds
  THRESHOLDS: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'],
    http_req_failed: ['rate<0.1'],
    http_reqs: ['rate>10']
  }
};
```

### Test Data

Update the test data in the same file:

```javascript
export const TEST_DATA = {
  // Sample users for authentication tests
  USERS: [
    { username: 'testuser1', password: 'password123' },
    { username: 'testuser2', password: 'password456' }
  ],
  
  // Sample posts for API testing
  POSTS: [
    { title: 'Test Post 1', body: 'This is a test post', userId: 1 },
    { title: 'Test Post 2', body: 'Another test post', userId: 2 }
  ]
};
```

## Running Tests

### Individual Test Types

**API Smoke Test (30 seconds):**
```bash
k6 run scenarios/api-smoke-test.js
```

**UI Smoke Test (30 seconds):**
```bash
k6 run scenarios/ui-smoke-test.js
```

**API Load Test (2 minutes):**
```bash
k6 run scenarios/api-load-test.js
```

**UI Load Test (2 minutes):**
```bash
k6 run scenarios/ui-load-test.js
```

**Stress Test (7 minutes):**
```bash
k6 run scenarios/api-stress-test.js
```

**Comprehensive Test (10+ minutes):**
```bash
k6 run scenarios/combined-test.js
```

### Direct Test Execution

You can also run individual test files directly:

```bash
# REST API testing
k6 run tests/api/rest-api-test.js

# Authentication testing
k6 run tests/api/auth-test.js

# GraphQL testing
k6 run tests/api/graphql-test.js

# UI page load testing
k6 run tests/ui/page-load-test.js

# UI user interaction testing
k6 run tests/ui/user-interaction-test.js
```

## Understanding Test Results

When you run a test, k6 provides detailed metrics:

### Key Metrics to Watch

- **http_req_duration**: Response time percentiles (p95, p99)
- **http_req_failed**: Percentage of failed requests
- **http_reqs**: Requests per second
- **checks**: Success rate of test validations
- **iterations**: Number of test iterations completed

### Sample Output Interpretation

```
✓ http_req_duration: p(95)=245ms (threshold: 500ms)  # Good performance
✓ http_req_failed: 2.5% (threshold: 10%)            # Low error rate
✓ checks: 95% (threshold: 90%)                       # High success rate
```

## Customizing Tests

### Adding New API Endpoints

Edit `tests/api/rest-api-test.js` and add your endpoint:

```javascript
export function testCustomEndpoint(baseUrl) {
  const startTime = Date.now();
  const response = makeRequest('GET', `${baseUrl}/your-endpoint`);
  
  const validationChecks = validateResponse(response, 200);
  validationChecks.push(
    check(response, {
      'Custom endpoint responds': (r) => r.status === 200,
      'Custom endpoint is fast': (r) => r.timings.duration < 300
    })
  );
  
  defaultMonitor.trackRequest(response, 'custom_endpoint', startTime);
}
```

### Modifying Test Scenarios

Edit the scenarios in `scenarios/` directory. For example, to change load test duration:

```javascript
scenarios: {
  api_load_test: {
    executor: 'ramping-vus',
    startVUs: 1,
    stages: [
      { duration: '1m', target: 10 },    // Ramp up over 1 minute
      { duration: '3m', target: 10 },    // Stay at 10 users for 3 minutes
      { duration: '1m', target: 0 }      // Ramp down over 1 minute
    ]
  }
}
```

## CI/CD Integration

### GitHub Actions Example

Create `.github/workflows/performance-test.yml`:

```yaml
name: Performance Tests
on: [push, pull_request]

jobs:
  performance-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Install k6
        run: |
          sudo gpg -k
          sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
          echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
          sudo apt-get update
          sudo apt-get install k6
      - name: Run API Smoke Test
        run: k6 run scenarios/api-smoke-test.js
      - name: Run UI Smoke Test
        run: k6 run scenarios/ui-smoke-test.js
```

### Jenkins Pipeline Example

```groovy
pipeline {
    agent any
    stages {
        stage('Performance Test') {
            steps {
                sh 'k6 run scenarios/api-smoke-test.js'
                sh 'k6 run scenarios/ui-smoke-test.js'
            }
        }
    }
    post {
        always {
            publishHTML([
                allowMissing: false,
                alwaysLinkToLastBuild: true,
                keepAll: true,
                reportDir: 'results',
                reportFiles: 'index.html',
                reportName: 'Performance Test Report'
            ])
        }
    }
}
```

## Best Practices

### Test Planning

1. **Start Small**: Begin with smoke tests to validate basic functionality
2. **Gradual Increase**: Move from load tests to stress tests progressively
3. **Realistic Scenarios**: Use test data that mirrors production usage
4. **Monitor Resources**: Watch CPU, memory, and network usage during tests

### Performance Thresholds

Set realistic thresholds based on your requirements:

```javascript
THRESHOLDS: {
  // 95% of requests should complete within 500ms
  http_req_duration: ['p(95)<500'],
  
  // 99% of requests should complete within 1 second
  http_req_duration: ['p(99)<1000'],
  
  // Less than 5% of requests should fail
  http_req_failed: ['rate<0.05'],
  
  // At least 20 requests per second
  http_reqs: ['rate>20']
}
```

### Test Data Management

- Use realistic test data that matches your production environment
- Rotate test users to avoid conflicts
- Clean up test data after test runs
- Use environment variables for sensitive information

## Troubleshooting

### Common Issues

**Test Fails with Connection Errors:**
- Check if your application is running
- Verify the URLs in `config/base-config.js`
- Ensure network connectivity

**High Failure Rates:**
- Review error messages in test output
- Check application logs
- Verify test data and endpoints

**Tests Run Too Slowly:**
- Reduce the number of virtual users
- Check network latency
- Optimize your application

### Getting Help

1. Check the k6 documentation: https://k6.io/docs/
2. Review test logs for specific error messages
3. Validate your configuration settings
4. Test individual endpoints manually first

## Contributing

To contribute to this framework:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is open source and available under the MIT License.

## Support

For questions or issues:
- Create an issue in the GitHub repository
- Check the k6 community forum
- Review the k6 documentation

---

Happy testing! This framework should give you a solid foundation for performance testing your applications. Start with the smoke tests and gradually work your way up to more comprehensive testing scenarios.
