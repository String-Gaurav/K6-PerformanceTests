/**
 * Optimized Gemini AI Service for k6 Performance Testing
 * I made this version because the original one was making too many API calls
 * This one is smarter about caching and costs way less to run
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
    
    // Make sure we have a valid API key
    if (!apiKey || apiKey.length < 10) {
      throw new Error('Invalid Gemini API key provided');
    }
  }

  /**
   * Makes an API call but tries to be smart about it
   * Includes better error handling and keeps costs down
   */
  async callGeminiAPI(prompt, maxTokens = 512) {
    // Don't make too many API calls - it gets expensive
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
        temperature: 0.3, // Keep it consistent
        topK: 20,         // Less randomness = cheaper
        topP: 0.8,        // Less randomness = cheaper
        maxOutputTokens: maxTokens // Use only what we need
      }
    };

    try {
      const response = http.post(
        `${this.baseUrl}/models/${this.model}:generateContent`,
        JSON.stringify(payload),
        { headers: headers, timeout: '15s' } // Don't wait too long
      );

      this.requestCount++;

      if (response.status !== 200) {
        console.error(`AI API Error: ${response.status} - ${response.body}`);
        return this.getFallbackResponse(prompt);
      }

      const data = JSON.parse(response.body);
      const result = data.candidates[0].content.parts[0].text;
      
      // Save this result so we don't have to ask again
      this.cache.set(this.getCacheKey(prompt), {
        result: result,
        timestamp: Date.now(),
        ttl: 1800000 // Cache for 30 minutes
      });
      
      return result;
    } catch (error) {
      console.error('AI API call failed:', error.message);
      return this.getFallbackResponse(prompt);
    }
  }

  /**
   * Creates a cache key that makes sense
   * Uses the first few words of the prompt to keep it simple
   */
  getCacheKey(prompt) {
    // Just use the first few words to create a simple key
    const words = prompt.split(' ').slice(0, 10).join('_');
    const type = prompt.includes('threshold') ? 'threshold' : 'analysis';
    return `${type}_${words}`;
  }

  /**
   * Checks if we have a cached response that's still good
   * Saves us from making another expensive API call
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
   * When the AI isn't working, we give a basic response instead
   * Better than breaking the whole test
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
   * Does both analysis and recommendations in one API call
   * Saves money and time compared to making two separate calls
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
      
      // Try to parse the JSON response
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
      
      // If we can't parse it, use the fallback
      return this.getFallbackAnalysis(testResults);
    } catch (error) {
      console.error('AI analysis failed:', error.message);
      return this.getFallbackAnalysis(testResults);
    }
  }

  /**
   * Basic analysis when the AI isn't working
   * Gives you something useful instead of nothing
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
   * Shows you how the AI service is performing
   * Useful for debugging and cost tracking
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
   * Resets everything for a fresh test run
   */
  resetCounters() {
    this.requestCount = 0;
    this.cacheHits = 0;
    this.cacheMisses = 0;
  }
}

export default OptimizedGeminiAIService;
