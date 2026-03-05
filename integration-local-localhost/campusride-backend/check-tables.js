import { supabaseAdmin } from './src/config/database.js';

async function checkExistingTables() {
  console.log('🔍 Checking existing tables in database...');

  try {
    // Check all tables in the public schema
    const { data: allTables, error: tablesError } = await supabaseAdmin
      .from('information_schema.tables')
      .select('table_name, table_schema')
      .eq('table_schema', 'public')
      .order('table_name');

    if (tablesError) {
      console.log('❌ Error fetching tables:', tablesError);
      return;
    }

    console.log('\n📋 All tables in public schema:');
    allTables.forEach(table => {
      console.log(`  - ${table.table_name}`);
    });

    // Specifically check for our target tables
    const targetTables = ['group_messages', 'activity_comments', 'groups', 'activities', 'users'];
    console.log('\n🎯 Checking specific tables:');

    for (const tableName of targetTables) {
      const tableExists = allTables.some(t => t.table_name === tableName);
      console.log(`  ${tableExists ? '✅' : '❌'} ${tableName}: ${tableExists ? 'EXISTS' : 'NOT FOUND'}`);

      if (tableExists) {
        try {
          // Try to query the table structure
          const { data: columns, error: columnsError } = await supabaseAdmin
            .from('information_schema.columns')
            .select('column_name, data_type, is_nullable')
            .eq('table_name', tableName)
            .eq('table_schema', 'public')
            .order('ordinal_position');

          if (!columnsError && columns) {
            console.log(`    Columns in ${tableName}:`);
            columns.forEach(col => {
              console.log(`      - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'YES' ? '(nullable)' : '(not null)'}`);
            });
          }

          // Try to count records
          const { count, error: countError } = await supabaseAdmin
            .from(tableName)
            .select('*', { count: 'exact', head: true });

          if (!countError) {
            console.log(`    Record count: ${count || 0}`);
          } else {
            console.log(`    ⚠️ Cannot access table for counting: ${countError.message}`);
          }
        } catch (e) {
          console.log(`    ⚠️ Error checking ${tableName}: ${e.message}`);
        }
      }
    }

    console.log('\n🔗 Checking table relationships...');

    // Check foreign key constraints
    const { data: constraints, error: constraintsError } = await supabaseAdmin
      .from('information_schema.table_constraints')
      .select('table_name, constraint_name, constraint_type')
      .eq('table_schema', 'public')
      .eq('constraint_type', 'FOREIGN KEY');

    if (!constraintsError && constraints) {
      console.log('Foreign key constraints:');
      constraints.forEach(constraint => {
        console.log(`  - ${constraint.table_name}: ${constraint.constraint_name}`);
      });
    }

  } catch (error) {
    console.log('❌ Failed to check tables:', error.message);
  }
}

checkExistingTables();