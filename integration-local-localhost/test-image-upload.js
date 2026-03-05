#!/usr/bin/env node

/**
 * Test script for marketplace image upload functionality
 * Tests both frontend API integration and backend upload controller
 */

import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Test configuration
const API_BASE_URL = 'http://localhost:3001';
const TEST_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIwZDdjZjU2NC0xZTZkLTQ3NzItYTU1MC0xYmY2MDc0MjAyNjkiLCJ0eXBlIjoiYWNjZXNzIiwiaWF0IjoxNzYzMjUwNDM2LCJleHAiOjE3NjMzMzY4MzZ9.TYKdJiVOoS3Pb0vVGnYlBDp_W0-JHhDYoUqL5dN6jf8';

// Create axios instance
const api = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${TEST_TOKEN}`
  },
  timeout: 30000,
});

// Test utilities
const createTestImageBase64 = () => {
  // Create a minimal valid PNG image in base64 format
  // This is a 1x1 pixel red PNG image
  const base64Data = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAHAKHGEIwAAAABJRU5ErkJggg==';
  return `data:image/png;base64,${base64Data}`;
};

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Test functions
async function testImageUpload() {
  console.log('🧪 Testing marketplace image upload...\n');

  try {
    // Test 1: Valid image upload
    console.log('📤 Test 1: Uploading valid PNG image...');
    const testImage = createTestImageBase64();

    const uploadResponse = await api.post('/upload/image', {
      image: testImage,
      filename: 'test-image.png',
      itemType: 'marketplace'
    });

    if (uploadResponse.data.success) {
      console.log('✅ Upload successful!');
      console.log(`   - Filename: ${uploadResponse.data.data.filename}`);
      console.log(`   - URL: ${uploadResponse.data.data.url}`);
      console.log(`   - Bucket: ${uploadResponse.data.data.bucket}`);

      // Store filename for deletion test
      const uploadedFilename = uploadResponse.data.data.filename;

      // Test 2: Delete uploaded image
      console.log('\n🗑️  Test 2: Deleting uploaded image...');
      const deleteResponse = await api.delete(`/upload/image/${uploadedFilename}`);

      if (deleteResponse.data.success) {
        console.log('✅ Delete successful!');
      } else {
        console.log('❌ Delete failed:', deleteResponse.data);
      }
    } else {
      console.log('❌ Upload failed:', uploadResponse.data);
    }

    // Test 3: Invalid image format
    console.log('\n🚫 Test 3: Testing invalid image format...');
    try {
      await api.post('/upload/image', {
        image: 'invalid-base64-data',
        filename: 'invalid.png',
        itemType: 'marketplace'
      });
      console.log('❌ Should have failed but didn\'t');
    } catch (error) {
      if (error.response?.status === 400) {
        console.log('✅ Correctly rejected invalid image format');
        console.log(`   - Error: ${error.response.data.error.message}`);
      } else {
        console.log('❌ Unexpected error:', error.response?.data || error.message);
      }
    }

    // Test 4: Missing required fields
    console.log('\n🚫 Test 4: Testing missing required fields...');
    try {
      await api.post('/upload/image', {
        filename: 'test.png'
        // Missing image field
      });
      console.log('❌ Should have failed but didn\'t');
    } catch (error) {
      if (error.response?.status === 400) {
        console.log('✅ Correctly rejected missing image field');
        console.log(`   - Error: ${error.response.data.error.message}`);
      } else {
        console.log('❌ Unexpected error:', error.response?.data || error.message);
      }
    }

  } catch (error) {
    console.log('❌ Test failed:', error.response?.data || error.message);
    return false;
  }

  return true;
}

async function testMarketplaceItemCreation() {
  console.log('\n🛍️  Testing marketplace item creation with images...\n');

  try {
    // First upload an image
    console.log('📤 Step 1: Uploading image for marketplace item...');
    const testImage = createTestImageBase64();

    const uploadResponse = await api.post('/upload/image', {
      image: testImage,
      filename: 'marketplace-test.png',
      itemType: 'marketplace'
    });

    if (!uploadResponse.data.success) {
      throw new Error('Failed to upload test image');
    }

    const imageUrl = uploadResponse.data.data.url;
    console.log(`✅ Image uploaded: ${imageUrl}`);

    // Create marketplace item with image
    console.log('\n📦 Step 2: Creating marketplace item with uploaded image...');
    const itemResponse = await api.post('/marketplace/items', {
      title: 'Test Item with Image',
      description: 'This is a test item with an uploaded image',
      price: 25.99,
      category: 'Electronics',
      condition: 'like_new',
      location: 'Cornell University',
      tags: ['test', 'electronics'],
      images: [imageUrl]
    });

    if (itemResponse.data.success) {
      console.log('✅ Marketplace item created successfully!');
      console.log(`   - Item ID: ${itemResponse.data.data.item.id}`);
      console.log(`   - Title: ${itemResponse.data.data.item.title}`);
      console.log(`   - Images: ${itemResponse.data.data.item.images?.length || 0} image(s)`);

      // Clean up - delete the item
      const itemId = itemResponse.data.data.item.id;
      await api.delete(`/marketplace/items/${itemId}`);
      console.log('🧹 Cleaned up test item');

    } else {
      console.log('❌ Failed to create marketplace item:', itemResponse.data);
    }

    // Clean up - delete uploaded image
    const filename = uploadResponse.data.data.filename;
    await api.delete(`/upload/image/${filename}`);
    console.log('🧹 Cleaned up test image');

  } catch (error) {
    console.log('❌ Test failed:', error.response?.data || error.message);
    return false;
  }

  return true;
}

// Main test runner
async function runTests() {
  console.log('🚀 Starting marketplace image upload tests...\n');
  console.log('Backend URL:', API_BASE_URL);
  console.log('Test user token:', TEST_TOKEN.substring(0, 50) + '...\n');

  // Test backend connectivity
  try {
    console.log('🔍 Testing backend connectivity...');
    const healthResponse = await api.get('/health');
    console.log('✅ Backend is responding\n');
  } catch (error) {
    console.log('❌ Backend is not responding:', error.message);
    console.log('Please ensure the backend is running on port 3001\n');
    process.exit(1);
  }

  let allTestsPassed = true;

  // Run image upload tests
  const uploadTestResult = await testImageUpload();
  allTestsPassed = allTestsPassed && uploadTestResult;

  await sleep(1000); // Brief pause between test suites

  // Run marketplace integration tests
  const marketplaceTestResult = await testMarketplaceItemCreation();
  allTestsPassed = allTestsPassed && marketplaceTestResult;

  // Final results
  console.log('\n' + '='.repeat(50));
  if (allTestsPassed) {
    console.log('🎉 All tests PASSED! Image upload functionality is working correctly.');
  } else {
    console.log('❌ Some tests FAILED. Please check the errors above.');
    process.exit(1);
  }
  console.log('='.repeat(50));
}

// Error handling
process.on('unhandledRejection', (reason, promise) => {
  console.log('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Run tests
runTests().catch(error => {
  console.log('❌ Test runner failed:', error);
  process.exit(1);
});