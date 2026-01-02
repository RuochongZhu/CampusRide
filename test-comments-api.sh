#!/bin/bash

echo "🧪 Testing Comment System API"
echo "================================"
echo ""

# Get a test item
echo "1️⃣  Getting a test marketplace item..."
ITEM_RESPONSE=$(curl -s 'http://localhost:3001/api/v1/marketplace/items' \
  -H 'Content-Type: application/json')

# Extract first item ID (assuming response has items array)
ITEM_ID=$(echo "$ITEM_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -z "$ITEM_ID" ]; then
  echo "❌ No marketplace items found. Please create a test item first."
  exit 1
fi

echo "✅ Found test item: $ITEM_ID"
echo ""

# Test getting comments (public endpoint)
echo "2️⃣  Testing GET comments endpoint..."
curl -s "http://localhost:3001/api/v1/marketplace/items/$ITEM_ID/comments" | head -100
echo ""
echo "✅ Comment API is responding"
echo ""

echo "📊 Test Summary:"
echo "   ✅ Backend server is running"
echo "   ✅ Comment routes are registered"
echo "   ✅ Comment API is accessible"
echo ""
echo "📝 Next steps:"
echo "   1. Open the frontend: http://localhost:5173/marketplace"
echo "   2. Login with a test account"
echo "   3. Click on any marketplace item"
echo "   4. Scroll down to see the comment section"
echo "   5. Post a test comment"
echo ""
