# K6 Performance Testing Framework

A complete performance testing framework that I built to make load testing easier and more effective. Whether you're testing APIs, web applications, or need intelligent insights from your tests, this framework has you covered.

## What This Framework Does

I created this framework because I was tired of setting up performance tests from scratch every time. It includes:

- **API Testing**: REST endpoints, GraphQL, authentication flows
- **UI Testing**: Page load times, user interactions, static assets
- **Multiple Test Types**: Smoke tests (quick checks), load tests (normal usage), stress tests (breaking points), spike tests (sudden traffic)
- **Real-world Scenarios**: Combined tests that mimic actual user behavior
- **AI-Powered Insights**: Optional intelligent analysis using Google's Gemini AI
- **Easy Configuration**: Everything centralized and ready to customize

## Getting Started

### Step 1: Install k6

First, you need k6 installed on your machine. Here's how to do it:

**On macOS:**
```bash
brew install k6
```

**On Windows:**
```bash
choco install k6
```

**On Linux (Ubuntu/Debian):**
```bash
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6
```

**Verify it worked:**
```bash
k6 version
```

You should see something like "k6 v0.47.0" or similar.

### Step 2: Set Up Your Project

1. **Clone this repository:**
   ```bash
   git clone https://github.com/String-Gaurav/K6-PerformanceTests.git
   cd K6-PerformanceTests
   ```

2. **Check the structure:**
   ```
   ├── config/
   │   └── base-config.js          # Main settings file
   ├── tests/
   │   ├── api/                    # API test files
   │   └── ui/                     # UI test files
   ├── scenarios/                  # Test scenarios (smoke, load, stress)
   ├── utils/                      # Helper functions
   ├── examples/                   # Example scripts
   ├── ai/                         # AI features (optional)
   └── demo.sh                     # Quick demo script
   ```

### Step 3: Configure for Your Application

The main configuration is in `config/base-config.js`. You'll need to update a few things:

1. **Change the base URL:**
   ```javascript
   export const BASE_CONFIG = {
     BASE_URL: 'https://your-api.com',  // Change this to your API
     API_BASE_URL: 'https://your-api.com/api',  // Your API endpoint
     // ... rest of the config
   };
   ```

2. **Adjust thresholds for your needs:**
   ```javascript
   THRESHOLDS: {
     http_req_duration: ['p(95)<500'],  // 95% of requests under 500ms
     http_req_failed: ['rate<0.1'],     // Less than 10% failures
     checks: ['rate>0.9']               // 90% of checks should pass
   }
   ```

3. **Update test data:**
   ```javascript
   TEST_DATA: {
     validUser: { email: 'test@yourdomain.com', password: 'yourpassword' },
     // ... other test data
   }
   ```

## Running Your First Tests

### Quick Demo

I included a demo script to get you started quickly:

```bash
./demo.sh
```

This runs a few different test types so you can see how everything works.

### Individual Test Types

**Smoke Test (Quick validation):**
```bash
k6 run scenarios/api-smoke-test.js
```

**Load Test (Normal usage simulation):**
```bash
k6 run scenarios/api-load-test.js
```

**Stress Test (Find breaking points):**
```bash
k6 run scenarios/api-stress-test.js
```

**UI Performance Test:**
```bash
k6 run scenarios/ui-load-test.js
```

## Understanding the Results

When you run a test, k6 shows you detailed metrics:

### Key Metrics to Watch

- **http_req_duration**: How long requests take
  - `avg`: Average response time
  - `p(95)`: 95% of requests are faster than this
  - `p(99)`: 99% of requests are faster than this

- **http_req_failed**: Percentage of failed requests
- **http_reqs**: Total number of requests made
- **checks**: How many of your assertions passed

### Example Good Results
```
✓ http_req_duration: p(95)=245ms (threshold: 500ms)    # Fast responses
✓ http_req_failed: 0.5% (threshold: 10%)               # Low error rate
✓ checks: 98.5% (threshold: 90%)                       # Most checks passed
```

### Example Concerning Results
```
✗ http_req_duration: p(95)=1200ms (threshold: 500ms)  # Slow responses
✓ http_req_failed: 2.5% (threshold: 10%)               # Acceptable errors
✗ checks: 85% (threshold: 90%)                         # Some checks failing
```

## Creating Your Own Tests

### Basic API Test

Here's a simple test you can create:

```javascript
import http from 'k6/http';
import { check } from 'k6';

export const options = {
  vus: 10,        // 10 virtual users
  duration: '30s' // Run for 30 seconds
};

export default function() {
  // Make a GET request
  const response = http.get('https://your-api.com/users');
  
  // Check if it worked
  check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
    'response has users': (r) => r.json().users.length > 0
  });
}
```

### POST Request Test

```javascript
import http from 'k6/http';
import { check } from 'k6';

export const options = {
  vus: 5,
  duration: '1m'
};

export default function() {
  const payload = JSON.stringify({
    name: 'Test User',
    email: 'test@example.com'
  });

  const response = http.post('https://your-api.com/users', payload, {
    headers: { 'Content-Type': 'application/json' }
  });

  check(response, {
    'user created successfully': (r) => r.status === 201,
    'response time < 1s': (r) => r.timings.duration < 1000
  });
}
```

## AI-Enhanced Testing (Optional)

I added AI capabilities to help you get smarter insights from your tests. It's completely optional but really helpful.

### Setting Up AI Features

1. **Get a Gemini API Key:**
   - Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Create a new API key (it's free)

2. **Set up environment variables:**
   ```bash
   export GEMINI_API_KEY="your_api_key_here"
   export AI_INSIGHTS="true"
   ```

3. **Run an AI-enhanced test:**
   ```bash
   k6 run examples/ai-performance-insights.js
   ```

### What AI Analysis Gives You

Instead of just numbers, you get actionable insights:

```
AI Performance Analysis:
Summary: Response times are good but error rate is concerning
Action Items:
  1. Investigate the 5% error rate on POST endpoints
  2. Consider implementing retry logic for failed requests
  3. Monitor database connection pool during peak load
```

The AI looks at your test results and tells you:
- What's working well
- What needs attention
- Specific steps to improve performance

## Common Issues and Solutions

### "Connection Refused" Errors

This usually means your API isn't running or the URL is wrong.

**Check:**
1. Is your API server running?
2. Is the URL in `base-config.js` correct?
3. Can you access the URL in your browser?

### High Error Rates

If you're seeing lots of failed requests:

**Possible causes:**
1. **Rate limiting**: Your API might be blocking too many requests
2. **Authentication issues**: Check if your API requires authentication
3. **Server overload**: The server might not handle the load

**Solutions:**
1. Reduce the number of virtual users (`vus`)
2. Add delays between requests (`sleep(1)`)
3. Check your API logs for specific errors

### Slow Response Times

If requests are taking too long:

**Check:**
1. Is your API optimized?
2. Are you testing against the right environment?
3. Is your network connection stable?

**Solutions:**
1. Test against a staging environment first
2. Use smaller load initially
3. Check if your API has caching enabled

## Customizing for Your Needs

### Different Environments

I set up the framework to easily switch between environments:

```javascript
// In base-config.js
const environment = __ENV.ENV || 'staging';

const configs = {
  staging: {
    BASE_URL: 'https://staging.yourapp.com'
  },
  production: {
    BASE_URL: 'https://yourapp.com'
  }
};

export const BASE_CONFIG = configs[environment];
```

Then run tests like:
```bash
ENV=staging k6 run scenarios/api-load-test.js
ENV=production k6 run scenarios/api-smoke-test.js
```

### Custom Test Scenarios

You can create your own scenarios by combining different test functions:

```javascript
import { testGetUsers, testCreateUser } from '../tests/api/user-tests.js';

export const options = {
  scenarios: {
    read_heavy: {
      executor: 'constant-vus',
      vus: 20,
      duration: '2m',
      exec: 'readScenario'
    },
    write_heavy: {
      executor: 'constant-vus',
      vus: 5,
      duration: '2m',
      exec: 'writeScenario'
    }
  }
};

export function readScenario() {
  testGetUsers();
  testGetUserProfile();
}

export function writeScenario() {
  testCreateUser();
  testUpdateUser();
}
```

## Best Practices I've Learned

### Start Small
Don't jump straight to 1000 virtual users. Start with:
1. Smoke test (1 user, 30 seconds)
2. Light load (5 users, 2 minutes)
3. Medium load (20 users, 5 minutes)
4. Heavy load (50+ users, 10+ minutes)

### Test Regularly
- Run smoke tests after every deployment
- Run load tests weekly
- Run stress tests before major releases

### Monitor Key Metrics
Focus on these metrics:
- **Response time percentiles** (p95, p99)
- **Error rates** (should be under 5%)
- **Throughput** (requests per second)

### Use Realistic Data
Make sure your test data looks like real user data. The AI features help generate realistic test data automatically.

## Contributing

If you find issues or want to add features:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

<<<<<<< HEAD
=======
I'm always looking to improve this framework, so contributions are welcome!

## Troubleshooting

### k6 Command Not Found
Make sure k6 is installed and in your PATH:
```bash
which k6
# Should show something like /usr/local/bin/k6
```

### Permission Denied on demo.sh
Make the script executable:
```bash
chmod +x demo.sh
```

### Module Import Errors
Make sure you're running tests from the project root directory:
```bash
cd /path/to/K6-PerformanceTests
k6 run scenarios/api-smoke-test.js
```

## Getting Help

If you run into issues:

1. **Check the k6 documentation**: [k6.io/docs](https://k6.io/docs)
2. **Look at the examples**: The `examples/` folder has working samples
3. **Create an issue**: If you find a bug, let me know
4. **Join the community**: The k6 community is very helpful

## License

This project is open source and available under the MIT License. Feel free to use it, modify it, and share it.

>>>>>>> f3b7c02 (Final production-ready k6 performance framework with practical AI integration)
---

That's it! This framework should give you a solid foundation for performance testing. Start with the smoke tests to make sure everything works, then gradually work your way up to more comprehensive testing scenarios.

The AI features are optional but really helpful once you get the basics working. They'll give you insights you might miss when just looking at raw numbers.

Happy testing!