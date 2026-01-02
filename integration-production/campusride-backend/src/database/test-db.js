import { supabaseAdmin } from '../config/database.js';

async function testDatabase() {
  try {
    console.log('🔍 Testing database connection and schema...');
    
    // Test 1: Check if we can connect to users table
    console.log('\n1. Testing users table...');
    const { data: users, error: usersError } = await supabaseAdmin
      .from('users')
      .select('id, student_id, first_name, last_name, email, verification_status, major, university, points')
      .limit(5);
    
    if (usersError) {
      console.log('❌ Users query error:', usersError.message);
    } else {
      console.log(`✅ Found ${users.length} users`);
      if (users.length > 0) {
        console.log('📋 Sample user:', users[0]);
      }
    }
    
    // Test 2: Check verified users count
    console.log('\n2. Testing verified users...');
    const { data: verifiedUsers, error: verifiedError } = await supabaseAdmin
      .from('users')
      .select('id, first_name, last_name, points')
      .eq('verification_status', 'verified')
      .limit(10);
    
    if (verifiedError) {
      console.log('❌ Verified users error:', verifiedError.message);
    } else {
      console.log(`✅ Found ${verifiedUsers.length} verified users`);
      verifiedUsers.forEach(user => {
        console.log(`   - ${user.first_name} ${user.last_name}: ${user.points} points`);
      });
    }
    
    // Test 3: Check point_rules table
    console.log('\n3. Testing point_rules table...');
    const { data: pointRules, error: rulesError } = await supabaseAdmin
      .from('point_rules')
      .select('*')
      .limit(5);
    
    if (rulesError) {
      console.log('❌ Point rules error:', rulesError.message);
    } else {
      console.log(`✅ Found ${pointRules.length} point rules`);
      pointRules.forEach(rule => {
        console.log(`   - ${rule.name}: ${rule.base_points} points`);
      });
    }
    
    // Test 4: Check point_transactions table
    console.log('\n4. Testing point_transactions table...');
    const { data: transactions, error: transError } = await supabaseAdmin
      .from('point_transactions')
      .select('*')
      .limit(5);
    
    if (transError) {
      console.log('❌ Point transactions error:', transError.message);
    } else {
      console.log(`✅ Found ${transactions.length} point transactions`);
      transactions.forEach(trans => {
        console.log(`   - User ${trans.user_id}: +${trans.points} points (${trans.rule_type})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Database test failed:', error);
  }
}

testDatabase();