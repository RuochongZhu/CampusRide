import { supabaseAdmin } from '../config/database.js';

async function runMigration() {
  try {
    console.log('📊 Running database migration...');
    
    // Add missing columns to users table
    console.log('1. Adding major column to users table...');
    const { error: error1 } = await supabaseAdmin.rpc('sql', {
      query: `ALTER TABLE users ADD COLUMN IF NOT EXISTS major VARCHAR(255);`
    });
    if (error1) console.log('⚠️ Major column:', error1.message);
    
    console.log('2. Adding university column to users table...');
    const { error: error2 } = await supabaseAdmin.rpc('sql', {
      query: `ALTER TABLE users ADD COLUMN IF NOT EXISTS university VARCHAR(255);`
    });
    if (error2) console.log('⚠️ University column:', error2.message);
    
    console.log('3. Adding points column to users table...');
    const { error: error3 } = await supabaseAdmin.rpc('sql', {
      query: `ALTER TABLE users ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 0;`
    });
    if (error3) console.log('⚠️ Points column:', error3.message);
    
    // Update existing records
    console.log('4. Updating existing records with default values...');
    const { error: error4 } = await supabaseAdmin
      .from('users')
      .update({ 
        major: 'Computer Science',
        university: 'Cornell University',
        points: 0 
      })
      .is('major', null);
    if (error4) console.log('⚠️ Update error:', error4.message);
    
    console.log('✅ Migration completed successfully');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    
    // Try alternative approach - direct column addition
    console.log('🔄 Trying alternative approach...');
    try {
      // Update some test records to see if columns exist
      const { data, error } = await supabaseAdmin
        .from('users')
        .select('id, major, university, points')
        .limit(1);
      
      if (error && error.message.includes('does not exist')) {
        console.log('❌ Columns still missing. Please manually add columns to database.');
        console.log('Execute these SQL commands in your Supabase dashboard:');
        console.log('ALTER TABLE users ADD COLUMN major VARCHAR(255);');
        console.log('ALTER TABLE users ADD COLUMN university VARCHAR(255);');
        console.log('ALTER TABLE users ADD COLUMN points INTEGER DEFAULT 0;');
      } else {
        console.log('✅ Columns appear to exist');
      }
    } catch (altError) {
      console.error('❌ Alternative check failed:', altError);
    }
    
    process.exit(1);
  }
}

runMigration();