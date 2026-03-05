import pg from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const { Client } = pg;

// Database configuration
const dbConfig = {
  connectionString: process.env.DATABASE_URL ||
    "postgresql://postgres.jfgenxnqpuutgdnnngsl:CampusRide2024!@aws-0-us-west-1.pooler.supabase.com:6543/postgres",
  ssl: { rejectUnauthorized: false }
};

async function runMigration() {
  const client = new Client(dbConfig);

  try {
    console.log('🔗 Connecting to database...');
    await client.connect();
    console.log('✅ Connected to database');

    // Read the migration file
    const migrationPath = path.join(process.cwd(), 'database/migrations/006_complete_user_system.sql');
    console.log('📖 Reading migration file:', migrationPath);

    if (!fs.existsSync(migrationPath)) {
      throw new Error(`Migration file not found: ${migrationPath}`);
    }

    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');
    console.log('📝 Executing migration...');

    // Execute the migration
    const result = await client.query(migrationSQL);
    console.log('✅ Migration completed successfully!');

    // Test user profile API
    console.log('\n🧪 Testing user profile query...');
    const testResult = await client.query(
      'SELECT id, first_name, last_name, email, avg_rating, total_ratings FROM user_profiles LIMIT 3'
    );

    console.log('📊 Sample users:');
    testResult.rows.forEach(user => {
      console.log(`   - ${user.first_name} ${user.last_name} (${user.email})`);
      if (user.avg_rating) {
        console.log(`     Rating: ⭐ ${user.avg_rating} (${user.total_ratings} reviews)`);
      } else {
        console.log(`     Rating: NEW USER`);
      }
    });

    console.log('\n📊 Testing rating API data...');
    const ratingTest = await client.query(
      'SELECT COUNT(*) as total_ratings, AVG(score) as avg_score FROM ratings'
    );
    console.log(`   Total ratings in system: ${ratingTest.rows[0].total_ratings}`);
    console.log(`   Average rating score: ${parseFloat(ratingTest.rows[0].avg_score).toFixed(2)}`);

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('Full error:', error);
  } finally {
    await client.end();
    console.log('\n✅ Database migration process completed!');
  }
}

runMigration();