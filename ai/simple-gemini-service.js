/**
 * Gemini AI Service for k6 Performance Testing
 * I built this to add some smart analysis to performance tests
 * It's pretty straightforward - just sends data to Gemini and gets insights back
 */

import http from 'k6/http';

export class GeminiAIService {
  constructor(apiKey, model = 'gemini-1.5-pro') {
    this.apiKey = apiKey;
    this.model = model;
    this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta';
    this.cache = new Map();
  }

  /**
   * Makes a call to the Gemini API
   * Nothing fancy here, just sends the prompt and gets a response back
   */
  async callGeminiAPI(prompt) {
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
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048
      }
    };

    const response = http.post(
      `${this.baseUrl}/models/${this.model}:generateContent`,
      JSON.stringify(payload),
      { headers: headers, timeout: '30s' }
    );

    if (response.status !== 200) {
      throw new Error(`Gemini API error: ${response.status} - ${response.body}`);
    }

    try {
      const data = JSON.parse(response.body);
      return data.candidates[0].content.parts[0].text;
    } catch (error) {
      throw new Error(`Failed to parse Gemini response: ${error.message}`);
    }
  }

  /**
   * Looks at your test results and tries to figure out what's going on
   * Returns some insights that might actually be helpful
   */
  async analyzePerformanceResults(testResults) {
    // Check cache first
    const cacheKey = `analysis_${JSON.stringify(testResults)}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    const prompt = `
    Analyze these k6 performance test results and provide actionable insights:

    Test Results:
    - Response Time: ${testResults.responseTime || 'N/A'}ms
    - Error Rate: ${testResults.errorRate || 'N/A'}%
    - Throughput: ${testResults.throughput || 'N/A'} requests/sec
    - Status: ${testResults.status || 'N/A'}

    Focus on:
    1. Performance issues that need immediate attention
    2. Specific recommendations for improvement
    3. Production readiness assessment

    Keep response under 200 words and focus on actionable items.
    `;

    try {
      const response = await this.callGeminiAPI(prompt);
      const analysis = {
        summary: response.substring(0, 200),
        actionable: this.extractActionItems(response),
        timestamp: new Date().toISOString()
      };
      
      // Cache the result
      this.cache.set(cacheKey, analysis);
      return analysis;
    } catch (error) {
      console.error('Error analyzing performance results:', error);
      return {
        summary: 'Performance analysis unavailable - review results manually',
        actionable: ['Check error rates and response times'],
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Suggests some k6 thresholds based on your performance data
   * Sometimes it's hard to know what thresholds to set, so this helps
   */
  async generateThresholdRecommendations(performanceData) {
    const prompt = `
    Based on these performance test results, recommend optimal thresholds for k6 testing:

    Performance Data:
    - Average Response Time: ${performanceData.avgResponseTime}ms
    - 95th Percentile: ${performanceData.p95}ms
    - Error Rate: ${performanceData.errorRate}%
    - Throughput: ${performanceData.throughput} req/s

    Recommend specific k6 threshold values for:
    1. http_req_duration (p95 and p99)
    2. http_req_failed (error rate)
    3. checks (success rate)

    Return as JSON with the threshold values and reasoning.
    `;

    try {
      const response = await this.callGeminiAPI(prompt);
      const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[1]);
      }
      
      // Fallback parsing
      return {
        thresholds: {
          http_req_duration: [`p(95)<${performanceData.avgResponseTime * 2}`, `p(99)<${performanceData.avgResponseTime * 3}`],
          http_req_failed: [`rate<${Math.max(0.01, performanceData.errorRate * 2)}`],
          checks: ['rate>0.95']
        },
        reasoning: 'AI analysis unavailable - using calculated defaults'
      };
    } catch (error) {
      console.error('Error generating threshold recommendations:', error);
      return {
        thresholds: {
          http_req_duration: [`p(95)<500`, `p(99)<1000`],
          http_req_failed: ['rate<0.05'],
          checks: ['rate>0.95']
        },
        reasoning: 'Using default thresholds due to AI analysis failure'
      };
    }
  }

  /**
   * Creates some realistic test data for you
   * Because coming up with test data is boring and time-consuming
   */
  async generateTestData(dataSchema, context = {}) {
    const prompt = `
    Generate realistic test data for performance testing:

    Data Schema: ${JSON.stringify(dataSchema, null, 2)}
    Context: ${JSON.stringify(context, null, 2)}

    Generate 3-5 realistic test records that would be found in production.
    Return only the JSON data, no explanations.
    `;

    try {
      const response = await this.callGeminiAPI(prompt);
      const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[1]);
      }
      return this.getFallbackTestData(dataSchema);
    } catch (error) {
      console.error('Error generating test data:', error);
      return this.getFallbackTestData(dataSchema);
    }
  }

  // Helper methods - these just parse the AI response and extract useful stuff
  extractActionItems(response) {
    const actionItems = [];
    const lines = response.split('\n');
    
    for (const line of lines) {
      if (line.includes('recommend') || line.includes('should') || line.includes('need to')) {
        actionItems.push(line.trim());
      }
    }
    
    return actionItems.slice(0, 3); // Return top 3 actionable items
  }

  // Fallback methods - when the AI isn't working, we use these instead
  getFallbackTestData(dataSchema) {
    return [
      { 
        id: 1, 
        title: 'Performance Test Data', 
        content: 'Generated for testing purposes',
        userId: 1 
      },
      { 
        id: 2, 
        title: 'Load Test Sample', 
        content: 'Sample data for load testing',
        userId: 2 
      }
    ];
  }
}

export default GeminiAIService;
