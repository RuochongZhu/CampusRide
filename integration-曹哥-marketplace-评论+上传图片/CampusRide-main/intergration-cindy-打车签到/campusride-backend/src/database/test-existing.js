import { supabaseAdmin } from '../config/database.js';

async function testExistingSchema() {
  try {
    console.log('🔍 Testing existing database schema...');
    
    // Test 1: Check users table structure
    console.log('\n1. Testing users table basic fields...');
    const { data: users, error: usersError } = await supabaseAdmin
      .from('users')
      .select('id, student_id, first_name, last_name, email, verification_status, created_at')
      .limit(5);
    
    if (usersError) {
      console.log('❌ Users query error:', usersError.message);
    } else {
      console.log(`✅ Found ${users.length} users`);
      if (users.length > 0) {
        console.log('📋 Sample user:');
        users.forEach(user => {
          console.log(`   - ${user.first_name} ${user.last_name} (${user.verification_status})`);
        });
      }
    }
    
    // Test 2: Check verified users specifically
    console.log('\n2. Testing verified users count...');
    const { data: verifiedUsers, error: verifiedError } = await supabaseAdmin
      .from('users')
      .select('id, first_name, last_name, verification_status')
      .eq('verification_status', 'verified')
      .limit(10);
    
    if (verifiedError) {
      console.log('❌ Verified users error:', verifiedError.message);
    } else {
      console.log(`✅ Found ${verifiedUsers.length} verified users`);
      if (verifiedUsers.length === 0) {
        console.log('⚠️ No verified users found. Checking all users...');
        
        const { data: allUsers, error: allError } = await supabaseAdmin
          .from('users')
          .select('id, first_name, last_name, verification_status')
          .limit(10);
          
        if (!allError && allUsers.length > 0) {
          console.log(`📋 All users (${allUsers.length})::`);
          allUsers.forEach(user => {
            console.log(`   - ${user.first_name} ${user.last_name} (status: ${user.verification_status})`);
          });
        }
      }
    }
    
    // Test 3: Test the leaderboard service directly
    console.log('\n3. Testing leaderboard service...');
    // We'll import and test the service here
    
  } catch (error) {
    console.error('❌ Database test failed:', error);
  }
}

testExistingSchema();