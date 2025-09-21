/**
 * AI-Enhanced Performance Testing with Intelligent Insights
 * Demonstrates practical AI integration for performance analysis
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { GeminiAIService } from '../ai/simple-gemini-service.js';
import { BASE_CONFIG } from '../config/base-config.js';

// Initialize AI service only if API key is available
const GEMINI_API_KEY = __ENV.GEMINI_API_KEY || '';
const aiService = GEMINI_API_KEY ? new GeminiAIService(GEMINI_API_KEY) : null;

export const options = {
  thresholds: {
    ...BASE_CONFIG.THRESHOLDS,
    http_req_duration: ['p(95)<500', 'p(99)<1000'],
    http_req_failed: ['rate<0.05'],
    checks: ['rate>0.9']
  },
  scenarios: {
    simple_ai_test: {
      executor: 'ramping-vus',
      startVUs: 1,
      stages: [
        { duration: '30s', target: 2 },
        { duration: '1m', target: 2 },
        { duration: '30s', target: 0 }
      ]
    }
  }
};

export function setup() {
  console.log('AI-Enhanced Performance Test Starting...');
  console.log(`AI Analysis Available: ${aiService ? 'Yes' : 'No'}`);
  console.log(`Base URL: ${BASE_CONFIG.BASE_URL}`);
  
  return {
    baseUrl: BASE_CONFIG.BASE_URL,
    aiEnabled: aiService !== null,
    testStartTime: new Date().toISOString(),
    performanceMetrics: [],
    aiInsightsGenerated: false
  };
}

export default function(data) {
  // Run the actual performance test
  const endpoints = ['/posts/1', '/posts/2', '/posts/3', '/users/1', '/comments/1'];
  const randomEndpoint = endpoints[Math.floor(Math.random() * endpoints.length)];
  
  const response = http.get(`${data.baseUrl}${randomEndpoint}`);
  
  // Collect performance metrics
  const metrics = {
    responseTime: response.timings.duration,
    status: response.status,
    endpoint: randomEndpoint,
    timestamp: new Date().toISOString()
  };
  
  data.performanceMetrics.push(metrics);
  
  // Standard k6 checks
  check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 1000ms': (r) => r.timings.duration < 1000,
    'response has body': (r) => r.body.length > 0
  });
  
  // AI-enhanced analysis (only once per test run)
  if (data.aiEnabled && !data.aiInsightsGenerated && data.performanceMetrics.length >= 5) {
    runAIPerformanceAnalysis(data.performanceMetrics);
    data.aiInsightsGenerated = true;
  }
  
  sleep(1);
}

/**
 * Run AI performance analysis on collected metrics
 */
async function runAIPerformanceAnalysis(metrics) {
  try {
    // Calculate summary metrics
    const avgResponseTime = metrics.reduce((sum, m) => sum + m.responseTime, 0) / metrics.length;
    const errorRate = metrics.filter(m => m.status >= 400).length / metrics.length;
    const throughput = metrics.length;
    
    const testResults = {
      responseTime: Math.round(avgResponseTime),
      errorRate: Math.round(errorRate * 100),
      throughput: throughput,
      status: errorRate > 0.05 ? 'DEGRADED' : 'HEALTHY'
    };
    
    console.log('AI: Analyzing performance metrics...');
    const analysis = await aiService.analyzePerformanceResults(testResults);
    
    console.log('AI Performance Analysis:');
    console.log(`Summary: ${analysis.summary}`);
    console.log('Action Items:');
    analysis.actionable.forEach((item, index) => {
      console.log(`  ${index + 1}. ${item}`);
    });
    
  } catch (error) {
    console.error('AI: Analysis failed:', error.message);
  }
}

export async function teardown(data) {
  console.log('AI-Enhanced Performance Test Completed');
  
  if (data.aiEnabled && data.performanceMetrics.length > 0) {
    console.log('AI: Generating final insights...');
    
    // Calculate final metrics
    const responseTimes = data.performanceMetrics.map(m => m.responseTime).sort((a, b) => a - b);
    const p95Index = Math.floor(responseTimes.length * 0.95);
    const p99Index = Math.floor(responseTimes.length * 0.99);
    
    const finalMetrics = {
      totalRequests: data.performanceMetrics.length,
      avgResponseTime: data.performanceMetrics.reduce((sum, m) => sum + m.responseTime, 0) / data.performanceMetrics.length,
      p95: responseTimes[p95Index] || 0,
      p99: responseTimes[p99Index] || 0,
      errorRate: data.performanceMetrics.filter(m => m.status >= 400).length / data.performanceMetrics.length,
      throughput: data.performanceMetrics.length / 2,
      status: 'COMPLETED'
    };
    
    console.log('Final Performance Summary:');
    console.log(`- Total Requests: ${finalMetrics.totalRequests}`);
    console.log(`- Average Response Time: ${finalMetrics.avgResponseTime.toFixed(2)}ms`);
    console.log(`- 95th Percentile: ${finalMetrics.p95.toFixed(2)}ms`);
    console.log(`- 99th Percentile: ${finalMetrics.p99.toFixed(2)}ms`);
    console.log(`- Error Rate: ${(finalMetrics.errorRate * 100).toFixed(2)}%`);
    console.log(`- Throughput: ${finalMetrics.throughput.toFixed(2)} req/s`);
    
    // AI threshold recommendations
    try {
      console.log('AI: Generating threshold recommendations...');
      const recommendations = await aiService.generateThresholdRecommendations(finalMetrics);
      
      console.log('AI Threshold Recommendations:');
      console.log('Recommended k6 thresholds:');
      Object.entries(recommendations.thresholds).forEach(([metric, thresholds]) => {
        console.log(`  ${metric}: ${thresholds.join(', ')}`);
      });
      console.log(`Reasoning: ${recommendations.reasoning}`);
    } catch (error) {
      console.error('AI: Threshold recommendations failed:', error.message);
    }
  }
  
  console.log('Test completed successfully with AI-enhanced insights');
}