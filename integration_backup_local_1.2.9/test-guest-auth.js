#!/usr/bin/env node

/**
 * Register a test user and verify email to get valid credentials
 */

import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001';

async function registerTestUser() {
  console.log('🔐 Registering test user...\n');

  const testUser = {
    nickname: 'TestUser',
    email: 'testuser123@cornell.edu',
    password: 'TestPass123!' // Meets all requirements: 8+ chars, upper, lower, number
  };

  try {
    console.log(`📝 Registering: ${testUser.email}`);

    const response = await axios.post(`${API_BASE_URL}/api/v1/auth/register`, testUser);

    if (response.status === 201 && response.data.success) {
      console.log('✅ User registration successful!');
      console.log(`   User ID: ${response.data.data.user.id}`);
      console.log(`   Email: ${response.data.data.user.email}`);
      console.log(`   Message: ${response.data.data.message}`);

      return {
        success: true,
        user: response.data.data.user,
        email: testUser.email,
        password: testUser.password
      };
    }
  } catch (error) {
    const status = error.response?.status;
    const message = error.response?.data?.error?.message || error.message;

    if (status === 400 && message.includes('already exists')) {
      console.log('⚠️  User already exists, trying to login...');
      return {
        success: true,
        email: testUser.email,
        password: testUser.password,
        alreadyExists: true
      };
    } else {
      console.log(`❌ Registration failed: ${status} - ${message}`);
      return { success: false, error: message };
    }
  }
}

async function manualVerification(userEmail) {
  console.log(`\n🔍 Manually setting email verification for: ${userEmail}`);

  // This would require direct database access, but let's try guest login instead
  console.log('⚠️  Email verification requires direct database access or email confirmation');
  console.log('   Trying alternative approaches...');

  return false;
}

async function tryGuestLogin() {
  console.log('\n🎭 Trying guest login...\n');

  try {
    console.log('🚀 Attempting guest login...');

    const response = await axios.post(`${API_BASE_URL}/api/v1/auth/guest-login`);

    if (response.status === 200 && response.data.success) {
      console.log('✅ Guest login successful!');
      console.log(`   Token: ${response.data.data.token.substring(0, 20)}...`);
      console.log(`   User: ${response.data.data.user.first_name} ${response.data.data.user.last_name}`);

      return {
        success: true,
        token: response.data.data.token,
        user: response.data.data.user
      };
    }
  } catch (error) {
    const status = error.response?.status;
    const message = error.response?.data?.error?.message || error.message;

    console.log(`❌ Guest login failed: ${status} - ${message}`);
    return { success: false, error: message };
  }
}

async function testImageUploadWithGuestToken(guestToken) {
  console.log('\n🖼️  Testing image upload with guest token...\n');

  // Create a simple test image (1x1 pixel PNG in base64)
  const testImageBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

  try {
    const response = await axios.post(
      `${API_BASE_URL}/api/v1/upload/image`,
      {
        image: testImageBase64,
        filename: 'guest-test-pixel.png',
        itemType: 'marketplace'
      },
      {
        headers: {
          'Authorization': `Bearer ${guestToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.status === 201) {
      console.log('✅ Image upload successful with guest token!');
      console.log(`   URL: ${response.data.data.url}`);
      console.log(`   Filename: ${response.data.data.filename}`);
      console.log(`   Bucket: ${response.data.data.bucket}`);

      return { success: true, data: response.data.data };
    }
  } catch (error) {
    const status = error.response?.status;
    const message = error.response?.data?.error?.message || error.message;

    console.log(`❌ Image upload failed: ${status} - ${message}`);
    return { success: false, error: message };
  }
}

async function main() {
  console.log('🚀 Attempting to get valid authentication\n');
  console.log(`Backend URL: ${API_BASE_URL}`);
  console.log('='.repeat(60));

  // Try registering a new test user
  const registrationResult = await registerTestUser();

  if (registrationResult.success) {
    if (registrationResult.alreadyExists) {
      console.log('\n⚠️  User exists but needs email verification');
    } else {
      console.log('\n✅ Registration successful but needs email verification');
    }
  }

  // Since email verification is complex, let's try guest login
  const guestResult = await tryGuestLogin();

  if (guestResult.success) {
    // Test image upload with guest token
    const uploadResult = await testImageUploadWithGuestToken(guestResult.token);

    if (uploadResult.success) {
      console.log('\n🎉 SUCCESS! Image upload working with guest authentication');
      console.log('\n📋 Next steps:');
      console.log('   1. Use guest login for testing image upload in browser');
      console.log('   2. Test ClickableAvatar message functionality');
      console.log('   3. Set up proper user verification for production');

      // Save credentials for browser testing
      console.log('\n🔑 Guest credentials for browser testing:');
      console.log(`   Use guest login button or these credentials:`);
      console.log(`   Token: ${guestResult.token.substring(0, 30)}...`);
    } else {
      console.log('\n❌ Image upload still failing even with valid authentication');
      console.log('   This suggests there may be other issues with the upload system');
    }
  } else {
    console.log('\n❌ Neither registration nor guest login worked');
    console.log('\n📋 Recommendations:');
    console.log('   1. Check if auth endpoints are properly configured');
    console.log('   2. Verify database connection and user table structure');
    console.log('   3. Check if email verification can be bypassed for testing');
  }
}

main().catch(error => {
  console.log('\n❌ Test failed:', error.message);
  process.exit(1);
});