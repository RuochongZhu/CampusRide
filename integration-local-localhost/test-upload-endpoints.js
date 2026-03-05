#!/usr/bin/env node

/**
 * Simple test to verify upload endpoint structure without authentication
 */

import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001';

async function testEndpointStructure() {
  console.log('🧪 Testing upload endpoint structure...\n');

  try {
    // Test without authentication - should return 401 but confirm endpoint exists
    console.log('📡 Testing POST /api/v1/upload/image endpoint...');
    const response = await axios.post(`${API_BASE_URL}/api/v1/upload/image`, {
      image: 'test',
      filename: 'test.png'
    });
    console.log('❌ Should have returned 401 but got:', response.status);
  } catch (error) {
    if (error.response?.status === 401) {
      console.log('✅ Upload endpoint exists and requires authentication');
      console.log(`   - Status: ${error.response.status}`);
      console.log(`   - Error: ${error.response.data.error.message}`);
    } else if (error.response?.status === 404) {
      console.log('❌ Upload endpoint not found (404)');
      return false;
    } else {
      console.log('⚠️  Unexpected response:', error.response?.status, error.response?.data);
    }
  }

  try {
    // Test DELETE endpoint structure
    console.log('\n📡 Testing DELETE /api/v1/upload/image/test-file endpoint...');
    const response = await axios.delete(`${API_BASE_URL}/api/v1/upload/image/test-file`);
    console.log('❌ Should have returned 401 but got:', response.status);
  } catch (error) {
    if (error.response?.status === 401) {
      console.log('✅ Delete endpoint exists and requires authentication');
      console.log(`   - Status: ${error.response.status}`);
      console.log(`   - Error: ${error.response.data.error.message}`);
    } else if (error.response?.status === 404) {
      console.log('❌ Delete endpoint not found (404)');
      return false;
    } else {
      console.log('⚠️  Unexpected response:', error.response?.status, error.response?.data);
    }
  }

  return true;
}

async function testBackendHealth() {
  console.log('🔍 Testing backend health...\n');

  try {
    const response = await axios.get(`${API_BASE_URL}/api/v1/health`);
    console.log('✅ Backend is healthy');
    console.log(`   - Status: ${response.data.status}`);
    console.log(`   - Message: ${response.data.message}\n`);
    return true;
  } catch (error) {
    console.log('❌ Backend health check failed:', error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Testing image upload infrastructure...\n');
  console.log(`Backend URL: ${API_BASE_URL}`);
  console.log('='.repeat(50));

  const healthOk = await testBackendHealth();
  if (!healthOk) {
    console.log('❌ Backend is not healthy. Exiting.');
    process.exit(1);
  }

  const endpointsOk = await testEndpointStructure();

  console.log('\n' + '='.repeat(50));
  if (endpointsOk) {
    console.log('🎉 Upload endpoints are configured correctly!');
    console.log('');
    console.log('📋 Next steps to test full functionality:');
    console.log('   1. Open browser to http://localhost:3000');
    console.log('   2. Navigate to Marketplace');
    console.log('   3. Click "Post Item" button');
    console.log('   4. Try uploading an image');
    console.log('   5. Check if image preview appears');
    console.log('   6. Submit the form and verify');
  } else {
    console.log('❌ Upload endpoints not configured properly');
    process.exit(1);
  }
  console.log('='.repeat(50));
}

main().catch(error => {
  console.log('❌ Test failed:', error.message);
  process.exit(1);
});