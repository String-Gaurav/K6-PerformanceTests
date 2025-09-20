import { check, sleep } from 'k6';
import http from 'k6/http';
import { BASE_CONFIG } from '../config/base-config.js';

/**
 * Performance monitoring utilities for k6 tests
 */

// Custom metrics tracking
export class PerformanceMonitor {
  constructor() {
    this.metrics = {
      requests: [],
      errors: [],
      responseTimes: [],
      throughput: []
    };
  }

  // Track request performance
  trackRequest(response, testName, startTime) {
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    const requestData = {
      testName: testName,
      status: response.status,
      responseTime: response.timings.duration,
      totalTime: duration,
      timestamp: new Date().toISOString(),
      url: response.url,
      method: response.request?.method || 'GET'
    };

    this.metrics.requests.push(requestData);
    this.metrics.responseTimes.push(response.timings.duration);

    // Track errors
    if (response.status >= 400) {
      this.metrics.errors.push({
        ...requestData,
        error: response.error || 'HTTP Error',
        body: response.body.substring(0, 500) // Limit error body size
      });
    }

    return requestData;
  }

  // Get performance summary
  getSummary() {
    const requests = this.metrics.requests;
    const responseTimes = this.metrics.responseTimes;
    
    if (requests.length === 0) {
      return {
        totalRequests: 0,
        averageResponseTime: 0,
        minResponseTime: 0,
        maxResponseTime: 0,
        errorRate: 0,
        throughput: 0
      };
    }

    const totalRequests = requests.length;
    const errorCount = this.metrics.errors.length;
    const averageResponseTime = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
    const minResponseTime = Math.min(...responseTimes);
    const maxResponseTime = Math.max(...responseTimes);
    const errorRate = (errorCount / totalRequests) * 100;

    return {
      totalRequests,
      averageResponseTime: Math.round(averageResponseTime * 100) / 100,
      minResponseTime,
      maxResponseTime,
      errorRate: Math.round(errorRate * 100) / 100,
      throughput: totalRequests // This would be calculated per second in real scenarios
    };
  }

  // Check performance thresholds
  checkThresholds(thresholds) {
    const summary = this.getSummary();
    const results = [];

    for (const [metric, threshold] of Object.entries(thresholds)) {
      let actualValue;
      let passed = false;

      switch (metric) {
        case 'avg_response_time':
          actualValue = summary.averageResponseTime;
          passed = actualValue <= threshold;
          break;
        case 'max_response_time':
          actualValue = summary.maxResponseTime;
          passed = actualValue <= threshold;
          break;
        case 'error_rate':
          actualValue = summary.errorRate;
          passed = actualValue <= threshold;
          break;
        case 'min_throughput':
          actualValue = summary.throughput;
          passed = actualValue >= threshold;
          break;
      }

      results.push({
        metric,
        threshold,
        actual: actualValue,
        passed
      });
    }

    return results;
  }
}

// Memory usage monitoring
export function trackMemoryUsage() {
  const memInfo = {
    timestamp: new Date().toISOString(),
    // Note: k6 doesn't expose memory usage directly, 
    // this would be implemented with external monitoring tools
    heapUsed: 'N/A',
    heapTotal: 'N/A'
  };
  
  return memInfo;
}

// CPU usage simulation (k6 doesn't expose CPU metrics directly)
export function simulateCpuIntensiveTask(duration = 1000) {
  const startTime = Date.now();
  let counter = 0;
  
  while (Date.now() - startTime < duration) {
    counter += Math.random();
    if (counter > 1000000) counter = 0; // Prevent overflow
  }
  
  return {
    duration: Date.now() - startTime,
    iterations: counter,
    timestamp: new Date().toISOString()
  };
}

// Network latency simulation
export function simulateNetworkLatency(minLatency = 100, maxLatency = 500) {
  const latency = Math.random() * (maxLatency - minLatency) + minLatency;
  sleep(latency / 1000);
  return latency;
}

// Database connection pool monitoring
export class ConnectionPoolMonitor {
  constructor(maxConnections = 10) {
    this.maxConnections = maxConnections;
    this.activeConnections = 0;
    this.connectionHistory = [];
  }

  acquireConnection() {
    if (this.activeConnections >= this.maxConnections) {
      throw new Error('Connection pool exhausted');
    }
    
    this.activeConnections++;
    const connection = {
      id: Date.now() + Math.random(),
      acquiredAt: new Date().toISOString()
    };
    
    this.connectionHistory.push(connection);
    return connection;
  }

  releaseConnection(connection) {
    this.activeConnections = Math.max(0, this.activeConnections - 1);
    connection.releasedAt = new Date().toISOString();
    connection.duration = new Date(connection.releasedAt) - new Date(connection.acquiredAt);
  }

  getPoolStatus() {
    return {
      maxConnections: this.maxConnections,
      activeConnections: this.activeConnections,
      availableConnections: this.maxConnections - this.activeConnections,
      utilizationRate: (this.activeConnections / this.maxConnections) * 100
    };
  }
}

// Load balancing simulation
export function simulateLoadBalancing(endpoints, weights = null) {
  if (!weights) {
    weights = endpoints.map(() => 1 / endpoints.length);
  }

  const random = Math.random();
  let cumulativeWeight = 0;
  
  for (let i = 0; i < endpoints.length; i++) {
    cumulativeWeight += weights[i];
    if (random <= cumulativeWeight) {
      return endpoints[i];
    }
  }
  
  return endpoints[endpoints.length - 1]; // Fallback to last endpoint
}

// Cache hit/miss simulation
export class CacheSimulator {
  constructor(maxSize = 1000) {
    this.cache = new Map();
    this.maxSize = maxSize;
    this.hits = 0;
    this.misses = 0;
  }

  get(key) {
    if (this.cache.has(key)) {
      this.hits++;
      return this.cache.get(key);
    }
    
    this.misses++;
    return null;
  }

  set(key, value) {
    if (this.cache.size >= this.maxSize) {
      // Remove oldest entry (simple LRU simulation)
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    
    this.cache.set(key, value);
  }

  getStats() {
    const total = this.hits + this.misses;
    return {
      hits: this.hits,
      misses: this.misses,
      total: total,
      hitRate: total > 0 ? (this.hits / total) * 100 : 0
    };
  }
}

// Performance regression detection
export function detectPerformanceRegression(currentMetrics, baselineMetrics, threshold = 0.2) {
  const regressions = [];
  
  for (const [metric, currentValue] of Object.entries(currentMetrics)) {
    const baselineValue = baselineMetrics[metric];
    if (baselineValue && currentValue > baselineValue * (1 + threshold)) {
      regressions.push({
        metric,
        baseline: baselineValue,
        current: currentValue,
        regression: ((currentValue - baselineValue) / baselineValue) * 100
      });
    }
  }
  
  return regressions;
}

// Export default monitor instance
export const defaultMonitor = new PerformanceMonitor();
