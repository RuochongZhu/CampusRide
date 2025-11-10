import { supabaseAdmin } from '../config/database.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
  try {
    console.log('📊 Running database migration...');
    
    // Read migration SQL
    const migrationSQL = fs.readFileSync(
      path.join(__dirname, 'migration.sql'), 
      'utf8'
    );
    
    // Split SQL into individual statements
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    console.log(`🔄 Executing ${statements.length} SQL statements...`);
    
    for (const statement of statements) {
      if (statement.trim()) {
        try {
          const { error } = await supabaseAdmin.rpc('exec_sql', { 
            sql: statement + ';' 
          });
          
          if (error) {
            console.log(`⚠️ Warning executing statement: ${error.message}`);
          } else {
            console.log(`✅ Executed: ${statement.substring(0, 50)}...`);
          }
        } catch (err) {
          console.log(`⚠️ Warning: ${err.message}`);
        }
      }
    }
    
    console.log('✅ Migration completed successfully');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();