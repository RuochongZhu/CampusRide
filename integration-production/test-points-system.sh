#!/bin/bash

# CampusRide Points System Test Script
# This script tests the points system integration

echo "==========================================  "
echo "  CampusRide Points System Test"
echo "=========================================="
echo ""

# Get token (you need to replace this with your actual token after logging in)
read -p "Enter your auth token (or press Enter to use guest token): " TOKEN

if [ -z "$TOKEN" ]; then
  echo "No token provided. You need to login first."
  echo "1. Visit http://localhost:3002"
  echo "2. Login as a user"
  echo "3. Open browser console and run: localStorage.getItem('userToken')"
  echo "4. Copy the token and run this script again"
  exit 1
fi

BASE_URL="http://localhost:3001/api/v1"

echo "Testing Points System..."
echo ""

# Test 1: Get current points
echo "📊 Test 1: Get Current Points"
echo "--------------------------------------"
POINTS_RESPONSE=$(curl -s -X GET \
  "$BASE_URL/points/me" \
  -H "Authorization: Bearer $TOKEN")

echo "Response: $POINTS_RESPONSE"
CURRENT_POINTS=$(echo $POINTS_RESPONSE | grep -o '"total_points":[0-9]*' | cut -d':' -f2)
echo "✅ Current Points: $CURRENT_POINTS"
echo ""

# Test 2: Get points rules
echo "📋 Test 2: Get Points Rules"
echo "--------------------------------------"
RULES_RESPONSE=$(curl -s -X GET \
  "$BASE_URL/points/rules" \
  -H "Authorization: Bearer $TOKEN")

echo "$RULES_RESPONSE" | grep -o '"[^"]*":\s*{[^}]*}' | head -5
echo "✅ Points rules retrieved"
echo ""

# Test 3: Get points transaction history
echo "📜 Test 3: Get Points Transaction History"
echo "--------------------------------------"
TRANSACTIONS_RESPONSE=$(curl -s -X GET \
  "$BASE_URL/points/transactions/me" \
  -H "Authorization: Bearer $TOKEN")

echo "$TRANSACTIONS_RESPONSE"
echo "✅ Transaction history retrieved"
echo ""

# Test 4: Get user profile with points
echo "👤 Test 4: Get User Profile (Points Display)"
echo "--------------------------------------"
USER_ID=$(echo $POINTS_RESPONSE | grep -o '"user_id":"[^"]*"' | cut -d'"' -f4)
if [ -z "$USER_ID" ]; then
  USER_ID=$(echo $POINTS_RESPONSE | grep -o '"user_id":[0-9]*' | cut -d':' -f2)
fi

if [ ! -z "$USER_ID" ]; then
  PROFILE_RESPONSE=$(curl -s -X GET \
    "$BASE_URL/users/$USER_ID/profile" \
    -H "Authorization: Bearer $TOKEN")

  echo "$PROFILE_RESPONSE" | grep -o '"points":[0-9]*'
  echo "✅ Profile points retrieved"
else
  echo "⚠️  Could not extract user ID"
fi
echo ""

# Test 5: Award manual points (test only)
echo "💎 Test 5: Award Points (Manual Test)"
echo "--------------------------------------"
echo "To award points manually, an admin endpoint is needed."
echo "Points are automatically awarded when:"
echo "  - Creating an activity (+50 points)"
echo "  - Joining an activity (+10 points)"
echo "  - Checking in to activity (+20 points)"
echo "  - Completing a ride (+30 points)"
echo "  - Marketplace transaction (+15 points)"
echo ""

# Test 6: Points statistics
echo "📈 Test 6: Points Statistics"
echo "--------------------------------------"
STATS_RESPONSE=$(curl -s -X GET \
  "$BASE_URL/points/statistics/me" \
  -H "Authorization: Bearer $TOKEN")

echo "$STATS_RESPONSE"
echo "✅ Points statistics retrieved"
echo ""

echo "=========================================="
echo "✅ Points System Test Complete!"
echo "=========================================="
echo ""
echo "Next Steps:"
echo "1. Visit http://localhost:3002 and login"
echo "2. Create an activity to earn +50 points"
echo "3. Join an activity to earn +10 points"
echo "4. Check in to activity to earn +20 points"
echo "5. View your profile at /profile/:userId"
echo "6. Check Points & Rewards tab to see points history"
echo ""
