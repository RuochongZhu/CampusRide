import { supabaseAdmin } from './src/config/database.js';

async function checkSpecificTables() {
  console.log('🔍 Checking specific tables directly...');

  const tablesToCheck = [
    'users',
    'groups',
    'activities',
    'group_messages',
    'activity_comments'
  ];

  for (const tableName of tablesToCheck) {
    console.log(`\n📋 Testing ${tableName}:`);

    try {
      // Try to access the table
      const { data, error, count } = await supabaseAdmin
        .from(tableName)
        .select('*', { count: 'exact' })
        .limit(0);

      if (error) {
        console.log(`❌ Error: ${error.message}`);
      } else {
        console.log(`✅ Table accessible, record count: ${count || 0}`);
      }
    } catch (e) {
      console.log(`❌ Exception: ${e.message}`);
    }
  }

  console.log('\n🎯 Testing table creation directly...');

  // Try to create a simple test table
  try {
    const createTestTableSQL = `
      CREATE TABLE IF NOT EXISTS test_table_existence (
        id SERIAL PRIMARY KEY,
        test_data TEXT
      );
    `;

    await supabaseAdmin.rpc('exec_sql', { sql: createTestTableSQL });
    console.log('✅ Can create tables via RPC');

    // Test if we can access it
    const { data, error } = await supabaseAdmin
      .from('test_table_existence')
      .select('*')
      .limit(0);

    if (error) {
      console.log('❌ Cannot access newly created table:', error.message);
    } else {
      console.log('✅ Can access newly created table');
    }

    // Clean up
    await supabaseAdmin.rpc('exec_sql', { sql: 'DROP TABLE IF EXISTS test_table_existence;' });
    console.log('🧹 Test table cleaned up');

  } catch (e) {
    console.log('❌ Cannot create tables via RPC:', e.message);
  }

  console.log('\n📊 Conclusion:');
  console.log('If most tables show "Could not find in schema cache" but we can create via RPC,');
  console.log('this confirms the schema cache is not updating properly.');
}

checkSpecificTables();