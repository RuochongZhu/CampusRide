import dotenv from 'dotenv';

// Load test environment variables
dotenv.config({ path: '.env.test' });

// Set test environment
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_jwt_secret_key';
process.env.SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_SERVICE_KEY = 'test_service_key';
process.env.SUPABASE_ANON_KEY = 'test_anon_key';

// Global test setup
global.console = {
  ...console,
  // Suppress logs during testing unless explicitly needed
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
};

// Mock Supabase client for tests
jest.mock('../src/config/database.js', () => ({
  supabaseAdmin: {
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      neq: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      lte: jest.fn().mockReturnThis(),
      ilike: jest.fn().mockReturnThis(),
      or: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      range: jest.fn().mockReturnThis(),
      single: jest.fn(() => Promise.resolve({ data: null, error: null })),
      limit: jest.fn().mockReturnThis(),
    })),
    rpc: jest.fn(() => Promise.resolve({ data: null, error: null })),
  },
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(() => Promise.resolve({ data: null, error: null })),
    })),
  },
  testConnection: jest.fn(() => Promise.resolve(true)),
}));

// Mock Socket.io for tests
jest.mock('../src/config/socket.js', () => ({
  default: {
    sendNotificationToUser: jest.fn(),
    sendRideshareUpdate: jest.fn(),
    sendMarketplaceUpdate: jest.fn(),
    sendPointsUpdate: jest.fn(),
    broadcastNotification: jest.fn(),
    isUserOnline: jest.fn(() => false),
    getOnlineUsersCount: jest.fn(() => 0),
  },
}));

// Test helpers
global.createMockRequest = (overrides = {}) => ({
  body: {},
  params: {},
  query: {},
  headers: {},
  user: { id: 'test-user-id', email: 'test@example.com' },
  ...overrides,
});

global.createMockResponse = () => {
  const res = {};
  res.status = jest.fn(() => res);
  res.json = jest.fn(() => res);
  res.send = jest.fn(() => res);
  res.cookie = jest.fn(() => res);
  res.clearCookie = jest.fn(() => res);
  return res;
};

global.createMockNext = () => jest.fn();

// Async test helper
global.asyncTest = (fn) => {
  return async () => {
    try {
      await fn();
    } catch (error) {
      console.error('Test failed:', error);
      throw error;
    }
  };
}; 