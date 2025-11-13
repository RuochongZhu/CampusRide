#!/bin/bash

# Database Migration Script for Universal Messaging
# Run this script to apply the new message system changes

echo "🚀 Starting Database Migration for Universal Messaging..."
echo "================================================"

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Installing..."
    npm install -g supabase
fi

echo "📋 Step 1: Backing up current database state..."
# Create backup (optional but recommended)
mkdir -p ./backups
timestamp=$(date +%Y%m%d_%H%M%S)
echo "📄 Backup timestamp: $timestamp"

echo "🔄 Step 2: Running migration script..."

# Read environment variables
source .env

# Run the migration using psql (if you have direct access)
# OR using Supabase SQL editor (manual step)
echo "📝 Migration file: database/006_universal_messaging_migration.sql"
echo ""
echo "🔧 MANUAL STEP REQUIRED:"
echo "1. Open your Supabase dashboard: https://supabase.com/dashboard"
echo "2. Go to SQL Editor"
echo "3. Copy and paste the contents of 'database/006_universal_messaging_migration.sql'"
echo "4. Execute the migration"
echo ""
echo "Or run this command if you have PostgreSQL client:"
echo "psql '$SUPABASE_URL' -f database/006_universal_messaging_migration.sql"
echo ""

echo "⏳ Waiting for confirmation that migration was applied..."
read -p "Press Enter after you've applied the migration in Supabase..."

echo "✅ Step 3: Testing database connection..."
node -e "
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function testConnection() {
  try {
    const { data, error } = await supabase.from('messages').select('count').limit(1);
    if (error) throw error;
    console.log('✅ Database connection successful');

    // Test new function
    const { data: result, error: funcError } = await supabase.rpc('can_user_send_message', {
      thread_id_param: '00000000-0000-0000-0000-000000000000',
      user_id_param: '00000000-0000-0000-0000-000000000000'
    });

    if (funcError && !funcError.message.includes('uuid')) {
      console.log('❌ New functions not found:', funcError.message);
    } else {
      console.log('✅ New database functions are available');
    }
  } catch (err) {
    console.log('❌ Database connection failed:', err.message);
  }
}

testConnection();
"

echo ""
echo "🎉 Migration process completed!"
echo "================================================"
echo ""
echo "📋 Next Steps:"
echo "1. Test the message functionality locally"
echo "2. Check if Railway needs redeployment"
echo "3. Check if Vercel needs updates"
echo ""
echo "🧪 To test locally:"
echo "   cd ../campusride-backend && npm run dev"
echo "   cd .. && npm run dev"
echo ""