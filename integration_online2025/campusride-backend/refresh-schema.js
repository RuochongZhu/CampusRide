import { supabaseAdmin } from './src/config/database.js';

async function refreshSchema() {
  console.log('🔄 Refreshing Supabase schema cache...');

  try {
    // Force schema refresh by making a direct query
    const { data, error } = await supabaseAdmin.rpc('get_schema_version');
    console.log('Schema version check:', data, error);

    // Alternative: try to refresh by querying information_schema
    const { data: tables, error: tablesError } = await supabaseAdmin
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['group_messages', 'activity_comments']);

    console.log('Tables found:', tables);

    // Direct test of our tables
    console.log('\n🧪 Testing table access...');

    try {
      const { data: gmTest, error: gmError } = await supabaseAdmin
        .from('group_messages')
        .select('*')
        .limit(1);
      console.log('✅ group_messages accessible:', !gmError);
      if (gmError) console.log('Error:', gmError);
    } catch (e) {
      console.log('❌ group_messages error:', e.message);
    }

    try {
      const { data: acTest, error: acError } = await supabaseAdmin
        .from('activity_comments')
        .select('*')
        .limit(1);
      console.log('✅ activity_comments accessible:', !acError);
      if (acError) console.log('Error:', acError);
    } catch (e) {
      console.log('❌ activity_comments error:', e.message);
    }

    // Force schema cache refresh by creating a dummy function
    const refreshSQL = `
      CREATE OR REPLACE FUNCTION refresh_schema_cache()
      RETURNS void AS $$
      BEGIN
        NOTIFY schema_change, 'refresh';
      END;
      $$ LANGUAGE plpgsql;
    `;

    try {
      await supabaseAdmin.rpc('exec_sql', { sql: refreshSQL });
      await supabaseAdmin.rpc('refresh_schema_cache');
      console.log('✅ Schema cache refresh triggered');
    } catch (e) {
      console.log('ℹ️ Schema refresh attempt:', e.message);
    }

  } catch (error) {
    console.log('❌ Schema refresh failed:', error.message);
  }
}

refreshSchema();