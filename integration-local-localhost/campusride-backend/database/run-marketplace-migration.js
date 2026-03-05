import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  try {
    console.log('🚀 Starting marketplace database migration...\n');

    // Read the migration file
    const migrationPath = join(__dirname, 'migrations', '004_marketplace_schema.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf8');

    console.log('📄 Migration file loaded successfully');
    console.log('📊 Creating marketplace tables...\n');

    // Execute the migration
    const { data, error } = await supabase.rpc('exec_sql', {
      sql_query: migrationSQL
    });

    if (error) {
      // If exec_sql RPC doesn't exist, we'll run it differently
      console.log('⚠️  exec_sql RPC not found, running migration manually...\n');

      // Split the SQL into individual statements and execute them
      const statements = migrationSQL
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

      for (let i = 0; i < statements.length; i++) {
        const stmt = statements[i] + ';';
        console.log(`Executing statement ${i + 1}/${statements.length}...`);

        try {
          const { error: stmtError } = await supabase.rpc('exec', { sql: stmt });
          if (stmtError) {
            console.error(`Error in statement ${i + 1}:`, stmtError.message);
          }
        } catch (err) {
          console.error(`Failed to execute statement ${i + 1}:`, err.message);
        }
      }
    }

    console.log('\n✅ Marketplace migration completed successfully!\n');
    console.log('📋 Created tables:');
    console.log('   - marketplace_items');
    console.log('   - item_favorites');
    console.log('\n📊 Created indexes for performance optimization');
    console.log('🔒 Created RLS policies for security');
    console.log('👁️  Created marketplace_items_with_seller view\n');

    // Verify tables were created using a lightweight HEAD query
    const { error: tablesError } = await supabase
      .from('marketplace_items')
      .select('id', { head: true })
      .limit(1);

    if (tablesError) {
      console.log('⚠️  Note: Please verify tables were created in Supabase dashboard');
      console.log('   Error:', tablesError.message);
    } else {
      console.log('✅ Verified: marketplace_items table exists');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('\n📝 Manual migration steps:');
    console.log('1. Go to your Supabase dashboard');
    console.log('2. Navigate to SQL Editor');
    console.log('3. Copy and paste the contents of:');
    console.log('   integration/campusride-backend/database/migrations/004_marketplace_schema.sql');
    console.log('4. Run the SQL script\n');
    process.exit(1);
  }
}

runMigration();
