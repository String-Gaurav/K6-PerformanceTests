/**
 * Optimized AI-Enhanced Performance Testing
 * This is the smarter version that doesn't waste money on API calls
 * I built this after realizing the original was making too many requests
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { OptimizedGeminiAIService } from '../ai/optimized-gemini-service.js';
import { BASE_CONFIG } from '../config/base-config.js';

// Set up the AI service if we have an API key
const GEMINI_API_KEY = __ENV.GEMINI_API_KEY || '';
const aiService = GEMINI_API_KEY ? new OptimizedGeminiAIService(GEMINI_API_KEY) : null;

export const options = {
  thresholds: {
    ...BASE_CONFIG.THRESHOLDS,
    http_req_duration: ['p(95)<500', 'p(99)<1000'],
    http_req_failed: ['rate<0.05'],
    checks: ['rate>0.9']
  },
  scenarios: {
    optimized_ai_test: {
      executor: 'ramping-vus',
      startVUs: 1,
      stages: [
        { duration: '30s', target: 3 },
        { duration: '1m', target: 3 },
        { duration: '30s', target: 0 }
      ]
    }
  }
};

export function setup() {
  console.log('Optimized AI-Enhanced Performance Test Starting...');
  console.log(`AI Analysis Available: ${aiService ? 'Yes' : 'No'}`);
  console.log(`Base URL: ${BASE_CONFIG.BASE_URL}`);
  
  if (aiService) {
    console.log('AI Usage Optimization: Enabled');
    console.log('Smart Caching: Enabled');
    console.log('Cost Control: Enabled');
  }
  
  return {
    baseUrl: BASE_CONFIG.BASE_URL,
    aiEnabled: aiService !== null,
    testStartTime: new Date().toISOString(),
    performanceMetrics: [],
    aiAnalysisDone: false
  };
}

export default function(data) {
  // Run performance test
  const endpoints = ['/posts/1', '/posts/2', '/posts/3', '/users/1', '/comments/1'];
  const randomEndpoint = endpoints[Math.floor(Math.random() * endpoints.length)];
  
  const response = http.get(`${data.baseUrl}${randomEndpoint}`);
  
  // Collect metrics
  const metrics = {
    responseTime: response.timings.duration,
    status: response.status,
    endpoint: randomEndpoint,
    timestamp: new Date().toISOString()
  };
  
  data.performanceMetrics.push(metrics);
  
  // Standard checks
  check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 1000ms': (r) => r.timings.duration < 1000,
    'response has body': (r) => r.body.length > 0
  });
  
  // AI analysis (only once when we have enough data)
  if (data.aiEnabled && !data.aiAnalysisDone && data.performanceMetrics.length >= 8) {
    runOptimizedAIAnalysis(data.performanceMetrics);
    data.aiAnalysisDone = true;
  }
  
  sleep(1);
}

/**
 * Optimized AI analysis with single API call
 */
async function runOptimizedAIAnalysis(metrics) {
  try {
    // Calculate summary metrics
    const responseTimes = metrics.map(m => m.responseTime);
    const avgResponseTime = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
    const maxResponseTime = Math.max(...responseTimes);
    const errorRate = metrics.filter(m => m.status >= 400).length / metrics.length;
    const throughput = metrics.length;
    
    const testResults = {
      responseTime: Math.round(avgResponseTime),
      maxResponseTime: Math.round(maxResponseTime),
      errorRate: Math.round(errorRate * 100),
      throughput: throughput,
      status: errorRate > 0.05 ? 'DEGRADED' : 'HEALTHY'
    };
    
    console.log('AI: Running optimized analysis...');
    const analysis = await aiService.analyzePerformanceWithRecommendations(testResults);
    
    console.log('\nAI Performance Analysis:');
    console.log(`Summary: ${analysis.summary}`);
    console.log('\nAction Items:');
    analysis.recommendations.forEach((item, index) => {
      console.log(`   ${index + 1}. ${item}`);
    });
    
    console.log('\nRecommended k6 Thresholds:');
    Object.entries(analysis.thresholds).forEach(([metric, thresholds]) => {
      console.log(`   ${metric}: ${thresholds.join(', ')}`);
    });
    
  } catch (error) {
    console.error('AI: Analysis failed:', error.message);
  }
}

export async function teardown(data) {
  console.log('\nOptimized AI-Enhanced Performance Test Completed');
  
  if (data.aiEnabled && data.performanceMetrics.length > 0) {
    // Show final metrics
    const responseTimes = data.performanceMetrics.map(m => m.responseTime).sort((a, b) => a - b);
    const p95Index = Math.floor(responseTimes.length * 0.95);
    const p99Index = Math.floor(responseTimes.length * 0.99);
    
    const finalMetrics = {
      totalRequests: data.performanceMetrics.length,
      avgResponseTime: data.performanceMetrics.reduce((sum, m) => sum + m.responseTime, 0) / data.performanceMetrics.length,
      p95: responseTimes[p95Index] || 0,
      p99: responseTimes[p99Index] || 0,
      errorRate: data.performanceMetrics.filter(m => m.status >= 400).length / data.performanceMetrics.length,
      throughput: data.performanceMetrics.length / 2
    };
    
    console.log('\nFinal Performance Summary:');
    console.log(`   Total Requests: ${finalMetrics.totalRequests}`);
    console.log(`   Average Response Time: ${finalMetrics.avgResponseTime.toFixed(2)}ms`);
    console.log(`   95th Percentile: ${finalMetrics.p95.toFixed(2)}ms`);
    console.log(`   99th Percentile: ${finalMetrics.p99.toFixed(2)}ms`);
    console.log(`   Error Rate: ${(finalMetrics.errorRate * 100).toFixed(2)}%`);
    console.log(`   Throughput: ${finalMetrics.throughput.toFixed(2)} req/s`);
    
    // Show AI usage statistics
    const usageStats = aiService.getUsageStats();
    console.log('\nAI Usage Statistics:');
    console.log(`   API Requests Made: ${usageStats.totalRequests}`);
    console.log(`   Cache Hit Rate: ${usageStats.cacheHitRate.toFixed(1)}%`);
    console.log(`   Requests Remaining: ${usageStats.requestsRemaining}`);
    console.log(`   Cost Optimization: ${usageStats.cacheHitRate > 50 ? 'Excellent' : 'Could be better'}`);
  }
  
  console.log('\nTest completed with optimized AI insights!');
}
