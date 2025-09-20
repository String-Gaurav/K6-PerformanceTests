/**
 * k6 Configuration File
 * Central configuration for all k6 performance tests
 */

import { BASE_CONFIG, SCENARIOS } from './config/base-config.js';

// Default configuration
export const defaultConfig = {
  // Global thresholds
  thresholds: BASE_CONFIG.THRESHOLDS,
  
  // Default scenario
  scenarios: {
    default_scenario: SCENARIOS.LOAD
  },
  
  // Global options
  options: {
    // Output formats
    summaryTrendStats: ['avg', 'min', 'med', 'max', 'p(95)', 'p(99)', 'p(99.9)', 'count'],
    summaryTimeUnit: 'ms',
    
    // Iteration options
    iterations: 100,
    maxRedirects: 10,
    
    // User agent
    userAgent: 'k6-performance-framework/1.0.0',
    
    // Timeout settings
    timeout: '30s',
    setupTimeout: '60s',
    teardownTimeout: '60s',
    
    // Batch settings
    batch: 15,
    batchPerHost: 15,
    
    // DNS settings
    dns: {
      ttl: '60s',
      select: 'random',
      policy: 'preferIPv4'
    },
    
    // No connection reuse by default (can be overridden)
    noConnectionReuse: false,
    
    // No cookies by default
    noCookies: true,
    
    // No VU connection reuse
    noVUConnectionReuse: false,
    
    // Discard response bodies by default for performance
    discardResponseBodies: false,
    
    // HTTP debug (disabled by default)
    httpDebug: false,
    
    // Insecure skip TLS verification (disabled by default)
    insecureSkipTLSVerify: false,
    
    // Local IPs (disabled by default)
    localIPs: false,
    
    // Tags
    tags: {
      environment: __ENV.ENVIRONMENT || 'test',
      test_type: 'performance',
      framework: 'k6-performance-framework'
    }
  }
};

// Environment-specific configurations
export const environmentConfigs = {
  development: {
    thresholds: {
      http_req_duration: ['p(95)<1000'],
      http_req_failed: ['rate<0.1'],
      checks: ['rate>0.9']
    },
    scenarios: {
      dev_test: {
        executor: 'constant-vus',
        vus: 1,
        duration: '30s'
      }
    }
  },
  
  staging: {
    thresholds: {
      http_req_duration: ['p(95)<1500', 'p(99)<2500'],
      http_req_failed: ['rate<0.05'],
      checks: ['rate>0.95']
    },
    scenarios: {
      staging_load: {
        executor: 'ramping-vus',
        startVUs: 1,
        stages: [
          { duration: '2m', target: 5 },
          { duration: '3m', target: 5 },
          { duration: '2m', target: 0 }
        ]
      }
    }
  },
  
  production: {
    thresholds: {
      http_req_duration: ['p(95)<2000', 'p(99)<3000'],
      http_req_failed: ['rate<0.01'],
      checks: ['rate>0.99']
    },
    scenarios: {
      prod_load: {
        executor: 'ramping-vus',
        startVUs: 1,
        stages: [
          { duration: '5m', target: 10 },
          { duration: '10m', target: 10 },
          { duration: '5m', target: 0 }
        ]
      }
    }
  }
};

// Test type configurations
export const testTypeConfigs = {
  smoke: {
    thresholds: {
      http_req_duration: ['p(95)<2000'],
      http_req_failed: ['rate<0.1'],
      checks: ['rate>0.9']
    },
    scenarios: {
      smoke_test: SCENARIOS.SMOKE
    }
  },
  
  load: {
    thresholds: {
      http_req_duration: ['p(95)<1500', 'p(99)<2500'],
      http_req_failed: ['rate<0.05'],
      checks: ['rate>0.95']
    },
    scenarios: {
      load_test: SCENARIOS.LOAD
    }
  },
  
  stress: {
    thresholds: {
      http_req_duration: ['p(95)<3000', 'p(99)<5000'],
      http_req_failed: ['rate<0.2'],
      checks: ['rate>0.7']
    },
    scenarios: {
      stress_test: SCENARIOS.STRESS
    }
  },
  
  spike: {
    thresholds: {
      http_req_duration: ['p(95)<4000', 'p(99)<6000'],
      http_req_failed: ['rate<0.3'],
      checks: ['rate>0.6']
    },
    scenarios: {
      spike_test: SCENARIOS.SPIKE
    }
  }
};

// Helper function to get configuration
export function getConfig(environment = 'development', testType = 'load') {
  const baseConfig = { ...defaultConfig };
  const envConfig = environmentConfigs[environment] || environmentConfigs.development;
  const typeConfig = testTypeConfigs[testType] || testTypeConfigs.load;
  
  return {
    ...baseConfig,
    thresholds: {
      ...baseConfig.thresholds,
      ...envConfig.thresholds,
      ...typeConfig.thresholds
    },
    scenarios: {
      ...baseConfig.scenarios,
      ...envConfig.scenarios,
      ...typeConfig.scenarios
    }
  };
}

// Export default configuration
export default defaultConfig;
