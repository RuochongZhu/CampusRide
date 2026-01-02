import { supabaseAdmin } from './src/config/database.js';
import fs from 'fs';

async function runNicknameMigration() {
  try {
    console.log('🔄 Running nickname column migration...');

    // Read the SQL migration file
    const sqlContent = fs.readFileSync('./database/migrations/add_nickname_column.sql', 'utf8');

    // Split into individual statements and execute
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    for (const statement of statements) {
      if (statement.trim()) {
        console.log('📝 Executing:', statement.substring(0, 100) + '...');

        const { data, error } = await supabaseAdmin.rpc('execute_sql', {
          sql_query: statement
        });

        if (error) {
          console.error('❌ SQL Error:', error);
          throw error;
        }

        console.log('✅ Statement executed successfully');
      }
    }

    console.log('🎉 Nickname migration completed successfully!');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

// Try direct approach first
async function directMigration() {
  try {
    console.log('🔄 Running direct nickname migration...');

    // Check if nickname column exists
    const { data: columns, error: columnError } = await supabaseAdmin
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'users')
      .eq('column_name', 'nickname');

    if (columnError) {
      console.error('❌ Error checking columns:', columnError);
    } else if (columns && columns.length > 0) {
      console.log('✅ Nickname column already exists');
      return true;
    }

    // Try using SQL function approach
    const { data, error } = await supabaseAdmin
      .rpc('sql', {
        query: `
          DO $$
          BEGIN
            IF NOT EXISTS (
              SELECT 1 FROM information_schema.columns
              WHERE table_name = 'users' AND column_name = 'nickname'
            ) THEN
              ALTER TABLE users ADD COLUMN nickname VARCHAR(50) NOT NULL DEFAULT '';
              CREATE INDEX IF NOT EXISTS idx_users_nickname ON users(nickname);
              UPDATE users SET nickname = COALESCE(NULLIF(nickname, ''), first_name) WHERE nickname = '' OR nickname IS NULL;
            END IF;
          END $$;
        `
      });

    if (error) {
      console.error('❌ Direct migration error:', error);
      return false;
    }

    console.log('✅ Direct migration completed successfully');
    return true;

  } catch (error) {
    console.error('❌ Direct migration failed:', error.message);
    return false;
  }
}

// Start migration
directMigration().then(success => {
  if (!success) {
    console.log('🔄 Trying alternative approach...');
    return runNicknameMigration();
  }
}).catch(error => {
  console.error('❌ Migration failed completely:', error);
  process.exit(1);
});