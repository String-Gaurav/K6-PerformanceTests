/**
 * Optimized Gemini AI Service for k6 Performance Testing
 * Efficient AI usage with cost optimization and smart caching
 */

import http from 'k6/http';

export class OptimizedGeminiAIService {
  constructor(apiKey, model = 'gemini-pro') {
    this.apiKey = apiKey;
    this.model = model;
    this.baseUrl = 'https://generativelanguage.googleapis.com/v1';
    this.cache = new Map();
    this.requestCount = 0;
    this.maxRequestsPerTest = 3; // Limit API calls per test
    this.cacheHits = 0;
    this.cacheMisses = 0;
    
    // Validate API key
    if (!apiKey || apiKey.length < 10) {
      throw new Error('Invalid Gemini API key provided');
    }
  }

  /**
   * Optimized API call with better error handling and cost control
   */
  async callGeminiAPI(prompt, maxTokens = 512) {
    // Check request limit
    if (this.requestCount >= this.maxRequestsPerTest) {
      console.log('AI: Request limit reached, using cached results');
      return this.getCachedResponse(prompt);
    }

    const headers = {
      'Content-Type': 'application/json',
      'x-goog-api-key': this.apiKey
    };

    const payload = {
      contents: [{
        parts: [{
          text: prompt
        }]
      }],
      generationConfig: {
        temperature: 0.3, // Lower temperature for more consistent results
        topK: 20,         // Reduced for cost efficiency
        topP: 0.8,        // Reduced for cost efficiency
        maxOutputTokens: maxTokens // Dynamic token limit
      }
    };

    try {
      const response = http.post(
        `${this.baseUrl}/models/${this.model}:generateContent`,
        JSON.stringify(payload),
        { headers: headers, timeout: '15s' } // Reduced timeout
      );

      this.requestCount++;

      if (response.status !== 200) {
        console.error(`AI API Error: ${response.status} - ${response.body}`);
        return this.getFallbackResponse(prompt);
      }

      const data = JSON.parse(response.body);
      const result = data.candidates[0].content.parts[0].text;
      
      // Cache the result
      this.cache.set(this.getCacheKey(prompt), {
        result: result,
        timestamp: Date.now(),
        ttl: 1800000 // 30 minutes TTL
      });
      
      return result;
    } catch (error) {
      console.error('AI API call failed:', error.message);
      return this.getFallbackResponse(prompt);
    }
  }

  /**
   * Smart cache key generation
   */
  getCacheKey(prompt) {
    // Create a hash-like key from prompt content
    const words = prompt.split(' ').slice(0, 10).join('_');
    const type = prompt.includes('threshold') ? 'threshold' : 'analysis';
    return `${type}_${words}`;
  }

  /**
   * Get cached response if available and not expired
   */
  getCachedResponse(prompt) {
    const cacheKey = this.getCacheKey(prompt);
    const cached = this.cache.get(cacheKey);
    
    if (cached && (Date.now() - cached.timestamp) < cached.ttl) {
      this.cacheHits++;
      return cached.result;
    }
    
    this.cacheMisses++;
    return this.getFallbackResponse(prompt);
  }

  /**
   * Fallback response when AI is unavailable
   */
  getFallbackResponse(prompt) {
    if (prompt.includes('threshold')) {
      return JSON.stringify({
        thresholds: {
          http_req_duration: ['p(95)<500', 'p(99)<1000'],
          http_req_failed: ['rate<0.05'],
          checks: ['rate>0.95']
        },
        reasoning: 'AI analysis unavailable - using default thresholds'
      });
    }
    
    return 'Performance analysis unavailable - review results manually. Check error rates and response times.';
  }

  /**
   * Combined analysis and recommendations in single API call
   */
  async analyzePerformanceWithRecommendations(testResults) {
    const cacheKey = `combined_${JSON.stringify(testResults)}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && (Date.now() - cached.timestamp) < cached.ttl) {
      this.cacheHits++;
      return cached.result;
    }

    const prompt = `
    Analyze these k6 performance test results and provide both insights and threshold recommendations:

    Test Results:
    - Response Time: ${testResults.responseTime || 'N/A'}ms
    - Error Rate: ${testResults.errorRate || 'N/A'}%
    - Throughput: ${testResults.throughput || 'N/A'} requests/sec
    - Status: ${testResults.status || 'N/A'}

    Provide:
    1. Brief performance summary (max 100 words)
    2. Top 3 actionable recommendations
    3. Recommended k6 thresholds as JSON

    Format response as JSON:
    {
      "summary": "brief summary",
      "recommendations": ["item1", "item2", "item3"],
      "thresholds": {
        "http_req_duration": ["p(95)<X", "p(99)<Y"],
        "http_req_failed": ["rate<Z"],
        "checks": ["rate>W"]
      }
    }
    `;

    try {
      const response = await this.callGeminiAPI(prompt, 800); // Reduced token limit
      
      // Try to parse JSON response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[0]);
        this.cache.set(cacheKey, {
          result: result,
          timestamp: Date.now(),
          ttl: 1800000
        });
        return result;
      }
      
      // Fallback if JSON parsing fails
      return this.getFallbackAnalysis(testResults);
    } catch (error) {
      console.error('AI analysis failed:', error.message);
      return this.getFallbackAnalysis(testResults);
    }
  }

  /**
   * Fallback analysis when AI fails
   */
  getFallbackAnalysis(testResults) {
    const errorRate = testResults.errorRate || 0;
    const responseTime = testResults.responseTime || 500;
    
    return {
      summary: `Performance test completed. Response time: ${responseTime}ms, Error rate: ${errorRate}%`,
      recommendations: [
        'Monitor error rates and investigate failures',
        'Check response time thresholds',
        'Review system resources during peak load'
      ],
      thresholds: {
        http_req_duration: [`p(95)<${responseTime * 2}`, `p(99)<${responseTime * 3}`],
        http_req_failed: [`rate<${Math.max(0.01, errorRate * 2)}`],
        checks: ['rate>0.95']
      }
    };
  }

  /**
   * Get usage statistics
   */
  getUsageStats() {
    return {
      totalRequests: this.requestCount,
      cacheHits: this.cacheHits,
      cacheMisses: this.cacheMisses,
      cacheHitRate: this.cacheHits / (this.cacheHits + this.cacheMisses) * 100,
      requestsRemaining: this.maxRequestsPerTest - this.requestCount
    };
  }

  /**
   * Reset counters for new test
   */
  resetCounters() {
    this.requestCount = 0;
    this.cacheHits = 0;
    this.cacheMisses = 0;
  }
}

export default OptimizedGeminiAIService;
