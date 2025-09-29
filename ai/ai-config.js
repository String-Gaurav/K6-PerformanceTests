/**
 * AI Configuration for k6 Performance Testing Framework
 * I set this up to make the AI features actually useful for performance testing
 * Not just AI for the sake of AI, but stuff that actually helps
 */

export const AI_CONFIG = {
  // Gemini AI Configuration
  GEMINI: {
    API_KEY: __ENV.GEMINI_API_KEY || '',
    MODEL: 'gemini-1.5-pro',
    BASE_URL: 'https://generativelanguage.googleapis.com/v1beta',
    TIMEOUT: 30000, // 30 seconds
    MAX_RETRIES: 2
  },

  // AI Features - Only turn these on if they actually help
  FEATURES: {
    // Creates test scenarios based on what it finds in your API
    SMART_TEST_GENERATION: __ENV.AI_TEST_GENERATION === 'true',
    
    // Looks at your test results and tells you what's wrong
    PERFORMANCE_INSIGHTS: __ENV.AI_INSIGHTS === 'true',
    
    // Makes up realistic test data so you don't have to
    INTELLIGENT_TEST_DATA: __ENV.AI_TEST_DATA === 'true'
  },

  // When to actually run AI analysis
  THRESHOLDS: {
    MIN_SAMPLES_FOR_ANALYSIS: 10, // Need at least 10 data points
    ANOMALY_DETECTION_CONFIDENCE: 0.8, // 80% sure it's an anomaly
    PERFORMANCE_REGRESSION_THRESHOLD: 0.2 // 20% worse than before
  },

  // How the AI analysis works
  ANALYSIS: {
    ENABLE_REAL_TIME_INSIGHTS: __ENV.AI_REAL_TIME === 'true', // Live analysis during tests
    CACHE_ANALYSIS_RESULTS: true, // Save results so we don't repeat work
    CACHE_TTL: 3600 // Cache for 1 hour
  }
};

/**
 * Makes sure the AI config is set up correctly
 * Checks for common mistakes and missing values
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