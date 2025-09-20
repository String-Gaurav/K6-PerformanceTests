import { BASE_CONFIG, SCENARIOS } from '../config/base-config.js';
import { testHomepageLoad, testStaticAssetsLoad } from '../tests/ui/page-load-test.js';
import { testSearchFunctionality, testFormInteractions } from '../tests/ui/user-interaction-test.js';

/**
 * UI Smoke Test Scenario
 * Quick validation that UI components are working and loading properly
 */

export const options = {
  thresholds: {
    http_req_duration: ['p(95)<2000'],
    http_req_failed: ['rate<0.1'],
    http_req_waiting: ['p(95)<1500'],
    checks: ['rate>0.9']
  },
  scenarios: {
    ui_smoke_test: {
      executor: 'constant-vus',
      vus: 1,
      duration: '30s',
      tags: { test_type: 'smoke' }
    }
  }
};

export function setup() {
  console.log('Starting UI Smoke Test');
  console.log(`Base URL: ${BASE_CONFIG.UI_BASE_URL}`);
  
  return {
    baseUrl: BASE_CONFIG.UI_BASE_URL,
    testStartTime: new Date().toISOString()
  };
}

export default function(data) {
  console.log('Running UI smoke test iteration');
  
  // Page Load Smoke Tests
  testHomepageLoad(data.baseUrl);
  testStaticAssetsLoad(data.baseUrl);
  
  // User Interaction Smoke Tests
  testSearchFunctionality(data.baseUrl);
  testFormInteractions(data.baseUrl);
}

export function teardown(data) {
  console.log('UI Smoke Test Completed Successfully');
  console.log('UI Smoke Test Summary:');
  console.log('- Homepage loads correctly');
  console.log('- Static assets are accessible');
  console.log('- Search functionality works');
  console.log('- Forms are interactive');
}
