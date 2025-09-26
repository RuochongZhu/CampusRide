const { beforeAll, afterAll, beforeEach } = require('@jest/globals');
require('dotenv').config({ path: '.env.test' });

// Global test setup
beforeAll(async () => {
  console.log('🚀 Starting CI/CD Integration Tests...');
  
  // Set test timeout
  jest.setTimeout(30000);
  
  // Ensure test environment
  process.env.NODE_ENV = 'test';
  
  // Mock external services if needed
  if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY.includes('test')) {
    console.log('📧 Using mock email service for tests');
  }
  
  if (!process.env.SUPABASE_URL || process.env.SUPABASE_URL.includes('test')) {
    console.log('🗄️  Using mock database for tests');
  }
});

afterAll(async () => {
  console.log('✅ CI/CD Integration Tests completed');
});

beforeEach(() => {
  // Reset any global state between tests
  jest.clearAllMocks();
});