#!/usr/bin/env node

/**
 * Test authentication with actual emails from database
 */

import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001';

// Emails visible in the database screenshot
const TEST_EMAILS = [
  'demo@cornell.edu',
  'test-integration@cornell.edu',
  'test@campusride.com',
  'test@cornell.edu',
  'alice@cornell.edu',
  'bob@cornell.edu'
];

// Common passwords to try
const TEST_PASSWORDS = [
  'password',
  'password123',
  '12345678',
  'testpass',
  'campusride'
];

async function testLogin(email, password) {
  try {
    console.log(`🔐 Testing login: ${email} / ${password}`);

    const response = await axios.post(`${API_BASE_URL}/api/v1/auth/login`, {
      email,
      password
    });

    if (response.status === 200 && response.data.success) {
      console.log(`✅ SUCCESS! Login worked for ${email}`);
      console.log(`   Token: ${response.data.data.token.substring(0, 20)}...`);
      console.log(`   User: ${response.data.data.user.first_name} ${response.data.data.user.last_name}`);

      return {
        success: true,
        email,
        password,
        token: response.data.data.token,
        user: response.data.data.user
      };
    }
  } catch (error) {
    const status = error.response?.status;
    const message = error.response?.data?.error?.message || error.message;

    if (status === 401) {
      console.log(`❌ Invalid credentials for ${email}`);
    } else if (status === 400) {
      console.log(`⚠️  Bad request for ${email}: ${message}`);
    } else {
      console.log(`❌ Error for ${email}: ${status} - ${message}`);
    }

    return { success: false, email, password, error: message };
  }
}

async function findValidCredentials() {
  console.log('🔍 Searching for valid credentials in database emails...\n');

  for (const email of TEST_EMAILS) {
    console.log(`📧 Testing email: ${email}`);

    for (const password of TEST_PASSWORDS) {
      const result = await testLogin(email, password);

      if (result.success) {
        console.log('\n🎉 Found valid credentials!');
        console.log('='.repeat(50));
        console.log(`Email: ${result.email}`);
        console.log(`Password: ${result.password}`);
        console.log(`Token: ${result.token.substring(0, 30)}...`);
        console.log(`User: ${result.user.first_name} ${result.user.last_name}`);
        console.log('='.repeat(50));

        return result;
      }

      // Small delay to avoid overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(''); // Empty line between emails
  }

  return null;
}

async function testImageUploadWithAuth(authToken) {
  console.log('\n🖼️  Testing image upload with authentication...\n');

  // Create a simple test image (1x1 pixel PNG in base64)
  const testImageBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

  try {
    const response = await axios.post(
      `${API_BASE_URL}/api/v1/upload/image`,
      {
        image: testImageBase64,
        filename: 'test-pixel.png',
        itemType: 'marketplace'
      },
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.status === 201) {
      console.log('✅ Image upload successful!');
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
  console.log('🚀 Testing authentication with database emails\n');
  console.log(`Backend URL: ${API_BASE_URL}`);
  console.log('='.repeat(60));

  // First find valid credentials
  const validAuth = await findValidCredentials();

  if (!validAuth) {
    console.log('\n❌ No valid credentials found in database emails');
    console.log('\n📋 Recommendations:');
    console.log('   1. Check if users exist in database');
    console.log('   2. Verify password hashing in auth system');
    console.log('   3. Create test user if needed');
    process.exit(1);
  }

  // Test image upload with valid token
  await testImageUploadWithAuth(validAuth.token);

  console.log('\n📋 Next steps:');
  console.log('   1. Test frontend with these credentials');
  console.log('   2. Test ClickableAvatar message functionality');
  console.log('   3. Verify all fixes work in browser');
}

main().catch(error => {
  console.log('\n❌ Test failed:', error.message);
  process.exit(1);
});