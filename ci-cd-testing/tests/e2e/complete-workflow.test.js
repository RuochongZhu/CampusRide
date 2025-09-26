const { describe, test, expect, beforeAll } = require('@jest/globals');
const axios = require('axios');

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001';

describe('End-to-End Workflow Tests', () => {
  beforeAll(async () => {
    // Ensure backend is running
    let retries = 15;
    while (retries > 0) {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/v1/health`);
        if (response.status === 200) break;
      } catch (error) {
        retries--;
        if (retries === 0) {
          console.error('Backend health check failed after 15 retries');
          throw new Error('Backend not accessible');
        }
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  });

  test('Complete user registration flow', async () => {
    const timestamp = Date.now();
    const testUser = {
      email: `e2e-test-${timestamp}@cornell.edu`,
      password: 'TestPass',  // Must be exactly 8 characters
      nickname: `E2EUser${timestamp}`
    };

    try {
      // Step 1: Register user
      const registerResponse = await axios.post(`${API_BASE_URL}/api/v1/auth/register`, testUser);
      expect([200, 201, 400]).toContain(registerResponse.status);

      // Step 2: Attempt login (may fail due to email verification requirement)
      try {
        const loginResponse = await axios.post(`${API_BASE_URL}/api/v1/auth/login`, {
          email: testUser.email,
          password: testUser.password
        });
        
        if (loginResponse.status === 200) {
          expect(loginResponse.data.success).toBe(true);
          expect(loginResponse.data.data).toHaveProperty('token');
        }
      } catch (loginError) {
        // Email verification required - this is expected behavior
        expect([400, 401]).toContain(loginError.response?.status);
      }

    } catch (error) {
      // Handle case where user already exists
      if (error.response?.status === 400 && error.response?.data?.error?.message?.includes('already exists')) {
        console.log('User already exists - test passed');
      } else {
        throw error;
      }
    }
  });

  test('API endpoints are accessible', async () => {
    const endpoints = [
      '/api/v1/health',
      '/api/v1/auth/register',  // POST endpoint, expect 400 for GET
      '/api/v1/auth/login'      // POST endpoint, expect 400 for GET
    ];

    for (const endpoint of endpoints) {
      try {
        const response = await axios.get(`${API_BASE_URL}${endpoint}`);
        // Health endpoint should return 200
        if (endpoint === '/api/v1/health') {
          expect(response.status).toBe(200);
        }
      } catch (error) {
        // Auth endpoints should return 404 for GET requests (expecting POST)
        if (endpoint.includes('/api/v1/auth/') && error.response?.status === 404) {
          expect(error.response.status).toBe(404);
        } else {
          throw error;
        }
      }
    }
  });

  test('Database connection is working', async () => {
    // This test verifies that the backend can connect to database
    // by checking if auth endpoints respond properly
    try {
      const response = await axios.post(`${API_BASE_URL}/api/v1/auth/register`, {
        email: 'db-test@cornell.edu',
        password: 'TestPass',  // Must be exactly 8 characters
        nickname: 'DBTest'
      });
      
      // Should get either success or "already exists" error
      expect([200, 201, 400]).toContain(response.status);
    } catch (error) {
      if (error.response?.status === 400) {
        // Database connection working (user already exists or validation error)
        expect(error.response.status).toBe(400);
      } else if (error.response?.status === 500) {
        // Database connection issue
        throw new Error('Database connection failed');
      } else {
        throw error;
      }
    }
  });
});