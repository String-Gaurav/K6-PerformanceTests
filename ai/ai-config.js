/**
 * AI Configuration for k6 Performance Testing Framework
 * Focused on practical AI features that solve real performance testing problems
 */

export const AI_CONFIG = {
  // Gemini AI Configuration
  GEMINI: {
    API_KEY: __ENV.GEMINI_API_KEY || '',
    MODEL: 'gemini-1.5-flash',
    BASE_URL: 'https://generativelanguage.googleapis.com/v1beta',
    TIMEOUT: 30000, // 30 seconds
    MAX_RETRIES: 2
  },

  // AI Features - Only enabled if they solve real problems
  FEATURES: {
    // Generate intelligent test scenarios based on API analysis
    SMART_TEST_GENERATION: __ENV.AI_TEST_GENERATION === 'true',
    
    // Analyze performance results and provide actionable insights
    PERFORMANCE_INSIGHTS: __ENV.AI_INSIGHTS === 'true',
    
    // Generate realistic test data based on application context
    INTELLIGENT_TEST_DATA: __ENV.AI_TEST_DATA === 'true'
  },

  // Performance thresholds for AI analysis
  THRESHOLDS: {
    MIN_SAMPLES_FOR_ANALYSIS: 10,
    ANOMALY_DETECTION_CONFIDENCE: 0.8,
    PERFORMANCE_REGRESSION_THRESHOLD: 0.2 // 20% degradation
  },

  // AI Analysis Configuration
  ANALYSIS: {
    ENABLE_REAL_TIME_INSIGHTS: __ENV.AI_REAL_TIME === 'true',
    CACHE_ANALYSIS_RESULTS: true,
    CACHE_TTL: 3600 // 1 hour
  }
};

/**
 * Validate AI Configuration
 */
export function validateAIConfig() {
  const errors = [];
  
  if (AI_CONFIG.GEMINI.API_KEY && AI_CONFIG.GEMINI.API_KEY.length < 10) {
    errors.push('Invalid Gemini API key');
  }
  
  return {
    isValid: errors.length === 0,
    errors: errors
  };
}

export default AI_CONFIG;