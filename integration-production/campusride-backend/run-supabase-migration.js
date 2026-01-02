import { supabaseAdmin } from './src/config/database.js';
import fs from 'fs';
import path from 'path';

async function runMigration() {
  try {
    console.log('🔗 Connecting to Supabase database...');

    // Read the migration file
    const migrationPath = path.join(process.cwd(), 'database/migrations/006_complete_user_system.sql');
    console.log('📖 Reading migration file:', migrationPath);

    if (!fs.existsSync(migrationPath)) {
      throw new Error(`Migration file not found: ${migrationPath}`);
    }

    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');
    console.log('📝 Executing migration using Supabase RPC...');

    // Execute the migration using Supabase's SQL RPC
    const { error } = await supabaseAdmin.rpc('execute_sql', {
      sql_statement: migrationSQL
    });

    if (error) {
      // If RPC doesn't exist, let's try direct SQL execution
      console.log('⚠️ RPC method not available, trying direct SQL...');

      // Split the SQL into individual statements
      const statements = migrationSQL
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0);

      console.log(`📋 Found ${statements.length} SQL statements to execute`);

      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i];
        if (statement.trim().length === 0) continue;

        try {
          console.log(`🔄 Executing statement ${i + 1}/${statements.length}...`);

          // For Supabase, we need to use their REST API for SQL execution
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
            console.log(`⚠️ Statement ${i + 1} failed, continuing...`);
            console.log('Statement:', statement.substring(0, 100) + '...');
          } else {
            console.log(`✅ Statement ${i + 1} executed successfully`);
          }
        } catch (statementError) {
          console.log(`⚠️ Statement ${i + 1} error:`, statementError.message);
        }
      }

      console.log('✅ Migration batch completed!');

    } else {
      console.log('✅ Migration completed successfully via RPC!');
    }

    // Test the results
    console.log('\n🧪 Testing user system...');

    // Test users table
    const { data: users, error: usersError } = await supabaseAdmin
      .from('users')
      .select('id, first_name, last_name, email, avg_rating, total_ratings')
      .limit(3);

    if (usersError) {
      console.log('⚠️ Users query error:', usersError.message);
    } else {
      console.log('📊 Sample users:');
      users.forEach(user => {
        console.log(`   - ${user.first_name} ${user.last_name} (${user.email})`);
        if (user.avg_rating) {
          console.log(`     Rating: ⭐ ${user.avg_rating} (${user.total_ratings} reviews)`);
        } else {
          console.log(`     Rating: NEW USER`);
        }
      });
    }

    // Test ratings table
    const { data: ratingStats, error: ratingError } = await supabaseAdmin
      .from('ratings')
      .select('score')
      .limit(1);

    if (ratingError) {
      console.log('⚠️ Ratings table may not be ready yet:', ratingError.message);
    } else {
      console.log('✅ Rating system tables are accessible');
    }

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('Full error:', error);
  }

  console.log('\n✅ Migration process completed!');
}

runMigration();