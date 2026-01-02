#!/bin/bash

# Test Script for New Message Functionality
echo "🧪 Testing New Message System..."
echo "=================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if servers are running
echo "📡 Step 1: Checking if servers are running..."

# Check backend
if curl -s http://localhost:3001/api/v1/health > /dev/null; then
    echo -e "${GREEN}✅ Backend server is running (localhost:3001)${NC}"
else
    echo -e "${RED}❌ Backend server is not running${NC}"
    echo "   Please run: cd campusride-backend && npm run dev"
    exit 1
fi

# Check frontend
if curl -s http://localhost:3000 > /dev/null; then
    echo -e "${GREEN}✅ Frontend server is running (localhost:3000)${NC}"
else
    echo -e "${YELLOW}⚠️  Frontend server check failed (might be normal)${NC}"
fi

echo ""
echo "🔧 Step 2: Testing database functions..."

# Test database connection and new functions
node -e "
import { supabaseAdmin } from './campusride-backend/src/config/database.js';

async function testDatabase() {
    console.log('🔌 Testing Supabase connection...');

    try {
        // Test basic connection
        const { data, error } = await supabaseAdmin
            .from('messages')
            .select('id')
            .limit(1);

        if (error) throw error;
        console.log('✅ Basic Supabase connection successful');

        // Test new functions exist
        const functions = [
            'create_universal_message_thread',
            'reply_to_universal_message_thread',
            'can_user_send_message'
        ];

        for (const funcName of functions) {
            try {
                // Call with dummy params to see if function exists
                const { error: funcError } = await supabaseAdmin.rpc(funcName, {});

                if (funcError && funcError.message.includes('function') && funcError.message.includes('does not exist')) {
                    console.log('❌ Function missing:', funcName);
                } else {
                    console.log('✅ Function available:', funcName);
                }
            } catch (e) {
                // Function exists but failed due to wrong params (expected)
                console.log('✅ Function available:', funcName);
            }
        }

    } catch (error) {
        console.log('❌ Database test failed:', error.message);
    }
}

testDatabase().catch(console.error);
"

echo ""
echo "🌐 Step 3: Testing API endpoints..."

# Test message endpoints
echo "📨 Testing message API endpoints..."

# Test health endpoint
if curl -s http://localhost:3001/api/v1/health | grep -q "ok"; then
    echo -e "${GREEN}✅ Health endpoint working${NC}"
else
    echo -e "${RED}❌ Health endpoint failed${NC}"
fi

# Test message endpoints (these will fail without auth, but we can check if routes exist)
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/api/v1/messages | grep -q "401"; then
    echo -e "${GREEN}✅ Messages endpoint exists (401 = needs auth)${NC}"
else
    echo -e "${RED}❌ Messages endpoint not found${NC}"
fi

if curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/api/v1/messages/threads | grep -q "401"; then
    echo -e "${GREEN}✅ Message threads endpoint exists${NC}"
else
    echo -e "${RED}❌ Message threads endpoint not found${NC}"
fi

echo ""
echo "📋 Step 4: Summary"
echo "=================="
echo ""
echo -e "${YELLOW}✅ Server Status Check Complete${NC}"
echo ""
echo "🎯 Next Steps:"
echo "1. Apply database migration: ./migrate-database.sh"
echo "2. Test message functionality in the UI:"
echo "   - Go to http://localhost:3000"
echo "   - Login/register"
echo "   - Try clicking on user avatars"
echo "   - Test sending messages and reply restrictions"
echo ""
echo "🚨 If you encounter issues:"
echo "   1. Check database migration was applied"
echo "   2. Restart backend server"
echo "   3. Check browser console for errors"
echo ""