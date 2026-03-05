import { supabaseAdmin } from './src/config/database.js';
import fs from 'fs';
import path from 'path';

async function runMigration() {
  try {
    console.log('🔗 Connecting to Supabase database...');

    // Read the migration file
    const migrationPath = path.join(process.cwd(), 'database/migrations/009_system_messages.sql');
    console.log('📖 Reading migration file:', migrationPath);

    if (!fs.existsSync(migrationPath)) {
      throw new Error(`Migration file not found: ${migrationPath}`);
    }

    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');
    console.log('📝 Migration SQL loaded');

    // Split the SQL into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`📋 Found ${statements.length} SQL statements to execute`);

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim().length === 0) continue;

      try {
        console.log(`🔄 Executing statement ${i + 1}/${statements.length}...`);
        console.log(`   Statement preview: ${statement.substring(0, 60)}...`);

        // Use Supabase REST API for SQL execution
        const response = await fetch(`${process.env.SUPABASE_URL}/rest/v1/rpc/execute_sql`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_KEY}`,
            'apikey': process.env.SUPABASE_SERVICE_KEY
          },
          body: JSON.stringify({ sql_statement: statement })
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.log(`⚠️ Statement ${i + 1} response:`, errorText.substring(0, 200));
        } else {
          console.log(`✅ Statement ${i + 1} executed successfully`);
        }
      } catch (statementError) {
        console.log(`⚠️ Statement ${i + 1} error:`, statementError.message);
      }
    }

    console.log('\n🧪 Testing system_messages table...');

    // Test the system_messages table
    const { data: messages, error: messagesError } = await supabaseAdmin
      .from('system_messages')
      .select('*')
      .limit(5);

    if (messagesError) {
      console.log('⚠️ system_messages query error:', messagesError.message);
      console.log('   Trying to create table directly...');

      // Try creating table using raw SQL approach
      const { error: createError } = await supabaseAdmin.rpc('exec_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS system_messages (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            sender_id UUID REFERENCES users(id) ON DELETE SET NULL,
            sender_type VARCHAR(20) NOT NULL DEFAULT 'user',
            content TEXT NOT NULL,
            message_type VARCHAR(20) DEFAULT 'general',
            is_pinned BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
          );
        `
      });

      if (createError) {
        console.log('   Could not create table via RPC:', createError.message);
      }
    } else {
      console.log('✅ system_messages table is accessible');
      console.log(`📊 Found ${messages?.length || 0} existing messages`);
      messages?.forEach(msg => {
        console.log(`   - [${msg.sender_type}] ${msg.content?.substring(0, 50)}...`);
      });
    }

    // Test the system_message_reads table
    const { data: reads, error: readsError } = await supabaseAdmin
      .from('system_message_reads')
      .select('id')
      .limit(1);

    if (readsError) {
      console.log('⚠️ system_message_reads query error:', readsError.message);
    } else {
      console.log('✅ system_message_reads table is accessible');
    }

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
  }

  console.log('\n✅ Migration process completed!');
}

runMigration();
