import { supabaseAdmin } from '../src/config/database.js';
import fs from 'fs';
import path from 'path';

// Read and execute the migration
const runMigration = async () => {
  try {
    console.log('🚀 Running nickname column migration...');
    
    const migrationPath = path.join(process.cwd(), 'database/migrations/add_nickname_column.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Split by semicolon and execute each statement
    const statements = migrationSQL.split(';').filter(stmt => stmt.trim());
    
    for (const statement of statements) {
      if (statement.trim()) {
        const { error } = await supabaseAdmin.rpc('exec_sql', { sql: statement });
        if (error) {
          console.error('❌ Error executing statement:', statement);
          console.error('Error:', error);
        } else {
          console.log('✅ Executed:', statement.substring(0, 50) + '...');
        }
      }
    }
    
    console.log('✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
};

// Alternative method using raw SQL
const runMigrationAlternative = async () => {
  try {
    console.log('🚀 Running nickname column migration (alternative)...');
    
    // Check if column exists first
    const { data: columns } = await supabaseAdmin
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'users')
      .eq('column_name', 'nickname');
    
    if (columns && columns.length === 0) {
      console.log('Adding nickname column...');
      // Use direct SQL execution via Supabase client
      const { error: addColumnError } = await supabaseAdmin.rpc('exec_sql', {
        sql: "ALTER TABLE users ADD COLUMN nickname VARCHAR(50) NOT NULL DEFAULT '';"
      });
      
      if (addColumnError) {
        console.error('❌ Error adding column:', addColumnError);
        return;
      }
      
      console.log('✅ Nickname column added successfully!');
    } else {
      console.log('✅ Nickname column already exists');
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
};

// Run the migration
runMigrationAlternative();