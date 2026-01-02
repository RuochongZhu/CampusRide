import { supabaseAdmin } from '../src/config/database.js';
import dotenv from 'dotenv';

dotenv.config();

const testConnection = async () => {
  console.log('🔍 Testing Supabase connection...\n');
  console.log('Configuration:');
  console.log('- SUPABASE_URL:', process.env.SUPABASE_URL);
  console.log('- SERVICE_KEY present:', !!process.env.SUPABASE_SERVICE_KEY);
  console.log('- ANON_KEY present:', !!process.env.SUPABASE_ANON_KEY);
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  try {
    console.log('1️⃣ Testing basic connection...');
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('count')
      .limit(1);

    if (error) {
      if (error.code === 'PGRST116' || error.message.includes('does not exist')) {
        console.log('⚠️  Users table does not exist yet');
        console.log('\n2️⃣ Checking available tables...');
        
        // 尝试获取所有表
        const { data: tables, error: schemaError } = await supabaseAdmin
          .rpc('exec_sql', { 
            sql: "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';" 
          });
        
        if (schemaError) {
          console.log('❌ Cannot query database schema');
          console.log('Error:', schemaError.message);
        } else {
          console.log('✅ Database is accessible but tables need to be created');
        }
        
        console.log('\n📋 Next Steps:');
        console.log('1. You need to run the database migration to create tables');
        console.log('2. Run: npm run db:init');
        console.log('3. Then create the demo user again');
        
        return false;
      }
      
      console.log('❌ Database error:', error);
      return false;
    }

    console.log('✅ Database connection successful!');
    console.log('Data:', data);
    return true;
  } catch (error) {
    console.log('\n❌ Connection failed!');
    console.log('Error:', error.message);
    console.log('\n🔍 Possible issues:');
    console.log('1. Supabase project might be paused or deleted');
    console.log('2. Network connectivity issues');
    console.log('3. API keys might be invalid');
    console.log('4. Supabase URL might be incorrect');
    console.log('\n📋 Solutions:');
    console.log('1. Check your Supabase project at: https://app.supabase.com');
    console.log('2. Verify the project is active');
    console.log('3. Get fresh API keys from Project Settings > API');
    console.log('4. Update the .env file with correct values');
    return false;
  }
};

testConnection().then(success => {
  process.exit(success ? 0 : 1);
});


