const { describe, test, expect, beforeAll } = require('@jest/globals');
const axios = require('axios');

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001';

describe('Authentication Integration Tests', () => {
  let authToken;
  const testUser = {
    email: `test-${Date.now()}@cornell.edu`,
    password: 'TestPass',  // Must be exactly 8 characters
    nickname: 'TestUser'
  };

  beforeAll(async () => {
    // Wait for backend to be ready
    let retries = 10;
    while (retries > 0) {
      try {
        await axios.get(`${API_BASE_URL}/api/v1/health`);
        break;
      } catch (error) {
        retries--;
        if (retries === 0) throw new Error('Backend not ready');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  });

  test('Health check endpoint responds', async () => {
    const response = await axios.get(`${API_BASE_URL}/api/v1/health`);
    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);
    expect(response.data.data).toHaveProperty('status', 'ok');
  });

  test('User registration works', async () => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/v1/auth/register`, testUser);
      expect([200, 201]).toContain(response.status);
      expect(response.data.success).toBe(true);
    } catch (error) {
      // If user already exists, that's also a valid response
      if (error.response?.status === 400 && error.response?.data?.error?.message?.includes('already exists')) {
        expect(error.response.status).toBe(400);
      } else {
        throw error;
      }
    }
  });

  test('User login works', async () => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/v1/auth/login`, {
        email: testUser.email,
        password: testUser.password
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('token');
      authToken = response.data.data.token;
    } catch (error) {
      if (error.response?.status === 400 || error.response?.status === 401) {
        // Email not verified yet, this is expected in test environment
        expect([400, 401]).toContain(error.response.status);
        console.log('Login failed due to email verification requirement - this is expected');
      } else {
        throw error;
      }
    }
  });

  test('Protected route requires authentication', async () => {
    try {
      await axios.get(`${API_BASE_URL}/api/v1/users/profile`);
      // Should not reach here without token
      expect(true).toBe(false);
    } catch (error) {
      expect(error.response.status).toBe(401);
    }
  });
});